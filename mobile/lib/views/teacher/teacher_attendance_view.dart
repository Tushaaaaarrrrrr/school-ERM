import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/widgets/status_badge.dart';
import '../../data/models/student_model.dart';
import '../../data/services/api_client.dart';
import '../../data/services/auth_service.dart';

class TeacherAttendanceView extends StatefulWidget {
  const TeacherAttendanceView({super.key});

  @override
  State<TeacherAttendanceView> createState() => _TeacherAttendanceViewState();
}

class _ClassSectionOption {
  final String classId;
  final String sectionId;
  final String className;
  final String sectionName;

  const _ClassSectionOption({
    required this.classId,
    required this.sectionId,
    required this.className,
    required this.sectionName,
  });

  String get label => '$className${sectionName.isNotEmpty ? ' - $sectionName' : ''}';
  String get key => '$classId:$sectionId';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is _ClassSectionOption &&
          runtimeType == other.runtimeType &&
          key == other.key;

  @override
  int get hashCode => key.hashCode;
}

class _TeacherAttendanceViewState extends State<TeacherAttendanceView> {
  DateTime _selectedDate = DateTime.now();
  List<_ClassSectionOption> _options = [];
  _ClassSectionOption? _selectedOption;
  List<Map<String, dynamic>> _allRosterStudents = [];
  List<Map<String, dynamic>> _filteredStudents = [];
  final Map<String, String> _attendanceMap = {}; // studentId -> 'present' | 'absent' | 'partial' | 'leave'
  final Map<String, String> _remarksMap = {};

