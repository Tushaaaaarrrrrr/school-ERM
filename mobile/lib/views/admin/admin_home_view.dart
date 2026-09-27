import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/stat_card.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../core/widgets/status_badge.dart';

class AdminHomeView extends StatelessWidget {
  final Function(int)? onTabSelected;

  const AdminHomeView({super.key, this.onTabSelected});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Stat Metrics Grid
          const Row(
            children: [
              Expanded(
                child: StatCard(
                  title: 'Total Students',
                  value: '1,248',
                  subtitle: '98.5% Active Enrolled',
                  iconName: 'graduation_cap',
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: StatCard(
                  title: 'Faculty Staff',
                  value: '76',
                  subtitle: 'Teaching & Non-Teaching',
                  iconName: 'teacher',
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Row(
            children: [
              Expanded(
                child: StatCard(
                  title: 'Fees Collected',
                  value: '₹18.4L',
                  subtitle: '86% Q2 Target Reached',
                  iconName: 'receipt',
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: StatCard(
                  title: 'Today Attendance',
                  value: '94.2%',
                  subtitle: '1,175 / 1,248 Present',
                  iconName: 'attendance',
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),
          const Text(
            'Quick Operations',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 12),

          // Quick Operation Cards
          Row(
            children: [
              Expanded(
                child: _QuickActionCard(
                  iconName: 'graduation_cap',
                  title: 'Students',
                  subtitle: 'Directory & Admissions',
                  onTap: () => onTabSelected?.call(1),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _QuickActionCard(
                  iconName: 'attendance',
                  title: 'Attendance',
                  subtitle: 'School Roll Call',
                  onTap: () => onTabSelected?.call(2),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _QuickActionCard(
                  iconName: 'receipt',
                  title: 'Fee Desk',
                  subtitle: 'Invoices & Receipts',
                  onTap: () => onTabSelected?.call(3),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _QuickActionCard(
                  iconName: 'bell',
                  title: 'Notices',
                  subtitle: 'Publish Circulars',
                  onTap: () => onTabSelected?.call(4),
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),
          const Text(
            'Recent Audit Log',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 12),

          Card(
            child: ListView(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              children: const [
                ListTile(
                  leading: AppSvgIcon('receipt', size: 18, color: AppColors.success),
                  title: Text('Fee Payment Received: ₹3,500', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  subtitle: Text('Rahul Verma (10-A) • Online UPI', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                  trailing: StatusBadge(label: 'Verified', type: StatusType.success),
                ),
                Divider(height: 1),
                ListTile(
                  leading: AppSvgIcon('attendance', size: 18, color: AppColors.primary),
                  title: Text('Class 10-A Attendance Submitted', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  subtitle: Text('Rajesh Sharma • 95.2% Present', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                  trailing: StatusBadge(label: 'Done', type: StatusType.info),
                ),
                Divider(height: 1),
                ListTile(
                  leading: AppSvgIcon('bus', size: 18, color: AppColors.secondary),
                  title: Text('Route 04 GPS Session Started', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  subtitle: Text('Gurmeet Singh • DL 01 AB 8842', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                  trailing: StatusBadge(label: 'Live', type: StatusType.warning),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final String iconName;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.iconName,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
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
                child: AppSvgIcon(iconName, size: 18, color: AppColors.primary),
              ),
              const SizedBox(height: 10),
              Text(
                title,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
