import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';

class TeacherTimetableView extends StatelessWidget {
  const TeacherTimetableView({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Card
          Card(
            color: AppColors.primary,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: const BoxDecoration(
                      color: Colors.white24,
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: const AppSvgIcon('calendar', size: 22, color: Colors.white),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Weekly Teaching Schedule',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Monday to Friday • 24 Weekly Periods',
                          style: TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 20),
          const Text(
            'Today Periods (Monday)',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 12),

          const _PeriodRow(
            period: 'Period 1',
            time: '08:30 - 09:15 AM',
            subject: 'Mathematics',
            className: 'Class 10 - Section A',
            room: 'Room 204',
            isActive: true,
          ),
          const SizedBox(height: 10),
          const _PeriodRow(
            period: 'Period 2',
            time: '09:15 - 10:00 AM',
            subject: 'Physics Lab',
            className: 'Class 9 - Section B',
            room: 'Science Lab 2',
          ),
          const SizedBox(height: 10),
          const _PeriodRow(
            period: 'Period 4',
            time: '11:00 - 11:45 AM',
            subject: 'Advanced Algebra',
            className: 'Class 11 - Section A',
            room: 'Room 302',
          ),
          const SizedBox(height: 10),
          const _PeriodRow(
            period: 'Period 6',
            time: '01:00 - 01:45 PM',
            subject: 'Remedial Math',
            className: 'Class 10 - Section B',
            room: 'Room 205',
          ),
        ],
      ),
    );
  }
}

class _PeriodRow extends StatelessWidget {
  final String period;
  final String time;
  final String subject;
  final String className;
  final String room;
  final bool isActive;

  const _PeriodRow({
    required this.period,
    required this.time,
    required this.subject,
    required this.className,
    required this.room,
    this.isActive = false,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      color: isActive ? AppColors.primaryLight.withOpacity(0.4) : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isActive ? AppColors.primary : AppColors.border,
          width: isActive ? 1.5 : 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: isActive ? AppColors.primary : AppColors.background,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                period,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 11,
                  color: isActive ? Colors.white : AppColors.textSecondary,
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    subject,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  Text(
                    '$className • $room',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                  ),
                ],
              ),
            ),
            Text(
              time,
              style: const TextStyle(fontSize: 10, color: AppColors.textMuted, fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }
}
