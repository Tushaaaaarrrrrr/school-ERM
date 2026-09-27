import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../core/widgets/stat_card.dart';
import '../../viewmodels/teacher_viewmodel.dart';

class TeacherHomeView extends StatelessWidget {
  final Function(int)? onTabSelected;

  const TeacherHomeView({super.key, this.onTabSelected});

  @override
  Widget build(BuildContext context) {
    final teacherVM = context.watch<TeacherViewModel>();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Quick Stat Cards
          Row(
            children: [
              Expanded(
                child: StatCard(
                  title: 'Total Students',
                  value: '${teacherVM.students.length}',
                  subtitle: teacherVM.selectedClass,
                  iconName: 'graduation_cap',
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: StatCard(
                  title: 'Today Classes',
                  value: '4 Periods',
                  subtitle: 'Maths & Science',
                  iconName: 'calendar',
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Action Section: Class Attendance
          const Text(
            'Teacher Operations',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 12),

          Card(
            clipBehavior: Clip.antiAlias,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: const BorderSide(color: AppColors.border),
            ),
            child: InkWell(
              onTap: () {
                if (onTabSelected != null) {
                  onTabSelected!(1);
                }
              },
              child: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.primary, Color(0xFF6366F1)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                padding: const EdgeInsets.all(18),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      alignment: Alignment.center,
                      child: const AppSvgIcon('attendance', size: 24, color: Colors.white),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Take Class Attendance',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '1-Tap Roll Call for ${teacherVM.selectedClass}',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const AppSvgIcon('sparkles', size: 20, color: Colors.white),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(height: 20),

          // Today Schedule Roster
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Today Schedule',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              InkWell(
                onTap: () => onTabSelected?.call(4),
                child: const Text(
                  'View All',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          const _ScheduleCard(
            time: '08:30 - 09:15 AM',
            subject: 'Mathematics',
            className: 'Class 10 - Section A',
            room: 'Room 204 (Aryabhatta Block)',
          ),
          const SizedBox(height: 8),
          const _ScheduleCard(
            time: '09:15 - 10:00 AM',
            subject: 'Physics Lab',
            className: 'Class 9 - Section B',
            room: 'Science Lab 2',
          ),
          const SizedBox(height: 8),
          const _ScheduleCard(
            time: '11:00 - 11:45 AM',
            subject: 'Advanced Algebra',
            className: 'Class 11 - Section A',
            room: 'Room 302',
          ),
        ],
      ),
    );
  }
}

class _ScheduleCard extends StatelessWidget {
  final String time;
  final String subject;
  final String className;
  final String room;

  const _ScheduleCard({
    required this.time,
    required this.subject,
    required this.className,
    required this.room,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.border),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14.0),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  const AppSvgIcon('calendar', size: 16, color: AppColors.primary),
                  const SizedBox(height: 4),
                  Text(
                    time.split(' ')[0],
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    subject,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '$className • $room',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
