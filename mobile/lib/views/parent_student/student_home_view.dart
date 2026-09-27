import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../core/widgets/stat_card.dart';
import '../../core/widgets/status_badge.dart';
import '../../core/utils/formatters.dart';
import '../../viewmodels/student_viewmodel.dart';

class StudentHomeView extends StatelessWidget {
  final Function(int)? onTabSelected;

  const StudentHomeView({super.key, this.onTabSelected});

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<StudentViewModel>();
    final student = vm.student;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Quick Stat Cards
          Row(
            children: [
              Expanded(
                child: StatCard(
                  title: 'Attendance',
                  value: '${student.attendancePercentage}%',
                  subtitle: 'Present',
                  iconName: 'attendance',
                  iconColor: AppColors.success,
                  iconBgColor: AppColors.successLight,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: StatCard(
                  title: 'Due Fees',
                  value: AppFormatters.currency(vm.totalPendingFees),
                  subtitle: '${vm.unpaidInvoicesCount} Invoices',
                  iconName: 'receipt',
                  iconColor: AppColors.warning,
                  iconBgColor: AppColors.warningLight,
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Academic & Services Quick Grid
          const Text(
            'Academic & Services',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: _ActionCard(
                  icon: 'award',
                  title: 'Report Cards',
                  subtitle: 'Term 1 Exam Results',
                  onTap: () => onTabSelected?.call(1),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _ActionCard(
                  icon: 'receipt',
                  title: 'Fee Invoices',
                  subtitle: 'Statements & Pay',
                  onTap: () => onTabSelected?.call(2),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _ActionCard(
                  icon: 'bus',
                  title: 'Bus Transport',
                  subtitle: 'Live Route 4 Tracking',
                  onTap: () => onTabSelected?.call(3),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _ActionCard(
                  icon: 'bell',
                  title: 'Notices & Events',
                  subtitle: '${vm.notices.length} Announcements',
                  onTap: () => onTabSelected?.call(4),
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Notice Board
          const Text(
            'Notice Board',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 12),

          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: vm.notices.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final notice = vm.notices[index];
              return Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: const BorderSide(color: AppColors.border),
                ),
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
                              notice.title,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ),
                          if (notice.isUrgent)
                            const StatusBadge(
                              label: 'URGENT',
                              type: StatusType.danger,
                            ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        notice.content,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        AppFormatters.date(notice.publishedDate),
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppColors.textMuted,
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

class _ActionCard extends StatelessWidget {
  final String icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _ActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.border),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                alignment: Alignment.center,
                child: AppSvgIcon(icon, size: 18, color: AppColors.primary),
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(
                  fontSize: 10,
                  color: AppColors.textSecondary,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
