import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../core/widgets/status_badge.dart';
import '../../data/services/mock_data.dart';
import '../../viewmodels/driver_viewmodel.dart';

class DriverBoardingView extends StatelessWidget {
  const DriverBoardingView({super.key});

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<DriverViewModel>();
    final students = MockData.studentsClass10A;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Student Boarding Check',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '${vm.boardedStudents.length} / ${students.length} Boarded',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppColors.primary),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: students.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final student = students[index];
              final isBoarded = vm.boardedStudents.contains(student.id);

              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: isBoarded ? AppColors.successLight : AppColors.background,
                          shape: BoxShape.circle,
                        ),
                        alignment: Alignment.center,
                        child: AppSvgIcon(
                          isBoarded ? 'shield_check' : 'bus',
                          size: 18,
                          color: isBoarded ? AppColors.success : AppColors.textMuted,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              student.fullName,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            Text(
                              'Stop: Green Park • Roll #${student.rollNumber}',
                              style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                      InkWell(
                        onTap: () => vm.toggleBoarding(student.id),
                        borderRadius: BorderRadius.circular(8),
                        child: StatusBadge(
                          label: isBoarded ? 'BOARDED' : 'TAP TO BOARD',
                          type: isBoarded ? StatusType.success : StatusType.neutral,
                        ),
                      ),
                    ],
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
