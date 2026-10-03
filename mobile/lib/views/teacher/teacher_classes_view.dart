import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../core/widgets/stat_card.dart';
import '../../core/widgets/status_badge.dart';
import '../../data/models/student_model.dart';
import '../../data/services/api_client.dart';

class TeacherClassesView extends StatefulWidget {
  const TeacherClassesView({super.key});

  @override
  State<TeacherClassesView> createState() => _TeacherClassesViewState();
}

class _TeacherClassesViewState extends State<TeacherClassesView> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _assignments = [];
  List<StudentModel> _allStudents = [];
  String _searchQuery = '';
  String? _selectedAssignmentId;

  @override
  void initState() {
    super.initState();
    _loadClassesData();
  }

  Future<void> _loadClassesData() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        ApiClient.getList('/api/teacher-assignments')
            .catchError((_) => <Map<String, dynamic>>[]),
        ApiClient.getStudents()
            .catchError((_) => <StudentModel>[]),
      ]);

      if (!mounted) return;
      setState(() {
        _assignments = results[0] as List<Map<String, dynamic>>;
        _allStudents = results[1] as List<StudentModel>;
        if (_assignments.isNotEmpty && _selectedAssignmentId == null) {
          _selectedAssignmentId = _assignments.first['id']?.toString();
        }
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  List<StudentModel> _studentsForAssignment(Map<String, dynamic> asg) {
    final classId = asg['class_id']?.toString() ?? '';
    final sectionId = asg['section_id']?.toString() ?? '';
    final className = (asg['class_name'] ?? '').toString().toLowerCase().trim();
    final sectionName = (asg['section_name'] ?? '').toString().toLowerCase().trim();

    return _allStudents.where((s) {
      if (classId.isNotEmpty && s.classId.isNotEmpty) {
        final matchClass = s.classId == classId;
        final matchSection = sectionId.isEmpty || s.sectionId == sectionId;
        return matchClass && matchSection;
      }
      // Fallback by name
      final sClass = s.className.toLowerCase().trim();
      final sSection = s.section.toLowerCase().trim();
      final matchClass = sClass.contains(className) || className.contains(sClass);
      final matchSection = sectionName.isEmpty || sSection == sectionName;
      return matchClass && matchSection;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final filteredAssignments = _assignments.where((a) {
      if (_searchQuery.isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      final cName = (a['class_name'] ?? '').toString().toLowerCase();
      final sName = (a['section_name'] ?? '').toString().toLowerCase();
      final sub = (a['subject_name'] ?? a['subject'] ?? '').toString().toLowerCase();
      return cName.contains(q) || sName.contains(q) || sub.contains(q);
    }).toList();

    return RefreshIndicator(
      onRefresh: _loadClassesData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title
            const Text(
              'My Assigned Classes',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'View your classroom assignments and student enrollment lists.',
              style: TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),

            if (_loading) ...[
              const SizedBox(height: AppSpacing.lg),
              const LinearProgressIndicator(minHeight: 2),
            ],

            if (_error != null) ...[
              const SizedBox(height: AppSpacing.md),
              Card(
                color: AppColors.dangerLight,
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline,
                          color: AppColors.danger, size: 20),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Text(
                          _error!,
                          style: const TextStyle(
                              color: AppColors.danger, fontSize: 13),
                        ),
                      ),
                      TextButton(
                        onPressed: _loadClassesData,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
            ],

            const SizedBox(height: AppSpacing.lg),

            // Top Stats Row
            Row(
              children: [
                Expanded(
                  child: StatCard(
                    title: 'Total Classes',
                    value: '${_assignments.length}',
                    subtitle: 'Teaching assignments',
                    iconName: 'graduation_cap',
                    iconColor: AppColors.primary,
                    iconBgColor: AppColors.primaryLight,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: StatCard(
                    title: 'Total Students',
                    value: '${_allStudents.length}',
                    subtitle: 'Enrolled students',
                    iconName: 'attendance',
                    iconColor: AppColors.info,
                    iconBgColor: AppColors.infoLight,
                  ),
                ),
              ],
            ),

            const SizedBox(height: AppSpacing.lg),

            // Search Bar
            TextField(
              onChanged: (val) => setState(() => _searchQuery = val.trim()),
              decoration: InputDecoration(
                hintText: 'Search by class, section, or subject...',
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () => setState(() => _searchQuery = ''),
                      )
                    : null,
              ),
            ),

            const SizedBox(height: AppSpacing.lg),

            // Classes List
            if (filteredAssignments.isEmpty && !_loading)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(AppSpacing.xl),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(Icons.school_outlined,
                            size: 40, color: AppColors.textMuted),
                        SizedBox(height: AppSpacing.sm),
                        Text(
                          'No assigned classes found.',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else
              ...filteredAssignments.map((asg) => _buildClassCard(asg)),
          ],
        ),
      ),
    );
  }

  Widget _buildClassCard(Map<String, dynamic> asg) {
    final asgId = asg['id']?.toString() ?? '';
    final className = asg['class_name'] ?? 'Class';
    final sectionName = asg['section_name'] ?? '';
    final subject = asg['subject_name'] ?? asg['subject'] ?? 'General';
    final classStudents = _studentsForAssignment(asg);
    final isExpanded = _selectedAssignmentId == asgId;

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Column(
        children: [
          ListTile(
            onTap: () {
              setState(() {
                _selectedAssignmentId = isExpanded ? null : asgId;
              });
            },
            leading: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              alignment: Alignment.center,
              child: const Icon(Icons.class_, color: AppColors.primary, size: 22),
            ),
            title: Text(
              '$className${sectionName.isNotEmpty ? ' - $sectionName' : ''}',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 15,
                color: AppColors.textPrimary,
              ),
            ),
            subtitle: Text(
              'Subject: $subject',
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 12,
              ),
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Text(
                    '${classStudents.length} Students',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryDark,
                    ),
                  ),
                ),
                const SizedBox(width: 4),
                Icon(
                  isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                  color: AppColors.textSecondary,
                ),
              ],
            ),
          ),
          if (isExpanded) ...[
            const Divider(height: 1),
            if (classStudents.isEmpty)
              const Padding(
                padding: EdgeInsets.all(AppSpacing.lg),
                child: Center(
                  child: Text(
                    'No enrolled students found in this section.',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                itemCount: classStudents.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final s = classStudents[index];
                  return ListTile(
                    dense: true,
                    leading: CircleAvatar(
                      radius: 16,
                      backgroundColor: AppColors.primaryLight,
                      child: Text(
                        s.fullName.isNotEmpty ? s.fullName[0].toUpperCase() : 'S',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primaryDark,
                        ),
                      ),
                    ),
                    title: Text(
                      s.fullName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    subtitle: Text(
                      'Roll: ${s.rollNumber.isNotEmpty ? s.rollNumber : '-'} • Reg: ${s.admissionNumber}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    trailing: s.attendancePercentage > 0
                        ? StatusBadge(
                            label: '${s.attendancePercentage.toStringAsFixed(0)}% Att.',
                            type: s.attendancePercentage >= 85
                                ? BadgeType.success
                                : BadgeType.warning,
                          )
                        : null,
                  );
                },
              ),
          ],
        ],
      ),
    );
  }
}
