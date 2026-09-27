import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../core/widgets/status_badge.dart';

class TeacherExamsView extends StatelessWidget {
  const TeacherExamsView({super.key});

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
                    child: const AppSvgIcon('award', size: 22, color: Colors.white),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Examination & Gradebook',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Term 1 & Term 2 Mark Entry',
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
            'Active Exam Cycles',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 12),

          const _ExamCard(
            title: 'Term 1 Mid-Year Examination',
            status: 'Marks Published',
            statusType: StatusType.success,
            subject: 'Mathematics (10-A)',
            entriesCompleted: '38/38 Entered',
            date: 'Completed Oct 2026',
          ),
          const SizedBox(height: 10),
          const _ExamCard(
            title: 'Term 2 Periodic Test 1',
            status: 'Grading Open',
            statusType: StatusType.warning,
            subject: 'Physics Lab (9-B)',
            entriesCompleted: '14/35 Entered',
            date: 'Due in 3 Days',
          ),
          const SizedBox(height: 10),
          const _ExamCard(
            title: 'Annual Final Examination 2027',
            status: 'Upcoming',
            statusType: StatusType.neutral,
            subject: 'Advanced Algebra (11-A)',
            entriesCompleted: '0/40 Entered',
            date: 'Starts Feb 15, 2027',
          ),
        ],
      ),
    );
  }
}

class _ExamCard extends StatelessWidget {
  final String title;
  final String status;
  final StatusType statusType;
  final String subject;
  final String entriesCompleted;
  final String date;

  const _ExamCard({
    required this.title,
    required this.status,
    required this.statusType,
    required this.subject,
    required this.entriesCompleted,
    required this.date,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                ),
                StatusBadge(label: status, type: statusType),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const AppSvgIcon('teacher', size: 14, color: AppColors.textSecondary),
                const SizedBox(width: 6),
                Text(
                  subject,
                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
                const Spacer(),
                Text(
                  entriesCompleted,
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              date,
              style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
            ),
          ],
        ),
      ),
    );
  }
}
