import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/status_badge.dart';
import '../../viewmodels/driver_viewmodel.dart';

class DriverStopsView extends StatelessWidget {
  const DriverStopsView({super.key});

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<DriverViewModel>();
    final route = vm.route;
    final stops = route.stops;
    final currentIndex = vm.currentStopIndex;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () => vm.refresh(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Error Banner
              if (vm.error != null && vm.error!.isNotEmpty) ...[
                Container(
                  margin: const EdgeInsets.only(bottom: 14),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.dangerLight,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.danger.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: AppColors.danger, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          vm.error!,
                          style: const TextStyle(
                            color: AppColors.danger,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, size: 16, color: AppColors.danger),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        onPressed: () => vm.clearError(),
                      ),
                    ],
                  ),
                ),
              ],

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${route.routeNumber} Stops',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                  if (stops.isNotEmpty)
                    Text(
                      'Stop ${currentIndex + 1} of ${stops.length}',
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                    ),
                ],
              ),
              const SizedBox(height: 12),

              if (stops.isEmpty)
                Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: AppColors.border),
                  ),
                  child: const Padding(
                    padding: EdgeInsets.all(32.0),
                    child: Center(
                      child: Text(
                        'No stops assigned to this route.',
                        style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                      ),
                    ),
                  ),
                )
              else ...[
                // Stop progression action card
                Card(
                  color: AppColors.primaryLight,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: AppColors.primary.withValues(alpha: 0.2)),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        const Icon(Icons.navigation_rounded, color: AppColors.primary, size: 24),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                currentIndex < stops.length
                                    ? 'Current Stop: ${stops[currentIndex].name}'
                                    : 'Route Completed',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.primaryDark),
                              ),
                              Text(
                                currentIndex < stops.length
                                    ? 'Scheduled: ${stops[currentIndex].scheduledTime}'
                                    : 'All designated stops reached',
                                style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ),
                        if (currentIndex < stops.length)
                          FilledButton.icon(
                            style: FilledButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            icon: const Icon(Icons.done_all, size: 14),
                            label: const Text('Depart', style: TextStyle(fontSize: 12)),
                            onPressed: () => vm.markStopPassed(currentIndex),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 14),

                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: stops.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final stop = stops[index];
                    final isPassed = stop.isPassed;
                    final isCurrent = stop.isCurrent;

                    return Card(
                      elevation: isCurrent ? 2 : 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(
                          color: isCurrent
                              ? AppColors.primary
                              : (isPassed ? AppColors.success.withValues(alpha: 0.3) : AppColors.border),
                          width: isCurrent ? 1.5 : 1.0,
                        ),
                      ),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(12),
                        onTap: () => vm.setCurrentStopIndex(index),
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Row(
                            children: [
                              Container(
                                width: 34,
                                height: 34,
                                decoration: BoxDecoration(
                                  color: isPassed
                                      ? AppColors.successLight
                                      : (isCurrent ? AppColors.primary : AppColors.background),
                                  shape: BoxShape.circle,
                                ),
                                alignment: Alignment.center,
                                child: isPassed
                                    ? const Icon(Icons.check, size: 18, color: AppColors.success)
                                    : Text(
                                        '${index + 1}',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                          color: isCurrent ? Colors.white : AppColors.textSecondary,
                                        ),
                                      ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      stop.name,
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                        color: isPassed ? AppColors.textSecondary : AppColors.textPrimary,
                                      ),
                                    ),
                                    Text(
                                      'Scheduled: ${stop.scheduledTime}',
                                      style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                                    ),
                                  ],
                                ),
                              ),
                              if (isCurrent)
                                const StatusBadge(
                                  label: 'CURRENT',
                                  type: BadgeType.info,
                                )
                              else if (isPassed)
                                const StatusBadge(
                                  label: 'PASSED',
                                  type: BadgeType.success,
                                ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
