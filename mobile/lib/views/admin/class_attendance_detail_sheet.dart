import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../core/widgets/status_badge.dart';
import '../../data/models/student_model.dart';
import 'student_detail_sheet.dart';

enum StudentAttendanceState { present, absent, onLeave }

class StudentAttendanceDetail {
  final String id;
  final String name;
  final String rollNumber;
  final String admissionNumber;
  final String parentPhone;
  final StudentAttendanceState status;
  final String? note;

  const StudentAttendanceDetail({
    required this.id,
    required this.name,
    required this.rollNumber,
    required this.admissionNumber,
    required this.parentPhone,
    required this.status,
    this.note,
  });
}

class ClassAttendanceDetailSheet extends StatefulWidget {
  final String className;
  final String teacherName;
  final List<StudentAttendanceDetail> students;

  const ClassAttendanceDetailSheet({
    super.key,
    required this.className,
    required this.teacherName,
    required this.students,
  });

  static void show(
    BuildContext context, {
    required String className,
    required String teacherName,
    required List<StudentAttendanceDetail> students,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ClassAttendanceDetailSheet(
        className: className,
        teacherName: teacherName,
        students: students,
      ),
    );
  }

  @override
  State<ClassAttendanceDetailSheet> createState() => _ClassAttendanceDetailSheetState();
}

class _ClassAttendanceDetailSheetState extends State<ClassAttendanceDetailSheet> {
  String _selectedFilter = 'ALL';

  @override
  Widget build(BuildContext context) {
    final presentStudents = widget.students.where((s) => s.status == StudentAttendanceState.present).toList();
    final absentStudents = widget.students.where((s) => s.status == StudentAttendanceState.absent).toList();
    final onLeaveStudents = widget.students.where((s) => s.status == StudentAttendanceState.onLeave).toList();

    List<StudentAttendanceDetail> displayedList;
    if (_selectedFilter == 'PRESENT') {
      displayedList = presentStudents;
    } else if (_selectedFilter == 'ABSENT') {
      displayedList = absentStudents;
    } else if (_selectedFilter == 'LEAVE') {
      displayedList = onLeaveStudents;
    } else {
      displayedList = widget.students;
    }

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, controller) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // Drag Handle
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 12),

              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.className,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryLight,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  'Class Teacher: ${widget.teacherName}',
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                '• Today Roll Call',
                                style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: AppColors.textSecondary),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),

              const Divider(height: 20),

              // Summary Counters Grid
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Expanded(
                      child: _FilterStatCard(
                        label: 'Present',
                        count: presentStudents.length,
                        total: widget.students.length,
                        color: AppColors.success,
                        bgColor: AppColors.successLight,
                        isSelected: _selectedFilter == 'PRESENT',
                        onTap: () => setState(() => _selectedFilter = _selectedFilter == 'PRESENT' ? 'ALL' : 'PRESENT'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _FilterStatCard(
                        label: 'Absent',
                        count: absentStudents.length,
                        total: widget.students.length,
                        color: AppColors.danger,
                        bgColor: AppColors.dangerLight,
                        isSelected: _selectedFilter == 'ABSENT',
                        onTap: () => setState(() => _selectedFilter = _selectedFilter == 'ABSENT' ? 'ALL' : 'ABSENT'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _FilterStatCard(
                        label: 'On Leave',
                        count: onLeaveStudents.length,
                        total: widget.students.length,
                        color: AppColors.warning,
                        bgColor: AppColors.warningLight,
                        isSelected: _selectedFilter == 'LEAVE',
                        onTap: () => setState(() => _selectedFilter = _selectedFilter == 'LEAVE' ? 'ALL' : 'LEAVE'),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 14),

              // Section List Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Students (${displayedList.length}) • Tap for 360° Profile',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    if (_selectedFilter != 'ALL')
                      InkWell(
                        onTap: () => setState(() => _selectedFilter = 'ALL'),
                        child: const Text(
                          'Show All',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary),
                        ),
                      ),
                  ],
                ),
              ),

              const SizedBox(height: 8),

              // Student List
              Expanded(
                child: ListView.separated(
                  controller: controller,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  itemCount: displayedList.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final s = displayedList[index];
                    return _StudentAttendanceCard(
                      student: s,
                      className: widget.className,
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _FilterStatCard extends StatelessWidget {
  final String label;
  final int count;
  final int total;
  final Color color;
  final Color bgColor;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterStatCard({
    required this.label,
    required this.count,
    required this.total,
    required this.color,
    required this.bgColor,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: isSelected ? bgColor : AppColors.background,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? color : AppColors.border,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Column(
          children: [
            Text(
              '$count',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: isSelected ? color : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StudentAttendanceCard extends StatelessWidget {
  final StudentAttendanceDetail student;
  final String className;

  const _StudentAttendanceCard({required this.student, required this.className});

  @override
  Widget build(BuildContext context) {
    Color statusBg;
    Color statusColor;
    String statusText;
    BadgeType badgeType;

    switch (student.status) {
      case StudentAttendanceState.present:
        statusBg = AppColors.successLight;
        statusColor = AppColors.success;
        statusText = 'PRESENT';
        badgeType = BadgeType.success;
        break;
      case StudentAttendanceState.absent:
        statusBg = AppColors.dangerLight;
        statusColor = AppColors.danger;
        statusText = 'ABSENT';
        badgeType = BadgeType.danger;
        break;
      case StudentAttendanceState.onLeave:
        statusBg = AppColors.warningLight;
        statusColor = AppColors.warning;
        statusText = 'ON LEAVE';
        badgeType = BadgeType.warning;
        break;
    }

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: student.status == StudentAttendanceState.absent
              ? AppColors.danger.withOpacity(0.3)
              : (student.status == StudentAttendanceState.onLeave
                  ? AppColors.warning.withOpacity(0.3)
                  : AppColors.border),
        ),
      ),
      child: InkWell(
        onTap: () {
          StudentDetailSheet.show(
            context,
            canManageFees: true,
            student: StudentModel(
              id: student.id,
              fullName: student.name,
              admissionNumber: student.admissionNumber,
              rollNumber: student.rollNumber,
              className: className.split(' - ').first,
              section: className.contains('Section ') ? className.split('Section ').last : 'A',
              gender: 'Male',
              parentName: 'Parent of ${student.name}',
              parentPhone: student.parentPhone,
              attendancePercentage: student.status == StudentAttendanceState.present ? 96.0 : 88.0,
            ),
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: statusBg,
                    child: Text(
                      student.rollNumber,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                        color: statusColor,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          student.name,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        Text(
                          'Adm: ${student.admissionNumber} • Ph: ${student.parentPhone}',
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  StatusBadge(label: statusText, type: badgeType),
                  const SizedBox(width: 4),
                  const Icon(Icons.chevron_right, size: 16, color: AppColors.textMuted),
                ],
              ),
              if (student.note != null && student.note!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusBg.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    children: [
                      AppSvgIcon(
                        student.status == StudentAttendanceState.onLeave ? 'calendar' : 'bell',
                        size: 12,
                        color: statusColor,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          student.note!,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: statusColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
