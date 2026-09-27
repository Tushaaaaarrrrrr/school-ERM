import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../core/widgets/status_badge.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/fee_model.dart';
import '../../viewmodels/student_viewmodel.dart';
import '../admin/student_billing_history_sheet.dart';

class StudentFeesView extends StatelessWidget {
  const StudentFeesView({super.key});

  StudentBillingRecord _getStudentBillingRecord() {
    return const StudentBillingRecord(
      studentName: 'Rahul Verma',
      className: 'Class 10-A',
      rollNumber: '105',
      admissionNumber: 'ADM-2024-005',
      parentName: 'Vikram Verma',
      parentPhone: '+91 98712 34567',
      totalAnnualFee: 45000,
      totalPaid: 38000,
      totalDue: 7000,
      invoices: [
        BillingInvoiceItem(
          invoiceNumber: 'INV-2026-09',
          title: 'Tuition & Bus Transport Fee',
          monthYear: 'September 2026',
          amount: 4500,
          paidAmount: 2000,
          dueDate: '10 Sep 2026',
          status: 'PARTIAL',
        ),
        BillingInvoiceItem(
          invoiceNumber: 'INV-2026-10',
          title: 'Tuition Fee (Q3 Installment)',
          monthYear: 'October 2026',
          amount: 4500,
          paidAmount: 0,
          dueDate: '10 Oct 2026',
          status: 'PENDING',
        ),
        BillingInvoiceItem(
          invoiceNumber: 'INV-2026-08',
          title: 'Tuition & Laboratory Fee',
          monthYear: 'August 2026',
          amount: 4500,
          paidAmount: 4500,
          dueDate: '10 Aug 2026',
          paidDate: '08 Aug 2026',
          paymentMode: 'UPI (GPay)',
          receiptNumber: 'REC-2026-081',
          status: 'PAID',
        ),
        BillingInvoiceItem(
          invoiceNumber: 'INV-2026-07',
          title: 'Tuition & Transport Fee',
          monthYear: 'July 2026',
          amount: 4500,
          paidAmount: 4500,
          dueDate: '10 Jul 2026',
          paidDate: '05 Jul 2026',
          paymentMode: 'NetBanking (HDFC)',
          receiptNumber: 'REC-2026-072',
          status: 'PAID',
        ),
        BillingInvoiceItem(
          invoiceNumber: 'INV-2026-04',
          title: 'Annual Admission, Library & Books Fee',
          monthYear: 'April 2026 (Term 1)',
          amount: 24500,
          paidAmount: 24500,
          dueDate: '15 Apr 2026',
          paidDate: '10 Apr 2026',
          paymentMode: 'Debit Card',
          receiptNumber: 'REC-2026-041',
          status: 'PAID',
        ),
      ],
      feeStructure: [
        FeeStructureItem(category: 'Monthly Tuition Fee', amount: 3000, frequency: 'month'),
        FeeStructureItem(category: 'Bus Transport Line (Route 4)', amount: 1500, frequency: 'month'),
        FeeStructureItem(category: 'Science & Computer Lab Facility', amount: 4000, frequency: 'year'),
        FeeStructureItem(category: 'Sports & Library Activity Fund', amount: 2500, frequency: 'year'),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<StudentViewModel>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Fee Statements & Invoices'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Due Balance Summary Card
            Card(
              color: AppColors.secondary,
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: const BoxDecoration(
                        color: Colors.white12,
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: const AppSvgIcon('receipt', size: 22, color: Colors.white),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Outstanding Balance',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                            ),
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
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppColors.secondary,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      ),
                      onPressed: () {
                        StudentBillingHistorySheet.show(context, record: _getStudentBillingRecord());
                      },
                      child: const Text('Pay Now', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 14),

            // Detailed Ledger CTA
            InkWell(
              onTap: () => StudentBillingHistorySheet.show(context, record: _getStudentBillingRecord()),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.primary.withOpacity(0.2)),
                ),
                child: const Row(
                  children: [
                    AppSvgIcon('receipt', size: 18, color: AppColors.primary),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Tap here to view Full Annual Billing Ledger & Receipts',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                      ),
                    ),
                    Icon(Icons.chevron_right, size: 18, color: AppColors.primary),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),
            const Text(
              'Monthly Invoices',
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
              itemCount: vm.invoices.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final inv = vm.invoices[index];

                BadgeType badgeType;
                String statusLabel;
                switch (inv.status) {
                  case FeeInvoiceStatus.paid:
                    badgeType = BadgeType.success;
                    statusLabel = 'PAID';
                    break;
                  case FeeInvoiceStatus.partial:
                    badgeType = BadgeType.warning;
                    statusLabel = 'PARTIAL';
                    break;
                  case FeeInvoiceStatus.overdue:
                    badgeType = BadgeType.danger;
                    statusLabel = 'OVERDUE';
                    break;
                  case FeeInvoiceStatus.pending:
                  default:
                    badgeType = BadgeType.neutral;
                    statusLabel = 'PENDING';
                    break;
                }

                return Card(
                  child: InkWell(
                    onTap: () => StudentBillingHistorySheet.show(context, record: _getStudentBillingRecord()),
                    borderRadius: BorderRadius.circular(12),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    inv.month,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                  ),
                                  Text(
                                    inv.invoiceNumber,
                                    style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                                  ),
                                ],
                              ),
                              StatusBadge(text: statusLabel, type: badgeType),
                            ],
                          ),
                          const SizedBox(height: 10),
                          const Divider(height: 1, color: AppColors.border),
                          const SizedBox(height: 10),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Due: ${AppFormatters.date(inv.dueDate)}',
                                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                              ),
                              Text(
                                '${AppFormatters.currency(inv.paidAmount)} / ${AppFormatters.currency(inv.amount)}',
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
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
}
