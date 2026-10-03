import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/stat_card.dart';
import '../../core/widgets/status_badge.dart';
import '../../data/services/api_client.dart';
import '../../data/services/auth_service.dart';

class TeacherPaymentsView extends StatefulWidget {
  const TeacherPaymentsView({super.key});

  @override
  State<TeacherPaymentsView> createState() => _TeacherPaymentsViewState();
}

class _TeacherPaymentsViewState extends State<TeacherPaymentsView> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _payments = [];
  Map<String, dynamic>? _teacherProfile;

  @override
  void initState() {
    super.initState();
    _loadSalaryInfo();
  }

  Future<void> _loadSalaryInfo() async {
    final user = context.read<AuthService>().currentUser;
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // 1. Try loading payments from /api/employee-payments
      List<Map<String, dynamic>> payments = await ApiClient.getList('/api/employee-payments')
          .catchError((_) => <Map<String, dynamic>>[]);

      // 2. If empty, fallback to /api/teacher-payments
      if (payments.isEmpty) {
        payments = await ApiClient.getList('/api/teacher-payments')
            .catchError((_) => <Map<String, dynamic>>[]);
      }

      // 3. Try fetching teacher profile to get base salary
      Map<String, dynamic>? profile;
      if (user.teacherId != null && user.teacherId!.isNotEmpty) {
        try {
          final teachers = await ApiClient.getList('/api/teachers')
              .catchError((_) => <Map<String, dynamic>>[]);
          profile = teachers.firstWhere(
            (t) => t['id'] == user.teacherId,
            orElse: () => <String, dynamic>{},
          );
        } catch (_) {}
      }

      if (!mounted) return;
      setState(() {
        _payments = payments;
        _teacherProfile = profile;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthService>().currentUser;

    final baseSalaryNum = (_teacherProfile?['monthly_salary'] ??
        _teacherProfile?['salary'] ??
        (_payments.isNotEmpty ? (_payments.first['base_salary'] ?? _payments.first['amount']) : null) ??
        0) as num;

    final totalDisbursed = _payments.fold<double>(
      0,
      (sum, p) {
        final amt = (p['net_salary'] ?? p['paid_amount'] ?? p['amount'] ?? 0) as num;
        return sum + amt.toDouble();
      },
    );

    return RefreshIndicator(
      onRefresh: _loadSalaryInfo,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            const Text(
              'My Salary & Payment Receipts',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'View payroll history, salary disbursements, and payment statements.',
              style: TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),

            if (_loading) ...[
              const SizedBox(height: AppSpacing.lg),
              const LinearProgressIndicator(minHeight: 2),
            ],

            if (_error != null) ...[
              const SizedBox(height: AppSpacing.md),
              Card(
                color: AppColors.dangerLight,
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline,
                          color: AppColors.danger, size: 20),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Text(
                          _error!,
                          style: const TextStyle(
                              color: AppColors.danger, fontSize: 13),
                        ),
                      ),
                      TextButton(
                        onPressed: _loadSalaryInfo,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
            ],

            const SizedBox(height: AppSpacing.lg),

            // Salary Overview Card
            Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(AppRadius.lg),
                border: Border.all(color: AppColors.border),
                boxShadow: AppShadows.soft,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'MONTHLY BASE SALARY',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.8,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      StatusBadge(label: 'ACTIVE PAYROLL', type: BadgeType.success),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    baseSalaryNum > 0 ? AppFormatters.currency(baseSalaryNum) : '—',
                    style: const TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Faculty ID: ${user.loginId ?? user.teacherId ?? user.id}',
                    style: const TextStyle(
                      fontSize: 12,
                      fontFamily: 'monospace',
                      color: AppColors.textMuted,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.md),

            // Stats Row
            Row(
              children: [
                Expanded(
                  child: StatCard(
                    title: 'Total Receipts',
                    value: '${_payments.length}',
                    subtitle: 'Disbursement count',
                    iconName: 'receipt',
                    iconColor: AppColors.primary,
                    iconBgColor: AppColors.primaryLight,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: StatCard(
                    title: 'Total Received',
                    value: AppFormatters.currency(totalDisbursed),
                    subtitle: 'Cumulative net salary',
                    iconName: 'award',
                    iconColor: AppColors.success,
                    iconBgColor: AppColors.successLight,
                  ),
                ),
              ],
            ),

            const SizedBox(height: AppSpacing.xl),

            // Statement History Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Payment Statements (${_payments.length})',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const Icon(Icons.history, color: AppColors.textSecondary, size: 20),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),

            if (_payments.isEmpty && !_loading)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(AppSpacing.xl),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(Icons.receipt_long_outlined,
                            size: 40, color: AppColors.textMuted),
                        SizedBox(height: AppSpacing.sm),
                        Text(
                          'No salary disbursement statements found.',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else
              ..._payments.map((p) => _buildPaymentCard(p)),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentCard(Map<String, dynamic> p) {
    final billingMonth = p['billing_month'] ?? p['month'] ?? 'Statement';
    final amount = (p['net_salary'] ?? p['paid_amount'] ?? p['amount'] ?? 0) as num;
    final dateStr = p['payment_date'] ?? p['disbursed_at'] ?? p['created_at'] ?? '';
    final method = p['payment_method'] ?? 'Bank Transfer';
    final ref = p['transaction_reference'] ?? p['reference_id'] ?? '';
    final status = (p['status'] ?? 'paid').toString().toLowerCase();

    final isPaid = status == 'paid' || status == 'completed';

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(AppRadius.md),
                      ),
                      alignment: Alignment.center,
                      child: const Icon(Icons.receipt, color: AppColors.primary, size: 20),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Salary Statement ($billingMonth)',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        if (dateStr.isNotEmpty)
                          Text(
                            dateStr.toString().split('T').first,
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textSecondary,
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
                StatusBadge(
                  label: isPaid ? 'PAID' : status.toUpperCase(),
                  type: isPaid ? BadgeType.success : BadgeType.warning,
                ),
              ],
            ),
            const Divider(height: AppSpacing.lg),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Method: $method',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    if (ref.isNotEmpty)
                      Text(
                        'Ref: $ref',
                        style: const TextStyle(
                          fontSize: 11,
                          fontFamily: 'monospace',
                          color: AppColors.textMuted,
                        ),
                      ),
                  ],
                ),
                Text(
                  AppFormatters.currency(amount),
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primaryDark,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
