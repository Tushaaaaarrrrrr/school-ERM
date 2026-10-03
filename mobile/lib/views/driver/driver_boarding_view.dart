import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../core/widgets/status_badge.dart';
import '../../data/models/student_model.dart';
import '../../viewmodels/driver_viewmodel.dart';

class DriverBoardingView extends StatelessWidget {
  const DriverBoardingView({super.key});

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<DriverViewModel>();
    final List<StudentModel> students = vm.students;

    return RefreshIndicator(
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
                const Text(
                  'Student Boarding Check',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                Wrap(
                  spacing: 6,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '${vm.boardedStudents.length} / ${students.length} Boarded',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                    if (vm.notRidingStudents.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.warningLight,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '${vm.notRidingStudents.length} Not Riding',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                            color: AppColors.warning,
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),

            if (students.isEmpty)
              Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: const BorderSide(color: AppColors.border),
                ),
                child: const Padding(
                  padding: EdgeInsets.all(32.0),
                  child: Center(
                    child: Column(
                      children: [
                        AppSvgIcon('bus', size: 40, color: AppColors.textMuted),
                        SizedBox(height: 12),
                        Text(
                          'No Students on Route',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Student boarding manifest will appear here once route is dispatched.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: students.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final student = students[index];
                  final status = vm.statusFor(student.id);

                  return Card(
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(
                        color: _statusBorderColor(status),
                        width: status != 'pending' ? 1.5 : 1.0,
                      ),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Row(
                        children: [
                          Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              color: _statusBgColor(status),
                              shape: BoxShape.circle,
                            ),
                            alignment: Alignment.center,
                            child: Icon(
                              _statusIcon(status),
                              size: 20,
                              color: _statusFgColor(status),
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
                                const SizedBox(height: 2),
                                Text(
                                  'Stop: ${vm.stopNameFor(student.id).isEmpty ? '—' : vm.stopNameFor(student.id)} • Roll #${student.rollNumber}',
                                  style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                          InkWell(
                            onTap: () => _showStatusActionSheet(context, vm, student),
                            borderRadius: BorderRadius.circular(8),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  StatusBadge(
                                    label: _statusLabel(status),
                                    type: _statusBadgeType(status),
                                  ),
                                  const SizedBox(width: 4),
                                  const Icon(Icons.arrow_drop_down, size: 18, color: AppColors.textMuted),
                                ],
                              ),
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
      ),
    );
  }

  void _showStatusActionSheet(BuildContext context, DriverViewModel vm, StudentModel student) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (bottomCtx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Update Status: ${student.fullName}',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 4),
                Text(
                  'Designated Stop: ${vm.stopNameFor(student.id).isEmpty ? 'Route Stop' : vm.stopNameFor(student.id)}',
                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 16),
                ListTile(
                  leading: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: AppColors.successLight,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    alignment: Alignment.center,
                    child: const Icon(Icons.check_circle_outline, color: AppColors.success, size: 20),
                  ),
                  title: const Text('Picked Up / Boarded', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  subtitle: const Text('Student boarded the vehicle', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                  onTap: () {
                    Navigator.pop(bottomCtx);
                    vm.setStudentStatus(student.id, 'picked_up');
                  },
                ),
                ListTile(
                  leading: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: AppColors.infoLight,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    alignment: Alignment.center,
                    child: const Icon(Icons.location_on_outlined, color: AppColors.info, size: 20),
                  ),
                  title: const Text('Safely Dropped Off', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  subtitle: const Text('Student reached destination / school stop', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                  onTap: () {
                    Navigator.pop(bottomCtx);
                    vm.setStudentStatus(student.id, 'dropped_off');
                  },
                ),
                ListTile(
                  leading: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: AppColors.warningLight,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    alignment: Alignment.center,
                    child: const Icon(Icons.person_off_outlined, color: AppColors.warning, size: 20),
                  ),
                  title: const Text('Not Riding / Absent', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  subtitle: const Text('Student marked absent or not taking transport today', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                  onTap: () {
                    Navigator.pop(bottomCtx);
                    vm.setStudentStatus(student.id, 'not_riding');
                  },
                ),
                ListTile(
                  leading: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    alignment: Alignment.center,
                    child: const Icon(Icons.replay, color: AppColors.textMuted, size: 20),
                  ),
                  title: const Text('Reset to Pending', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  subtitle: const Text('Clear recorded status for today', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                  onTap: () {
                    Navigator.pop(bottomCtx);
                    vm.setStudentStatus(student.id, 'pending');
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'picked_up':
        return 'BOARDED';
      case 'dropped_off':
        return 'DROPPED OFF';
      case 'not_riding':
        return 'NOT RIDING';
      default:
        return 'PENDING';
    }
  }

  BadgeType _statusBadgeType(String status) {
    switch (status) {
      case 'picked_up':
        return BadgeType.success;
      case 'dropped_off':
        return BadgeType.info;
      case 'not_riding':
        return BadgeType.warning;
      default:
        return BadgeType.neutral;
    }
  }

  Color _statusBgColor(String status) {
    switch (status) {
      case 'picked_up':
        return AppColors.successLight;
      case 'dropped_off':
        return AppColors.infoLight;
      case 'not_riding':
        return AppColors.warningLight;
      default:
        return AppColors.background;
    }
  }

  Color _statusFgColor(String status) {
    switch (status) {
      case 'picked_up':
        return AppColors.success;
      case 'dropped_off':
        return AppColors.info;
      case 'not_riding':
        return AppColors.warning;
      default:
        return AppColors.textMuted;
    }
  }

  Color _statusBorderColor(String status) {
    switch (status) {
      case 'picked_up':
        return AppColors.success.withValues(alpha: 0.3);
      case 'dropped_off':
        return AppColors.info.withValues(alpha: 0.3);
      case 'not_riding':
        return AppColors.warning.withValues(alpha: 0.3);
      default:
        return AppColors.border;
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'picked_up':
        return Icons.check_circle;
      case 'dropped_off':
        return Icons.location_on;
      case 'not_riding':
        return Icons.cancel_outlined;
      default:
        return Icons.directions_bus_outlined;
    }
  }
}
