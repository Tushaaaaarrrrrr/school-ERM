import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../viewmodels/student_viewmodel.dart';

class StudentResultsView extends StatelessWidget {
  const StudentResultsView({super.key});

  @override
  Widget build(BuildContext context) {
    final results = context.watch<StudentViewModel>().results;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Published Results',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          if (results.isEmpty)
            const _EmptyCard('No published result returned by the school yet.')
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: results.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final item = results[index];
                final title = item['exam_name'] ??
                    item['exam_title'] ??
                    item['name'] ??
                    'Result';
                final marks = item['marks_obtained'];
                final maxMarks = item['max_marks'];
                final publishedAt = DateTime.tryParse(
                    '${item['published_at'] ?? item['created_at'] ?? ''}');
                return Card(
                  child: ListTile(
                    title: Text('$title',
                        style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text(publishedAt == null
                        ? 'Published result'
                        : 'Published ${AppFormatters.date(publishedAt)}'),
                    trailing: marks == null
                        ? null
                        : Text(
                            maxMarks == null ? '$marks' : '$marks / $maxMarks',
                            style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary),
                          ),
                  ),
                );
              },
            ),
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
              style: const TextStyle(color: AppColors.textSecondary)),
        ),
      ),
    );
  }
}
