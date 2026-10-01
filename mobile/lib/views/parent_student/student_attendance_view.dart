import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../viewmodels/student_viewmodel.dart';

class StudentAttendanceView extends StatelessWidget {
  const StudentAttendanceView({super.key});

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<StudentViewModel>();
    final health = vm.student.healthInfo.trim();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Attendance & Leave',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          if (vm.attendance.isEmpty)
            const _InfoCard('No attendance records returned by the school yet.')
          else
            ...vm.attendance.map(
              (item) => Card(
                child: ListTile(
                  title: Text(
                      '${item['date'] ?? item['attendance_date'] ?? 'Attendance'}'),
                  subtitle: Text('${item['remarks'] ?? ''}'),
                  trailing: Text('${item['status'] ?? ''}',
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ),
          const SizedBox(height: 18),
          const Text('Leave Details',
              style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          if (vm.leaves.isEmpty)
            const _InfoCard('No active leave returned by the school yet.')
          else
            ...vm.leaves.map(
              (item) => Card(
                child: ListTile(
                  title: Text(
                      '${item['reason'] ?? item['leave_type'] ?? 'Leave'}'),
                  subtitle: Text(
                      '${item['from_date'] ?? ''} - ${item['to_date'] ?? ''}'),
                  trailing: Text('${item['status'] ?? ''}'),
                ),
              ),
            ),
          const SizedBox(height: 18),
          const Text('Health Details',
              style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          _InfoCard(health.isEmpty
              ? 'No health details returned by the school yet.'
              : health),
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
