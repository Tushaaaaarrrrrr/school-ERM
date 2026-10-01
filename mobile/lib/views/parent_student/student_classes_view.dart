import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../viewmodels/student_viewmodel.dart';

class StudentClassesView extends StatelessWidget {
  const StudentClassesView({super.key});

  static const _days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  @override
  Widget build(BuildContext context) {
    final entries = context.watch<StudentViewModel>().timetable;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Classes & Timetable',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          if (entries.isEmpty)
            const _EmptyCard('No timetable returned by the school yet.')
          else
            ...List.generate(_days.length, (index) {
              final dayNumber = index + 1;
              final dayEntries = entries
                  .where((item) => '${item['day_of_week']}' == '$dayNumber')
                  .toList()
                ..sort((a, b) => '${a['start_time'] ?? ''}'
                    .compareTo('${b['start_time'] ?? ''}'));
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_days[index],
                          style: const TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 14)),
                      const SizedBox(height: 8),
                      if (dayEntries.isEmpty)
                        const Text('No classes',
                            style: TextStyle(color: AppColors.textSecondary))
                      else
                        ...dayEntries.map((slot) => Padding(
                              padding: const EdgeInsets.symmetric(vertical: 6),
                              child: Row(
                                children: [
                                  SizedBox(
                                    width: 82,
                                    child: Text(
                                      '${slot['start_time'] ?? ''}',
                                      style: const TextStyle(
                                          fontSize: 12,
                                          color: AppColors.textMuted),
                                    ),
                                  ),
                                  Expanded(
                                    child: Text(
                                      '${slot['subject_name'] ?? slot['period_name'] ?? 'Class'}',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w600),
                                    ),
                                  ),
                                  if ('${slot['teacher_name'] ?? ''}'
                                      .isNotEmpty)
                                    Flexible(
                                      child: Text(
                                        '${slot['teacher_name']}',
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                            fontSize: 12,
                                            color: AppColors.textSecondary),
                                      ),
                                    ),
                                ],
                              ),
                            )),
                    ],
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }
}

class _EmptyCard extends StatelessWidget {
  final String message;

  const _EmptyCard(this.message);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Center(
            child: Text(message,
                style: const TextStyle(color: AppColors.textSecondary))),
      ),
    );
  }
}
