import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../core/widgets/status_badge.dart';

class StudentBillingRecord {
  final String studentName;
  final String className;
  final String rollNumber;
  final String admissionNumber;
  final String parentName;
  final String parentPhone;
  final double totalAnnualFee;
  final double totalPaid;
  final double totalDue;
  final List<BillingInvoiceItem> invoices;
  final List<FeeStructureItem> feeStructure;

  const StudentBillingRecord({
    required this.studentName,
    required this.className,
    required this.rollNumber,
    required this.admissionNumber,
    required this.parentName,
    required this.parentPhone,
    required this.totalAnnualFee,
    required this.totalPaid,
    required this.totalDue,
    required this.invoices,
    required this.feeStructure,
  });
}

class BillingInvoiceItem {
  final String invoiceNumber;
  final String title;
  final String monthYear;
  final double amount;
  final double paidAmount;
  final String dueDate;
  final String? paidDate;
  final String? paymentMode;
  final String? receiptNumber;
  final String status; // 'PAID', 'PENDING', 'PARTIAL', 'UPCOMING'

  const BillingInvoiceItem({
    required this.invoiceNumber,
    required this.title,
    required this.monthYear,
    required this.amount,
    required this.paidAmount,
    required this.dueDate,
    this.paidDate,
    this.paymentMode,
    this.receiptNumber,
    required this.status,
  });
}

class FeeStructureItem {
  final String category;
  final double amount;
  final String frequency;

  const FeeStructureItem({
    required this.category,
    required this.amount,
    required this.frequency,
  });
}

class StudentBillingHistorySheet extends StatelessWidget {
  final StudentBillingRecord record;
  final bool canManageFees;

  const StudentBillingHistorySheet({
    super.key,
    required this.record,
    this.canManageFees = false,
  });

  static void show(BuildContext context,
      {required StudentBillingRecord record, bool canManageFees = false}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StudentBillingHistorySheet(
          record: record, canManageFees: canManageFees),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pendingInvoices = record.invoices
        .where((i) =>
            i.status == 'PENDING' ||
            i.status == 'PARTIAL' ||
            i.status == 'UPCOMING')
        .toList();
    final paidInvoices =
        record.invoices.where((i) => i.status == 'PAID').toList();
    final paidPercentage = record.totalAnnualFee > 0
        ? (record.totalPaid / record.totalAnnualFee) * 100
        : 0.0;

    return DraggableScrollableSheet(
      initialChildSize: 0.90,
      minChildSize: 0.5,
      maxChildSize: 0.96,
      builder: (_, controller) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // Drag Handle
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 12),

              // Header Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${record.studentName} (${record.className})',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Adm: ${record.admissionNumber} • Roll: ${record.rollNumber} • Parent: ${record.parentName}',
                            style: const TextStyle(
                                fontSize: 11, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close,
                          color: AppColors.textSecondary),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),

              const Divider(height: 16),