  bool _loading = true;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadRosterAndAttendance();
  }

  String get _dateStr => DateFormat('yyyy-MM-dd').format(_selectedDate);

  Future<void> _loadRosterAndAttendance() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final roster = await ApiClient.getList('/api/attendance/students', {
        'roster': 'true',
        'date': _dateStr,
      }).catchError((_) => <Map<String, dynamic>>[]);

      List<Map<String, dynamic>> students = roster;
      if (students.isEmpty) {
        // Fallback to teacher assignments and students list if roster endpoint returned empty
        final asgs = await ApiClient.getList('/api/teacher-assignments')
            .catchError((_) => <Map<String, dynamic>>[]);
        final allStudents = await ApiClient.getStudents()
            .catchError((_) => <StudentModel>[]);

        students = allStudents.map((s) => {
          'id': s.id,
          'full_name': s.fullName,
          'admission_number': s.admissionNumber,
          'current_enrollment': {
            'class_id': s.classId,
            'class_name': s.className,
            'section_id': s.sectionId,
            'section_name': s.section,
          },
        }).toList();

        // Also enrich with class assignments if available
        if (asgs.isNotEmpty && students.isEmpty) {
          for (final a in asgs) {
            students.add({
              'id': 'mock-${a['id']}',
              'full_name': 'Student',
              'current_enrollment': {
                'class_id': a['class_id'] ?? '',
                'class_name': a['class_name'] ?? 'Class',
                'section_id': a['section_id'] ?? '',
                'section_name': a['section_name'] ?? '',
              },
            });
          }
        }
      }

      final optionSet = <_ClassSectionOption>{};
      for (final s in students) {
        final enrollment = s['current_enrollment'] as Map<String, dynamic>?;
        if (enrollment != null) {
          final cId = enrollment['class_id']?.toString() ?? '';
          final sId = enrollment['section_id']?.toString() ?? '';
          final cName = enrollment['class_name']?.toString() ?? 'Class';
          final sName = enrollment['section_name']?.toString() ?? '';
          if (cId.isNotEmpty) {
            optionSet.add(_ClassSectionOption(
              classId: cId,
              sectionId: sId,
              className: cName,
              sectionName: sName,
            ));
          }
        }
      }

      final optionsList = optionSet.toList();
      _ClassSectionOption? activeOption = _selectedOption;
      if (activeOption == null || !optionsList.contains(activeOption)) {
        activeOption = optionsList.isNotEmpty ? optionsList.first : null;
      }

      _options = optionsList;
      _selectedOption = activeOption;
      _allRosterStudents = students;

      await _applyFilterAndLoadRecords();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  Future<void> _applyFilterAndLoadRecords() async {
    final option = _selectedOption;
    if (option == null) {
      if (mounted) {
        setState(() {
          _filteredStudents = [];
          _loading = false;
        });
      }
      return;
    }

    final classStudents = _allRosterStudents.where((s) {
      final e = s['current_enrollment'] as Map<String, dynamic>?;
      if (e == null) return false;
      final matchClass = e['class_id']?.toString() == option.classId;
      final matchSection = option.sectionId.isEmpty || e['section_id']?.toString() == option.sectionId;
      return matchClass && matchSection;
    }).toList();

    // Fetch existing attendance records for this date, class and section
    final existingRecords = await ApiClient.getList('/api/attendance/students', {
      'date': _dateStr,
      'classId': option.classId,
      if (option.sectionId.isNotEmpty) 'sectionId': option.sectionId,
    }).catchError((_) => <Map<String, dynamic>>[]);

    _attendanceMap.clear();
    _remarksMap.clear();

    for (final rec in existingRecords) {
      final sId = rec['student_id']?.toString();
      final status = rec['status']?.toString();
      final rem = rec['remarks']?.toString();
      if (sId != null && status != null) {
        _attendanceMap[sId] = status;
        if (rem != null && rem.isNotEmpty) {
          _remarksMap[sId] = rem;
        }
      }
    }

    // Default unmarked students to 'present' for easy workflow
    for (final s in classStudents) {
      final sId = s['id']?.toString() ?? '';
      _attendanceMap.putIfAbsent(sId, () => 'present');
    }

    if (!mounted) return;
    setState(() {
      _filteredStudents = classStudents;
      _loading = false;
    });
  }

  void _markAll(String status) {
    setState(() {
      for (final s in _filteredStudents) {
        final id = s['id']?.toString() ?? '';
        if (id.isNotEmpty) {
          _attendanceMap[id] = status;
        }
      }
    });
  }

  Future<void> _saveAttendance() async {
    final option = _selectedOption;
    if (option == null || _filteredStudents.isEmpty) return;

    final user = context.read<AuthService>().currentUser;
    setState(() => _saving = true);

    int savedCount = 0;
    String? firstError;

    for (final s in _filteredStudents) {
      final studentId = s['id']?.toString() ?? '';
      final status = _attendanceMap[studentId] ?? 'present';
      final remarks = _remarksMap[studentId] ?? '';

      try {
        await ApiClient.send('POST', '/api/attendance/students', {
          'school_id': user.schoolId,
          'student_id': studentId,
          'class_id': option.classId,
          'section_id': option.sectionId,
          'attendance_date': _dateStr,
          'status': status,
          'remarks': remarks,
        });
        savedCount++;
      } catch (e) {
        firstError ??= e.toString().replaceFirst('Exception: ', '');
      }
    }

    if (!mounted) return;
    setState(() => _saving = false);

    if (savedCount > 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Attendance saved successfully for $savedCount students.'),
          backgroundColor: AppColors.success,
        ),
      );
    } else if (firstError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to save attendance: $firstError'),
          backgroundColor: AppColors.danger,
        ),
      );
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 30)),
    );
    if (picked != null && picked != _selectedDate) {
      setState(() => _selectedDate = picked);
      _loadRosterAndAttendance();
    }
  }

  @override
  Widget build(BuildContext context) {
    final total = _filteredStudents.length;
    final presentCount = _filteredStudents
        .where((s) => _attendanceMap[s['id']?.toString()] == 'present')
        .length;
    final absentCount = _filteredStudents
        .where((s) => _attendanceMap[s['id']?.toString()] == 'absent')
        .length;
    final lateCount = _filteredStudents
        .where((s) => _attendanceMap[s['id']?.toString()] == 'partial')
        .length;
    final leaveCount = _filteredStudents
        .where((s) => _attendanceMap[s['id']?.toString()] == 'leave')
        .length;

    return RefreshIndicator(
      onRefresh: _loadRosterAndAttendance,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Filter Controls (Class/Section Selector & Date Picker)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  children: [
                    // Class Section Dropdown
                    Row(
                      children: [
                        const Icon(Icons.school,
                            color: AppColors.primary, size: 20),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<_ClassSectionOption>(
                              isExpanded: true,
                              hint: const Text('Select Class & Section'),
                              value: _selectedOption,
                              items: _options.map((opt) {
                                return DropdownMenuItem<_ClassSectionOption>(
                                  value: opt,
                                  child: Text(
                                    opt.label,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14,
                                    ),
                                  ),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) {
                                  setState(() => _selectedOption = val);
                                  _applyFilterAndLoadRecords();
                                }
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: AppSpacing.lg),
                    // Date Picker Row
                    InkWell(
                      onTap: _pickDate,
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.calendar_today,
                                    color: AppColors.primary, size: 18),
                                const SizedBox(width: AppSpacing.sm),
                                Text(
                                  DateFormat('EEEE, dd MMMM yyyy').format(_selectedDate),
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                              ],
                            ),
                            const Text(
                              'Change',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
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
                        onPressed: _loadRosterAndAttendance,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
            ],

            const SizedBox(height: AppSpacing.lg),

            // Summary Stats Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildStatColumn('Total', '$total', AppColors.textPrimary),
                        _buildStatColumn('Present', '$presentCount', AppColors.success),
                        _buildStatColumn('Absent', '$absentCount', AppColors.danger),
                        _buildStatColumn('Late', '$lateCount', AppColors.warning),
                        _buildStatColumn('Leave', '$leaveCount', AppColors.info),
                      ],
                    ),
                    const Divider(height: AppSpacing.lg),
                    // Quick Action Buttons
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            icon: const Icon(Icons.check_circle_outline, size: 16),
                            label: const Text('All Present'),
                            onPressed: _filteredStudents.isEmpty
                                ? null
                                : () => _markAll('present'),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: OutlinedButton.icon(
                            icon: const Icon(Icons.highlight_off, size: 16),
                            label: const Text('All Absent'),
                            onPressed: _filteredStudents.isEmpty
                                ? null
                                : () => _markAll('absent'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: AppSpacing.lg),

            // Students List Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Students (${_filteredStudents.length})',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: _saving || _filteredStudents.isEmpty ? null : _saveAttendance,
                  icon: _saving
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.save, size: 16),
                  label: Text(_saving ? 'Saving...' : 'Save Attendance'),
                ),
              ],
            ),

            const SizedBox(height: AppSpacing.md),

            if (_filteredStudents.isEmpty && !_loading)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(AppSpacing.xl),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(Icons.people_outline,
                            size: 40, color: AppColors.textMuted),
                        SizedBox(height: AppSpacing.sm),
                        Text(
                          'No students found for this class & section',
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
              ..._filteredStudents.map((student) => _buildStudentCard(student)),

            const SizedBox(height: AppSpacing.xl),
          ],
        ),
      ),
    );
  }

  Widget _buildStatColumn(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildStudentCard(Map<String, dynamic> student) {
    final sId = student['id']?.toString() ?? '';
    final name = student['full_name'] ??
        '${student['first_name'] ?? ''} ${student['last_name'] ?? ''}'.trim();
    final admission = student['admission_number'] ?? student['registration_number'] ?? '';
    final currentStatus = _attendanceMap[sId] ?? 'present';

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: AppColors.primaryLight,
                  child: Text(
                    name.isNotEmpty ? name[0].toUpperCase() : 'S',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryDark,
                      fontSize: 14,
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name.isNotEmpty ? name : 'Unnamed Student',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      if (admission.isNotEmpty)
                        Text(
                          'Reg ID: $admission',
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textSecondary,
                          ),
                        ),
                    ],
                  ),
                ),
                _statusBadgeFor(currentStatus),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            // Attendance Selector Chips
            Row(
              children: [
                _buildStatusChip(sId, 'present', 'Present', AppColors.success),
                const SizedBox(width: AppSpacing.xs),
                _buildStatusChip(sId, 'absent', 'Absent', AppColors.danger),
                const SizedBox(width: AppSpacing.xs),
                _buildStatusChip(sId, 'partial', 'Late', AppColors.warning),
                const SizedBox(width: AppSpacing.xs),
                _buildStatusChip(sId, 'leave', 'Leave', AppColors.info),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _statusBadgeFor(String status) {
    switch (status) {
      case 'present':
        return const StatusBadge(label: 'Present', type: BadgeType.success);
      case 'absent':
        return const StatusBadge(label: 'Absent', type: BadgeType.danger);
      case 'partial':
        return const StatusBadge(label: 'Late', type: BadgeType.warning);
      case 'leave':
        return const StatusBadge(label: 'Leave', type: BadgeType.info);
      default:
        return const StatusBadge(label: 'Unmarked', type: BadgeType.neutral);
    }
  }

  Widget _buildStatusChip(String studentId, String statusValue, String label, Color activeColor) {
    final isSelected = (_attendanceMap[studentId] ?? 'present') == statusValue;

    return Expanded(
      child: InkWell(
        onTap: () {
          setState(() {
            _attendanceMap[studentId] = statusValue;
          });
        },
        borderRadius: BorderRadius.circular(AppRadius.sm),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? activeColor.withValues(alpha: 0.15) : AppColors.background,
            borderRadius: BorderRadius.circular(AppRadius.sm),
            border: Border.all(
              color: isSelected ? activeColor : AppColors.border,
              width: isSelected ? 1.5 : 1,
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              color: isSelected ? activeColor : AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }
}
