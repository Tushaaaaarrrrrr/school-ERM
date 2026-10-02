enum FeeInvoiceStatus { paid, partial, pending, overdue }

class FeeInvoiceModel {
  final String id;
  final String studentId;
  final String invoiceNumber;
  final String month;
  final double amount;
  final double paidAmount;
  final DateTime dueDate;
  final FeeInvoiceStatus status;

  const FeeInvoiceModel({
    required this.id,
    required this.studentId,
    required this.invoiceNumber,
    required this.month,
    required this.amount,
    required this.paidAmount,
    required this.dueDate,
    required this.status,
  });

  double get dueBalance => amount - paidAmount;

  factory FeeInvoiceModel.fromJson(Map<String, dynamic> json) {
    final status = (json['status'] as String? ?? '').toLowerCase();
    return FeeInvoiceModel(
      id: json['id'] as String? ?? '',
      studentId: json['student_id'] as String? ?? '',
      invoiceNumber: json['invoice_number'] as String? ?? json['id'] as String? ?? '',
      month: json['month'] as String? ??
          json['billing_month'] as String? ??
          json['month_year'] as String? ??
          json['fee_structure_name'] as String? ??
          '',
      amount: (json['amount'] as num? ??
              json['total_amount'] as num? ??
              json['final_amount'] as num? ??
              json['base_amount'] as num? ??
              0)
          .toDouble(),
      paidAmount: (json['paid_amount'] as num? ?? 0).toDouble(),
      dueDate: DateTime.tryParse(json['due_date'] as String? ?? '') ??
          DateTime.now(),
      status: status == 'paid'
          ? FeeInvoiceStatus.paid
          : status == 'partial'
              ? FeeInvoiceStatus.partial
              : status == 'overdue'
                  ? FeeInvoiceStatus.overdue
                  : FeeInvoiceStatus.pending,
    );
  }
}