              Expanded(
                child: ListView(
                  controller: controller,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  children: [
                    // Fee Balance Overview Banner Card
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.08),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'OUTSTANDING DUE',
                                    style: TextStyle(
                                      color: Color(0xFF94A3B8),
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '₹${record.totalDue.toStringAsFixed(0)}',
                                    style: TextStyle(
                                      color: record.totalDue > 0
                                          ? const Color(0xFFF87171)
                                          : const Color(0xFF4ADE80),
                                      fontSize: 26,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: record.totalDue > 0
                                      ? Colors.red.withOpacity(0.2)
                                      : Colors.green.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: record.totalDue > 0
                                        ? Colors.red.withOpacity(0.4)
                                        : Colors.green.withOpacity(0.4),
                                  ),
                                ),
                                child: Text(
                                  record.totalDue > 0
                                      ? 'PAYMENT PENDING'
                                      : 'ALL DUES CLEARED',
                                  style: TextStyle(
                                    color: record.totalDue > 0
                                        ? const Color(0xFFFCA5A5)
                                        : const Color(0xFF86EFAC),
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Paid: ₹${record.totalPaid.toStringAsFixed(0)} / ₹${record.totalAnnualFee.toStringAsFixed(0)}',
                                style: const TextStyle(
                                    color: Color(0xFFE2E8F0),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500),
                              ),
                              Text(
                                '${paidPercentage.toStringAsFixed(0)}% Settled',
                                style: const TextStyle(
                                    color: Color(0xFF38BDF8),
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: paidPercentage / 100,
                              backgroundColor: const Color(0xFF334155),
                              valueColor: AlwaysStoppedAnimation<Color>(
                                paidPercentage >= 80
                                    ? const Color(0xFF4ADE80)
                                    : const Color(0xFFFBBF24),
                              ),
                              minHeight: 6,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Section: What Student Has To Pay / Pending Invoices
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Pending & Upcoming Dues',
                          style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.dangerLight,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            '${pendingInvoices.length} Invoices',
                            style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: AppColors.danger),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    if (pendingInvoices.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.successLight,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                              color: AppColors.success.withOpacity(0.3)),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.check_circle,
                                color: AppColors.success, size: 20),
                            SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Great news! No pending dues for this student.',
                                style: TextStyle(
                                    color: AppColors.success,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 12),
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      ...pendingInvoices
                          .map((inv) => _PendingInvoiceCard(invoice: inv)),

                    if (paidInvoices.isNotEmpty) ...[
                      const SizedBox(height: 22),
                      const Text(
                        'Payment History & Receipts Ledger',
                        style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: 10),
                      ...paidInvoices
                          .map((inv) => _PaidInvoiceCard(invoice: inv)),
                    ],

                    if (record.feeStructure.isNotEmpty) ...[
                      const SizedBox(height: 22),
                      const Text(
                        'Annual Fee Structure',
                        style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: 10),
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            children: [
                              ...record.feeStructure.map((item) => Padding(
                                    padding:
                                        const EdgeInsets.symmetric(vertical: 6),
                                    child: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Row(
                                          children: [
                                            const Icon(Icons.circle,
                                                size: 6,
                                                color: AppColors.primary),
                                            const SizedBox(width: 8),
                                            Text(
                                              item.category,
                                              style: const TextStyle(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w500,
                                                  color: AppColors.textPrimary),
                                            ),
                                          ],
                                        ),
                                        Text(
                                          '₹${item.amount.toStringAsFixed(0)} / ${item.frequency}',
                                          style: const TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                              color: AppColors.textPrimary),
                                        ),
                                      ],
                                    ),
                                  )),
                              const Divider(height: 16),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'Total Annual Commitment',
                                    style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.textPrimary),
                                  ),
                                  Text(
                                    '₹${record.totalAnnualFee.toStringAsFixed(0)}',
                                    style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.primary),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],

                    if (canManageFees) ...[
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(record.parentPhone.isEmpty
                                        ? 'Guardian phone is not available.'
                                        : 'SMS reminder requires the live messaging service.'),
                                    backgroundColor: AppColors.primary,
                                  ),
                                );
                              },
                              icon: const AppSvgIcon('bell',
                                  size: 16, color: AppColors.primary),
                              label: const Text('SMS Reminder'),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                        'Use Fee Desk invoices to record live payments.'),
                                    backgroundColor: AppColors.primary,
                                  ),
                                );
                              },
                              icon: const AppSvgIcon('receipt',
                                  size: 16, color: Colors.white),
                              label: const Text('Collect / Pay'),
                            ),
                          ),
                        ],
                      ),
                    ],
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _PendingInvoiceCard extends StatelessWidget {
  final BillingInvoiceItem invoice;

  const _PendingInvoiceCard({required this.invoice});

  @override
  Widget build(BuildContext context) {
    final remaining = invoice.amount - invoice.paidAmount;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: Color(0xFFFED7AA)),
      ),
      color: const Color(0xFFFFFBEB),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const AppSvgIcon('receipt',
                        size: 16, color: Color(0xFFD97706)),
                    const SizedBox(width: 8),
                    Text(
                      invoice.monthYear,
                      style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          color: Color(0xFF92400E)),
                    ),
                  ],
                ),
                StatusBadge(
                  label: invoice.status,
                  type: invoice.status == 'PARTIAL'
                      ? StatusType.warning
                      : StatusType.danger,
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              invoice.title,
              style: const TextStyle(fontSize: 12, color: Color(0xFF78350F)),
            ),
            const Divider(height: 16, color: Color(0xFFFDE68A)),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Due Date: ${invoice.dueDate}',
                      style: const TextStyle(
                          fontSize: 11, color: Color(0xFF92400E)),
                    ),
                    if (invoice.paidAmount > 0)
                      Text(
                        'Already Paid: ₹${invoice.paidAmount.toStringAsFixed(0)}',
                        style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.success),
                      ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text('Remaining Due',
                        style:
                            TextStyle(fontSize: 10, color: Color(0xFF92400E))),
                    Text(
                      '₹${remaining.toStringAsFixed(0)}',
                      style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                          color: Color(0xFFDC2626)),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PaidInvoiceCard extends StatelessWidget {
  final BillingInvoiceItem invoice;

  const _PaidInvoiceCard({required this.invoice});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const AppSvgIcon('receipt',
                        size: 16, color: AppColors.success),
                    const SizedBox(width: 8),
                    Text(
                      invoice.monthYear,
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ],
                ),
                const StatusBadge(label: 'PAID', type: StatusType.success),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              '${invoice.title} • Inv #${invoice.invoiceNumber}',
              style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
            ),
            const Divider(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Paid: ${invoice.paidDate ?? invoice.dueDate}',
                      style: const TextStyle(
                          fontSize: 11, color: AppColors.textSecondary),
                    ),
                    if (invoice.receiptNumber != null)
                      Text(
                        'Receipt: ${invoice.receiptNumber} (${invoice.paymentMode ?? "Online"})',
                        style: const TextStyle(
                            fontSize: 10,
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600),
                      ),
                  ],
                ),
                Text(
                  '₹${invoice.amount.toStringAsFixed(0)}',
                  style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: AppColors.textPrimary),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
