import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/widgets/stat_card.dart';
import '../../core/widgets/status_badge.dart';
import '../../data/models/student_model.dart';
import '../../data/services/api_client.dart';
import '../../data/services/auth_service.dart';

class TeacherExamsView extends StatefulWidget {
  const TeacherExamsView({super.key});

  @override
  State<TeacherExamsView> createState() => _TeacherExamsViewState();
}

class _TeacherExamsViewState extends State<TeacherExamsView> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _exams = [];
  List<Map<String, dynamic>> _assignments = [];
  List<StudentModel> _allStudents = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        ApiClient.getList('/api/exams')
            .catchError((_) => <Map<String, dynamic>>[]),
        ApiClient.getList('/api/teacher-assignments')
            .catchError((_) => <Map<String, dynamic>>[]),
        ApiClient.getStudents()
            .catchError((_) => <StudentModel>[]),
      ]);

      if (!mounted) return;
      setState(() {
        _exams = results[0] as List<Map<String, dynamic>>;
        _assignments = results[1] as List<Map<String, dynamic>>;
        _allStudents = results[2] as List<StudentModel>;
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

  void _openCreateExamSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
      ),
      builder: (ctx) => _CreateExamSheet(
        assignments: _assignments,
        onCreated: _loadData,
      ),
    );
  }

  void _openMarksEntrySheet(Map<String, dynamic> exam) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
      ),
      builder: (ctx) => _MarksEntrySheet(
        exam: exam,
        allStudents: _allStudents,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final total = _exams.length;
    final published = _exams.where((e) => (e['status'] ?? '').toString() == 'published').length;
    final draft = total - published;

    return Scaffold(
      backgroundColor: AppColors.background,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openCreateExamSheet,
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('New Exam', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              const Text(
                'Exams & Marks Entry',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Create exams, record subject marks, and manage score sheets.',
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
                          onPressed: _loadData,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
              ],

              const SizedBox(height: AppSpacing.lg),

              // Summary Stats Row
              Row(
                children: [
                  Expanded(
                    child: StatCard(
                      title: 'Total Exams',
                      value: '$total',
                      subtitle: 'Active & past exams',
                      iconName: 'award',
                      iconColor: AppColors.primary,
                      iconBgColor: AppColors.primaryLight,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: StatCard(
                      title: 'Draft / In Progress',
                      value: '$draft',
                      subtitle: 'Pending marks entry',
                      iconName: 'calendar',
                      iconColor: AppColors.warning,
                      iconBgColor: AppColors.warningLight,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: AppSpacing.xl),

              // Exams List Header
              const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Exams List',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Text(
                    'Tap exam to enter marks',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppColors.textMuted,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.sm),

              if (_exams.isEmpty && !_loading)
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(AppSpacing.xl),
                    child: Center(
                      child: Column(
                        children: [
                          Icon(Icons.assignment_outlined,
                              size: 40, color: AppColors.textMuted),
                          SizedBox(height: AppSpacing.sm),
                          Text(
                            'No exams found. Tap "New Exam" to create one.',
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
                ..._exams.map((exam) => _buildExamCard(exam)),

              const SizedBox(height: 80), // Padding for FAB
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildExamCard(Map<String, dynamic> exam) {
    final name = exam['name'] ?? 'Exam';
    final maxMarks = exam['max_marks']?.toString() ?? '100';
    final examDate = exam['exam_date']?.toString() ?? '';
    final status = (exam['status'] ?? 'draft').toString().toLowerCase();
    final subject = exam['subject_name'] ?? exam['subject'] ?? '';
    final className = exam['class_name'] ?? '';
    final sectionName = exam['section_name'] ?? '';

    final isPublished = status == 'published';

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      child: InkWell(
        onTap: () => _openMarksEntrySheet(exam),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      name.toString(),
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                  StatusBadge(
                    label: isPublished ? 'PUBLISHED' : 'DRAFT',
                    type: isPublished ? BadgeType.success : BadgeType.warning,
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  if (className.isNotEmpty) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '$className${sectionName.isNotEmpty ? ' - $sectionName' : ''}',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primaryDark,
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                  ],
                  if (subject.isNotEmpty) ...[
                    Text(
                      subject.toString(),
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                  ],
                  Text(
                    'Max: $maxMarks marks',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
              const Divider(height: AppSpacing.lg),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.calendar_today, size: 14, color: AppColors.textMuted),
                      const SizedBox(width: 4),
                      Text(
                        examDate.isNotEmpty ? examDate.split('T').first : 'Date not set',
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                  const Row(
                    children: [
                      Text(
                        'Enter Marks',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                      SizedBox(width: 2),
                      Icon(Icons.arrow_forward_ios, size: 12, color: AppColors.primary),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CreateExamSheet extends StatefulWidget {
  final List<Map<String, dynamic>> assignments;
  final VoidCallback onCreated;

  const _CreateExamSheet({
    required this.assignments,
    required this.onCreated,
  });

  @override
  State<_CreateExamSheet> createState() => _CreateExamSheetState();
}

class _CreateExamSheetState extends State<_CreateExamSheet> {
  final _nameController = TextEditingController(text: 'Unit Test 1');
  final _maxMarksController = TextEditingController(text: '50');
  DateTime _examDate = DateTime.now();
  Map<String, dynamic>? _selectedAssignment;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    if (widget.assignments.isNotEmpty) {
      _selectedAssignment = widget.assignments.first;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _maxMarksController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    final maxMarksStr = _maxMarksController.text.trim();
    final maxMarks = double.tryParse(maxMarksStr);

    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter an exam title.')),
      );
      return;
    }

    if (maxMarks == null || maxMarks <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter valid maximum marks.')),
      );
      return;
    }

    if (_selectedAssignment == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select an assigned class.')),
      );
      return;
    }

    final user = context.read<AuthService>().currentUser;
    setState(() => _submitting = true);

    try {
      final df = DateFormat('yyyy-MM-dd');
      await ApiClient.send('POST', '/api/exams', {
        'school_id': user.schoolId,
        'name': name,
        'class_id': _selectedAssignment!['class_id'],
        'section_id': _selectedAssignment!['section_id'],
        'subject_id': _selectedAssignment!['subject_id'],
        'max_marks': maxMarks,
        'exam_date': df.format(_examDate),
      });

      if (!mounted) return;
      Navigator.pop(context);
      widget.onCreated();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Exam created successfully.'),
          backgroundColor: AppColors.success,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: AppColors.danger,
        ),
      );
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _examDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() => _examDate = picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: AppSpacing.lg,
        right: AppSpacing.lg,
        top: AppSpacing.lg,
        bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.lg,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Create New Exam',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          // Name
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(
              labelText: 'Exam Title',
              hintText: 'e.g. Unit Test 2, Mid-Term Exam',
            ),
          ),
          const SizedBox(height: AppSpacing.sm),

          // Assignment Dropdown
          DropdownButtonFormField<Map<String, dynamic>>(
            decoration: const InputDecoration(labelText: 'Class & Subject'),
            initialValue: _selectedAssignment,
            items: widget.assignments.map((asg) {
              final c = asg['class_name'] ?? 'Class';
              final s = asg['section_name'] ?? '';
              final sub = asg['subject_name'] ?? asg['subject'] ?? 'Subject';
              return DropdownMenuItem(
                value: asg,
                child: Text('$c${s.isNotEmpty ? ' - $s' : ''} ($sub)'),
              );
            }).toList(),
            onChanged: (val) => setState(() => _selectedAssignment = val),
          ),
          const SizedBox(height: AppSpacing.sm),

          // Max Marks & Date Row
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _maxMarksController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Max Marks',
                    hintText: '50',
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: InkWell(
                  onTap: _pickDate,
                  child: InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Exam Date',
                      prefixIcon: Icon(Icons.calendar_today, size: 16),
                    ),
                    child: Text(
                      DateFormat('dd MMM yyyy').format(_examDate),
                      style: const TextStyle(fontSize: 13),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),

          // Submit
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _submitting ? null : _submit,
              child: Text(_submitting ? 'Creating...' : 'Create Exam'),
            ),
          ),
        ],
      ),
    );
  }
}

class _MarksEntrySheet extends StatefulWidget {
  final Map<String, dynamic> exam;
  final List<StudentModel> allStudents;

  const _MarksEntrySheet({
    required this.exam,
    required this.allStudents,
  });

  @override
  State<_MarksEntrySheet> createState() => _MarksEntrySheetState();
}

class _MarksEntrySheetState extends State<_MarksEntrySheet> {
  bool _loading = true;
  bool _saving = false;
  List<StudentModel> _targetStudents = [];
  final Map<String, TextEditingController> _marksControllers = {};
  final Map<String, bool> _absentMap = {};
  final Map<String, TextEditingController> _remarksControllers = {};

  @override
  void initState() {
    super.initState();
    _loadResults();
  }

  @override
  void dispose() {
    for (final c in _marksControllers.values) {
      c.dispose();
    }
    for (final c in _remarksControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _loadResults() async {
    setState(() => _loading = true);

    final examId = widget.exam['id']?.toString() ?? '';
    final classId = widget.exam['class_id']?.toString() ?? '';
    final sectionId = widget.exam['section_id']?.toString() ?? '';

    // Filter students by class and section
    final filtered = widget.allStudents.where((s) {
      if (classId.isNotEmpty && s.classId.isNotEmpty) {
        return s.classId == classId && (sectionId.isEmpty || s.sectionId == sectionId);
      }
      return true;
    }).toList();

    // Fetch existing results
    final results = await ApiClient.getList('/api/exam-results')
        .catchError((_) => <Map<String, dynamic>>[]);

    final existingForExam = results.where((r) => r['exam_id']?.toString() == examId).toList();

    for (final s in filtered) {
      final res = existingForExam.firstWhere(
        (r) => r['student_id']?.toString() == s.id,
        orElse: () => <String, dynamic>{},
      );
      final isAbsent = res['absent'] == true;
      final marksObtained = res['marks_obtained'] != null ? res['marks_obtained'].toString() : '';
      final remarks = res['remarks']?.toString() ?? '';

      _marksControllers[s.id] = TextEditingController(text: marksObtained);
      _absentMap[s.id] = isAbsent;
      _remarksControllers[s.id] = TextEditingController(text: remarks);
    }

    if (!mounted) return;
    setState(() {
      _targetStudents = filtered;
      _loading = false;
    });
  }

  Future<void> _saveAllMarks() async {
    final examId = widget.exam['id']?.toString() ?? '';
    final maxMarks = double.tryParse(widget.exam['max_marks']?.toString() ?? '100') ?? 100;
    final user = context.read<AuthService>().currentUser;

    setState(() => _saving = true);
    int savedCount = 0;
    String? firstError;

    for (final s in _targetStudents) {
      final isAbsent = _absentMap[s.id] ?? false;
      final marksStr = _marksControllers[s.id]?.text.trim() ?? '';
      final marksVal = double.tryParse(marksStr);
      final remarks = _remarksControllers[s.id]?.text.trim() ?? '';

      // Skip empty marks if not absent
      if (!isAbsent && marksStr.isEmpty) continue;

      if (!isAbsent && (marksVal == null || marksVal < 0 || marksVal > maxMarks)) {
        firstError = 'Marks for ${s.fullName} must be between 0 and $maxMarks.';
        break;
      }

      try {
        await ApiClient.send('POST', '/api/exam-results', {
          'school_id': user.schoolId,
          'exam_id': examId,
          'student_id': s.id,
          'absent': isAbsent,
          'marks_obtained': isAbsent ? 0 : marksVal,
          'remarks': remarks,
        });
        savedCount++;
      } catch (e) {
        firstError ??= e.toString().replaceFirst('Exception: ', '');
      }
    }

    if (!mounted) return;
    setState(() => _saving = false);

    if (firstError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(firstError),
          backgroundColor: AppColors.danger,
        ),
      );
    } else {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Marks saved successfully for $savedCount students.'),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = widget.exam['name'] ?? 'Exam';
    final maxMarks = widget.exam['max_marks']?.toString() ?? '100';

    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.85,
      child: Column(
        children: [
          // Header Bar
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Marks Entry: $name',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        'Maximum Marks: $maxMarks',
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          if (_loading)
            const Expanded(
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_targetStudents.isEmpty)
            const Expanded(
              child: Center(
                child: Text(
                  'No students found for this class & section.',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
              ),
            )
          else
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.all(AppSpacing.md),
                itemCount: _targetStudents.length,
                separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
                itemBuilder: (context, index) {
                  final s = _targetStudents[index];
                  final isAbsent = _absentMap[s.id] ?? false;

                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
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
                              const SizedBox(width: AppSpacing.sm),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      s.fullName,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                      ),
                                    ),
                                    Text(
                                      'Reg: ${s.admissionNumber}',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              // Absent Checkbox
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Text('Absent', style: TextStyle(fontSize: 12)),
                                  Checkbox(
                                    value: isAbsent,
                                    onChanged: (val) {
                                      setState(() {
                                        _absentMap[s.id] = val ?? false;
                                        if (val == true) {
                                          _marksControllers[s.id]?.text = '0';
                                        }
                                      });
                                    },
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: AppSpacing.sm),
                          Row(
                            children: [
                              Expanded(
                                flex: 2,
                                child: TextField(
                                  controller: _marksControllers[s.id],
                                  enabled: !isAbsent,
                                  keyboardType: TextInputType.number,
                                  decoration: InputDecoration(
                                    labelText: 'Marks / $maxMarks',
                                    isDense: true,
                                  ),
                                ),
                              ),
                              const SizedBox(width: AppSpacing.sm),
                              Expanded(
                                flex: 3,
                                child: TextField(
                                  controller: _remarksControllers[s.id],
                                  decoration: const InputDecoration(
                                    labelText: 'Remarks (optional)',
                                    isDense: true,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),

          // Bottom Save Button Bar
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _saving || _targetStudents.isEmpty ? null : _saveAllMarks,
                icon: _saving
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.check, size: 18),
                label: Text(_saving ? 'Saving...' : 'Save All Marks'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
