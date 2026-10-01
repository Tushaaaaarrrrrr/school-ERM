import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../viewmodels/student_viewmodel.dart';

class StudentNoticesView extends StatelessWidget {
  const StudentNoticesView({super.key});

  @override
  Widget build(BuildContext context) {
    final notices = context.watch<StudentViewModel>().notices;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Notices',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          if (notices.isEmpty)
            const _InfoCard('No notices returned by the school yet.')
          else
            ...notices.map(
              (notice) => Card(
                child: ListTile(
                  title: Text(notice.title),
                  subtitle: Text(notice.content),
                  trailing: Text(notice.category),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final String message;

  const _InfoCard(this.message);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Text(message,
            style: const TextStyle(color: AppColors.textSecondary)),
      ),
    );
  }
}
