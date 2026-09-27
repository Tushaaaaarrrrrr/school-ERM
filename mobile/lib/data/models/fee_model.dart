enum FeeInvoiceStatus { paid, partial, pending, overdue }

class FeeInvoiceModel {
  final String id;
  final String invoiceNumber;
  final String month;
  final double amount;
  final double paidAmount;
  final DateTime dueDate;
  final FeeInvoiceStatus status;

  const FeeInvoiceModel({
    required this.id,
    required this.invoiceNumber,
    required this.month,
    required this.amount,
    required this.paidAmount,
    required this.dueDate,
    required this.status,
  });

  double get dueBalance => amount - paidAmount;
}
