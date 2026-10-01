import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../core/widgets/stat_card.dart';
import '../../data/models/student_model.dart';
import '../../data/services/api_client.dart';

class AdminAttendanceView extends StatelessWidget {
  const AdminAttendanceView({super.key});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<StudentModel>>(
      future: ApiClient.getStudents(),
      builder: (context, snapshot) {
        final students = snapshot.data ?? const <StudentModel>[];
        final classes = <String, int>{};
        for (final student in students) {
          final name = student.classSection.trim();
          if (name.isEmpty || name == '-') continue;
          classes[name] = (classes[name] ?? 0) + 1;
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (snapshot.connectionState == ConnectionState.waiting)
                const LinearProgressIndicator(minHeight: 2),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: StatCard(
                      title: 'Students',
                      value: '${students.length}',
                      subtitle: 'Loaded from server',
                      iconName: 'attendance',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: StatCard(
                      title: 'Classes',
                      value: '${classes.length}',
                      subtitle: 'Attendance groups',
                      iconName: 'calendar',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const Text(
                'Attendance',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 12),
              if (classes.isEmpty)
                const _EmptyAttendance()
              else
                Card(
                  child: Column(
                    children: classes.entries
                        .map((entry) => ListTile(
                              leading: const AppSvgIcon('attendance',
                                  size: 18, color: AppColors.primary),
                              title: Text(
                                entry.key,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                              subtitle: Text(
                                '${entry.value} students. Daily attendance appears after the server returns attendance records.',
                                style: const TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 11,
                                ),
                              ),
                            ))
                        .expand((child) => [child, const Divider(height: 1)])
                        .toList()
                      ..removeLast(),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _EmptyAttendance extends StatelessWidget {
  const _EmptyAttendance();

  @override
  Widget build(BuildContext context) {
    return const Card(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Center(
          child: Text(
            'No attendance data returned by the server yet.',
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ),
      ),
    );
  }
}
