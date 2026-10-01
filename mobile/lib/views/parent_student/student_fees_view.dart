import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../core/widgets/status_badge.dart';
import '../../data/models/fee_model.dart';
import '../../viewmodels/student_viewmodel.dart';

class StudentFeesView extends StatelessWidget {
  const StudentFeesView({super.key});

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<StudentViewModel>();
    final receipts = vm.receipts;
    final charges = vm.charges;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Card(
            color: AppColors.secondary,
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Row(
                children: [
                  const AppSvgIcon('receipt', size: 24, color: Colors.white),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Outstanding Balance',
                          style: TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          AppFormatters.currency(vm.totalOutstandingFee),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
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
          const Text(
            'Official Receipts',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          if (receipts.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(18),
                child: Text(
                  'No payment receipts returned by the school yet.',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
              ),
            )
          else
            ...receipts.map((receipt) {
              final paidAt = DateTime.tryParse(
                  '${receipt['payment_date'] ?? receipt['created_at'] ?? ''}');
              return Card(
                child: ListTile(
                  title: Text(
                    '${receipt['receipt_number'] ?? 'Receipt'}',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  subtitle: Text(
                    paidAt == null
                        ? 'Payment receipt'
                        : 'Paid ${AppFormatters.date(paidAt)}',
                    style: const TextStyle(
                        color: AppColors.textSecondary, fontSize: 11),
                  ),
                  trailing: Text(
                    AppFormatters.currency(
                        (receipt['amount_paid'] as num?) ?? 0),
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              );
            }),
          const SizedBox(height: 20),
          const Text(
            'Invoices',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          if (vm.invoices.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Center(
                  child: Text(
                    'No fee invoices returned by the server yet.',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                ),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: vm.invoices.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final invoice = vm.invoices[index];
                return Card(
                  child: ListTile(
                    title: Text(
                      invoice.month.isEmpty ? 'Invoice' : invoice.month,
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    subtitle: Text(
                      invoice.invoiceNumber,
                      style: const TextStyle(
                          color: AppColors.textMuted, fontSize: 11),
                    ),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '${AppFormatters.currency(invoice.paidAmount)} / ${AppFormatters.currency(invoice.amount)}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        _status(invoice.status),
                      ],
                    ),
                  ),
                );
              },
            ),
          const SizedBox(height: 20),
          const Text(
            'Extra Charges & Fines',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          if (charges.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(18),
                child: Text(
                  'No extra charges returned by the school yet.',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
              ),
            )
          else
            ...charges.map((charge) {
              return Card(
                child: ListTile(
                  title: Text(
                    '${charge['charge_name'] ?? 'Charge'}',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  subtitle: Text(
                    '${charge['description'] ?? charge['status'] ?? ''}',
                    style: const TextStyle(
                        color: AppColors.textSecondary, fontSize: 11),
                  ),
                  trailing: Text(
                    AppFormatters.currency(
                        (charge['remaining_amount'] as num?) ??
                            (charge['amount'] as num?) ??
                            0),
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }

  static StatusBadge _status(FeeInvoiceStatus status) {
    switch (status) {
      case FeeInvoiceStatus.paid:
        return const StatusBadge(label: 'PAID', type: StatusType.success);
      case FeeInvoiceStatus.partial:
        return const StatusBadge(label: 'PARTIAL', type: StatusType.warning);
      case FeeInvoiceStatus.overdue:
        return const StatusBadge(label: 'OVERDUE', type: StatusType.danger);
      case FeeInvoiceStatus.pending:
        return const StatusBadge(label: 'PENDING', type: StatusType.info);
    }
  }
}
