import 'package:intl/intl.dart';

class AppFormatters {
  static String currency(num amount) {
    final formatter = NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: amount % 1 == 0 ? 0 : 2,
    );
    return formatter.format(amount);
  }

  static String date(DateTime? date) {
    if (date == null) return '-';
    return DateFormat('dd MMM yyyy').format(date);
  }

  static String dateWithDay(DateTime? date) {
    if (date == null) return '-';
    return DateFormat('EEE, dd MMM yyyy').format(date);
  }

  static String time(DateTime? date) {
    if (date == null) return '-';
    return DateFormat('hh:mm a').format(date);
  }
}
