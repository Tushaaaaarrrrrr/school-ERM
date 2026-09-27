import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/attendance_model.dart';
import '../../viewmodels/teacher_viewmodel.dart';

class TeacherAttendanceView extends StatelessWidget {
  const TeacherAttendanceView({super.key});

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<TeacherViewModel>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Daily Attendance'),
        actions: [
          TextButton.icon(
            onPressed: vm.markAllPresent,
            icon: const AppSvgIcon('attendance', size: 16, color: AppColors.primary),
            label: const Text('All Present'),
          ),
        ],
      ),
      body: Column(
        children: [
          // Class & Date Header Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: Colors.white,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const AppSvgIcon('calendar', size: 16, color: AppColors.primary),
                    const SizedBox(width: 8),
                    Text(
                      AppFormatters.dateWithDay(vm.attendanceDate),
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    vm.selectedClass,
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Attendance Summary Counters
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Row(
              children: [
                Expanded(
                  child: _SummaryPill(
                    label: 'Present',
                    count: vm.presentCount,
                    color: AppColors.success,
                    bgColor: AppColors.successLight,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _SummaryPill(
                    label: 'Absent',
                    count: vm.absentCount,
                    color: AppColors.danger,
                    bgColor: AppColors.dangerLight,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _SummaryPill(
                    label: 'Late',
                    count: vm.lateCount,
                    color: AppColors.warning,
                    bgColor: AppColors.warningLight,
                  ),
                ),
              ],
            ),
          ),

          // Student Attendance List
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              itemCount: vm.students.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final student = vm.students[index];
                final record = vm.attendanceMap[student.id]!;

                return Card(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 18,
                          backgroundColor: AppColors.primaryLight,
                          child: Text(
                            student.rollNumber,
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                student.fullName,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                              Text(
                                student.admissionNumber,
                                style: const TextStyle(
                                  color: AppColors.textMuted,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                        // 1-Tap Status Selector Buttons
                        _AttendanceToggleButton(
                          label: 'P',
                          isActive: record.status == AttendanceStatus.present,
                          activeColor: AppColors.success,
                          onTap: () => vm.toggleStatus(student.id, AttendanceStatus.present),
                        ),
                        const SizedBox(width: 6),
                        _AttendanceToggleButton(
                          label: 'A',
                          isActive: record.status == AttendanceStatus.absent,
                          activeColor: AppColors.danger,
                          onTap: () => vm.toggleStatus(student.id, AttendanceStatus.absent),
                        ),
                        const SizedBox(width: 6),
                        _AttendanceToggleButton(
                          label: 'L',
                          isActive: record.status == AttendanceStatus.late,
                          activeColor: AppColors.warning,
                          onTap: () => vm.toggleStatus(student.id, AttendanceStatus.late),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Bottom Submit Action Bar
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: AppColors.border)),
            ),
            child: ElevatedButton(
              onPressed: () {
                vm.saveAttendance();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Attendance submitted successfully!'),
                    backgroundColor: AppColors.success,
                  ),
                );
              },
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  AppSvgIcon('attendance', size: 18, color: Colors.white),
                  SizedBox(width: 8),
                  Text('Submit Class Attendance'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryPill extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  final Color bgColor;

  const _SummaryPill({
    required this.label,
    required this.count,
    required this.color,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        children: [
          Text(
            '$count',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _AttendanceToggleButton extends StatelessWidget {
  final String label;
  final bool isActive;
  final Color activeColor;
  final VoidCallback onTap;

  const _AttendanceToggleButton({
    required this.label,
    required this.isActive,
    required this.activeColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: isActive ? activeColor : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isActive ? activeColor : AppColors.border,
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            color: isActive ? Colors.white : AppColors.textSecondary,
            fontWeight: FontWeight.bold,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}
