import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../data/services/auth_service.dart';
import '../../data/models/user_model.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../core/widgets/stat_card.dart';
import '../../data/models/fee_model.dart';
import '../../data/models/student_model.dart';
import '../../data/services/api_client.dart';

class AdminHomeView extends StatelessWidget {
  final Function(int)? onTabSelected;

  const AdminHomeView({super.key, this.onTabSelected});

  @override
  Widget build(BuildContext context) {
    final role = context.watch<AuthService>().currentUser.role;
    return FutureBuilder<_AdminHomeData>(
      future: _AdminHomeData.load(),
      builder: (context, snapshot) {
        final data = snapshot.data ?? const _AdminHomeData.empty();
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
                      value: '${data.students.length}',
                      subtitle: 'Live enrolled records',
                      iconName: 'graduation_cap',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: StatCard(
                      title: 'Classes',
                      value: '${data.classCount}',
                      subtitle: 'From enrollments',
                      iconName: 'calendar',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: StatCard(
                      title: 'Collected',
                      value: '₹${data.paidAmount.toStringAsFixed(0)}',
                      subtitle: 'Live invoices',
                      iconName: 'receipt',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: StatCard(
                      title: 'Pending',
                      value: '₹${data.pendingAmount.toStringAsFixed(0)}',
                      subtitle: 'Outstanding',
                      iconName: 'attendance',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const Text(
                'Quick Operations',
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
                    child: _QuickActionCard(
                      iconName: 'graduation_cap',
                      title: 'Students',
                      subtitle: 'Directory & admissions',
                      onTap: () => onTabSelected
                          ?.call(role == UserRole.schoolAdmin ? 1 : 3),
                    ),
                  ),
                  const SizedBox(width: 12),
                  if (role != UserRole.accountant)
                    Expanded(
                      child: _QuickActionCard(
                        iconName: 'attendance',
                        title: 'Attendance',
                        subtitle: 'Live records only',
                        onTap: () => onTabSelected
                            ?.call(role == UserRole.schoolAdmin ? 5 : 4),
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
                      subtitle: 'Invoices & receipts',
                      onTap: () =>
                          onTabSelected?.call(role == UserRole.schoolAdmin
                              ? 14
                              : role == UserRole.accountant
                                  ? 1
                                  : 2),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _QuickActionCard(
                      iconName: 'bell',
                      title: 'Notices',
                      subtitle: 'Circulars & alerts',
                      onTap: () =>
                          onTabSelected?.call(role == UserRole.schoolAdmin
                              ? 18
                              : role == UserRole.accountant
                                  ? 7
                                  : 5),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Row(
                    children: const [
                      AppSvgIcon('shield_check',
                          size: 20, color: AppColors.primary),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Recent activity appears here when the server returns audit events for this school.',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _AdminHomeData {
  final List<StudentModel> students;
  final List<FeeInvoiceModel> invoices;

  const _AdminHomeData({required this.students, required this.invoices});
  const _AdminHomeData.empty() : this(students: const [], invoices: const []);

  int get classCount => students
      .map((s) => s.classSection)
      .where((v) => v.trim().isNotEmpty && v.trim() != '-')
      .toSet()
      .length;
  double get paidAmount =>
      invoices.fold(0, (sum, invoice) => sum + invoice.paidAmount);
  double get pendingAmount =>
      invoices.fold(0, (sum, invoice) => sum + invoice.dueBalance);

  static Future<_AdminHomeData> load() async {
    final students = await ApiClient.getStudents();
    final invoices = await ApiClient.getFeeInvoices();
    return _AdminHomeData(students: students, invoices: invoices);
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
              AppSvgIcon(iconName, size: 22, color: AppColors.primary),
              const SizedBox(height: 10),
              Text(title,
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 2),
              Text(subtitle,
                  style: const TextStyle(
                      fontSize: 10, color: AppColors.textSecondary)),
            ],
          ),
        ),
      ),
    );
  }
}
