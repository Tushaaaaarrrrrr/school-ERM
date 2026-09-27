import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/stat_card.dart';
import '../../core/widgets/status_badge.dart';
import 'student_billing_history_sheet.dart';

class AdminFeesView extends StatelessWidget {
  const AdminFeesView({super.key});

  StudentBillingRecord _getRahulBilling() {
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
          title: 'September Tuition & Bus Transport',
          monthYear: 'September 2026',
          amount: 4500,
          paidAmount: 2000,
          dueDate: '10 Sep 2026',
          status: 'PARTIAL',
        ),
        BillingInvoiceItem(
          invoiceNumber: 'INV-2026-10',
          title: 'October Tuition Fee (Q3 Installment)',
          monthYear: 'October 2026',
          amount: 4500,
          paidAmount: 0,
          dueDate: '10 Oct 2026',
          status: 'PENDING',
        ),
        BillingInvoiceItem(
          invoiceNumber: 'INV-2026-08',
          title: 'August Tuition & Transport Fee',
          monthYear: 'August 2026',
          amount: 3500,
          paidAmount: 3500,
          dueDate: '10 Aug 2026',
          paidDate: '08 Aug 2026',
          paymentMode: 'UPI (GPay)',
          receiptNumber: 'REC-2026-081',
          status: 'PAID',
        ),
        BillingInvoiceItem(
          invoiceNumber: 'INV-2026-07',
          title: 'July Tuition & Lab Activity',
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

  StudentBillingRecord _getAaravBilling() {
    return const StudentBillingRecord(
      studentName: 'Aarav Patel',
      className: 'Class 10-A',
      rollNumber: '101',
      admissionNumber: 'ADM-2024-001',
      parentName: 'Sanjay Patel',
      parentPhone: '+91 98765 43210',
      totalAnnualFee: 42000,
      totalPaid: 35000,
      totalDue: 7000,
      invoices: [
        BillingInvoiceItem(
          invoiceNumber: 'INV-2026-09',
          title: 'September Tuition Fee',
          monthYear: 'September 2026',
          amount: 3500,
          paidAmount: 0,
          dueDate: '10 Sep 2026',
          status: 'PENDING',
        ),
        BillingInvoiceItem(
          invoiceNumber: 'INV-2026-10',
          title: 'October Tuition Fee',
          monthYear: 'October 2026',
          amount: 3500,
          paidAmount: 0,
          dueDate: '10 Oct 2026',
          status: 'PENDING',
        ),
        BillingInvoiceItem(
          invoiceNumber: 'INV-2026-08',
          title: 'August Tuition Fee',
          monthYear: 'August 2026',
          amount: 3500,
          paidAmount: 3500,
          dueDate: '10 Aug 2026',
          paidDate: '09 Aug 2026',
          paymentMode: 'UPI (Paytm)',
          receiptNumber: 'REC-2026-088',
          status: 'PAID',
        ),
      ],
      feeStructure: [
        FeeStructureItem(category: 'Monthly Tuition Fee', amount: 3000, frequency: 'month'),
        FeeStructureItem(category: 'Science & Computer Lab Facility', amount: 3500, frequency: 'year'),
        FeeStructureItem(category: 'Sports & Library Activity Fund', amount: 2500, frequency: 'year'),
      ],
    );
  }

  StudentBillingRecord _getPriyaBilling() {
    return const StudentBillingRecord(
      studentName: 'Priya Nair',
      className: 'Class 10-A',
      rollNumber: '102',
      admissionNumber: 'ADM-2024-002',
      parentName: 'Raman Nair',
      parentPhone: '+91 98111 22334',
      totalAnnualFee: 48000,
      totalPaid: 48000,
      totalDue: 0,
      invoices: [
        BillingInvoiceItem(
          invoiceNumber: 'INV-2026-05',
          title: 'Term 1 Complete Installment & Tuition',
          monthYear: 'May 2026',
          amount: 12000,
          paidAmount: 12000,
          dueDate: '10 May 2026',
          paidDate: '02 May 2026',
          paymentMode: 'NetBanking (ICICI)',
          receiptNumber: 'REC-2026-054',
          status: 'PAID',
        ),
        BillingInvoiceItem(
          invoiceNumber: 'INV-2026-08',
          title: 'Term 2 Complete Installment & Tuition',
          monthYear: 'August 2026',
          amount: 12000,
          paidAmount: 12000,
          dueDate: '10 Aug 2026',
          paidDate: '01 Aug 2026',
          paymentMode: 'NetBanking (ICICI)',
          receiptNumber: 'REC-2026-082',
          status: 'PAID',
        ),
      ],
      feeStructure: [
        FeeStructureItem(category: 'Term 1 & Term 2 Tuition', amount: 24000, frequency: 'term'),
        FeeStructureItem(category: 'Bus Transport (Route 4)', amount: 12000, frequency: 'year'),
        FeeStructureItem(category: 'Science & Computer Lab Facility', amount: 6000, frequency: 'year'),
        FeeStructureItem(category: 'Sports & Library Activity', amount: 6000, frequency: 'year'),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Expanded(
                child: StatCard(
                  title: 'Collected Q2',
                  value: '₹18.4L',
                  subtitle: '86% Target Reached',
                  iconName: 'receipt',
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: StatCard(
                  title: 'Pending Arrears',
                  value: '₹2.8L',
                  subtitle: '24 Overdue Accounts',
                  iconName: 'calendar',
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Recent Fee Invoices & Payments',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'Tap for full billing ledger',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          Card(
            child: ListView(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                ListTile(
                  onTap: () => StudentBillingHistorySheet.show(context, record: _getRahulBilling()),
                  title: const Text('Rahul Verma (Class 10-A)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  subtitle: const Text('Inv #INV-2026-08 • Tuition & Transport Fee', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                  trailing: const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('₹3,500', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                      StatusBadge(label: 'PAID', type: StatusType.success),
                    ],
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  onTap: () => StudentBillingHistorySheet.show(context, record: _getAaravBilling()),
                  title: const Text('Aarav Patel (Class 10-A)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  subtitle: const Text('Inv #INV-2026-09 • Tuition Fee', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                  trailing: const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('₹3,500', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                      StatusBadge(label: 'PENDING', type: StatusType.warning),
                    ],
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  onTap: () => StudentBillingHistorySheet.show(context, record: _getPriyaBilling()),
                  title: const Text('Priya Nair (Class 10-A)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  subtitle: const Text('Inv #INV-2026-05 • Term 1 Installment', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                  trailing: const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('₹12,000', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                      StatusBadge(label: 'PAID', type: StatusType.success),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
