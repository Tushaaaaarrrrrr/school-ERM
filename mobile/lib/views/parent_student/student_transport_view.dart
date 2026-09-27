import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../viewmodels/student_viewmodel.dart';

class StudentTransportView extends StatelessWidget {
  const StudentTransportView({super.key});

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<StudentViewModel>();
    final route = vm.route;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Live Bus Transport Tracking'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Vehicle & Driver Details Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: AppColors.primaryLight,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          alignment: Alignment.center,
                          child: const AppSvgIcon('bus', size: 24, color: AppColors.primary),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                route.routeNumber,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                ),
                              ),
                              Text(
                                'Vehicle: ${route.vehicleNumber}',
                                style: const TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppColors.successLight,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const AppSvgIcon('sparkles', size: 14, color: AppColors.success),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              route.currentStatus,
                              style: const TextStyle(
                                color: AppColors.success,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),
            // Driver Contact Pill
            Card(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    const CircleAvatar(
                      backgroundColor: AppColors.primaryLight,
                      child: AppSvgIcon('teacher', size: 18, color: AppColors.primary),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            route.driverName,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          Text(
                            route.driverPhone,
                            style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const AppSvgIcon('phone', size: 18, color: AppColors.primary),
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Calling ${route.driverName}...')),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),
            const Text(
              'Route Stops & Schedule',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),

            // Route Stops Timeline
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: route.stops.length,
              itemBuilder: (context, index) {
                final stop = route.stops[index];
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Column(
                      children: [
                        Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: stop.isCurrent
                                ? AppColors.primary
                                : (stop.isPassed ? AppColors.success : Colors.white),
                            border: Border.all(
                              color: stop.isCurrent
                                  ? AppColors.primary
                                  : (stop.isPassed ? AppColors.success : AppColors.border),
                              width: 2,
                            ),
                          ),
                          child: stop.isPassed
                              ? const Icon(Icons.check, size: 12, color: Colors.white)
                              : null,
                        ),
                        if (index < route.stops.length - 1)
                          Container(
                            width: 2,
                            height: 40,
                            color: stop.isPassed ? AppColors.success : AppColors.border,
                          ),
                      ],
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 24.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              stop.name,
                              style: TextStyle(
                                fontWeight: stop.isCurrent ? FontWeight.bold : FontWeight.w600,
                                fontSize: 13,
                                color: stop.isCurrent ? AppColors.primary : AppColors.textPrimary,
                              ),
                            ),
                            Text(
                              'Scheduled: ${stop.scheduledTime}',
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.textMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
