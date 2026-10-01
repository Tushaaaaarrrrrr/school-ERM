import 'package:flutter/foundation.dart';
import '../data/models/student_model.dart';
import '../data/models/fee_model.dart';
import '../data/models/exam_model.dart';
import '../data/models/transport_model.dart';
import '../data/models/notice_model.dart';
import '../data/models/user_model.dart';
import '../data/services/api_client.dart';

class StudentViewModel extends ChangeNotifier {
  StudentModel _student = const StudentModel(
    id: '',
    fullName: '',
    admissionNumber: '',
    rollNumber: '',
    className: '',
    section: '',
    gender: '',
  );
  List<FeeInvoiceModel> _invoices = const [];
  final List<ExamResultModel> _examResults = const [];
  final TransportRouteModel _route = TransportRouteModel.empty;
  List<NoticeModel> _notices = const [];
  String? _loadedFor;

  StudentModel get student => _student;
  List<FeeInvoiceModel> get invoices => _invoices;
  List<ExamResultModel> get examResults => _examResults;
  TransportRouteModel get route => _route;
  List<NoticeModel> get notices => _notices;

  double get totalOutstandingFee {
    return _invoices.fold(0, (acc, inv) => acc + inv.dueBalance);
  }

  double get totalPendingFees => totalOutstandingFee;
  int get unpaidInvoicesCount => _invoices.where((i) => i.status != FeeInvoiceStatus.paid).length;

  Future<void> loadFor(UserModel user) async {
    if (_loadedFor == user.id) return;
    _loadedFor = user.id;
    try {
      final students = await ApiClient.getStudents(schoolId: user.schoolId);
      if (students.isNotEmpty) {
        _student = students.firstWhere(
          (s) => s.admissionNumber.toLowerCase() == (user.loginId ?? '').toLowerCase(),
          orElse: () => students.first,
        );
      }
    } catch (_) {}
    try {
      final notices = await ApiClient.getNotices();
      if (notices.isNotEmpty) _notices = notices;
    } catch (_) {}
    try {
      final invoices = await ApiClient.getFeeInvoices();
      if (invoices.isNotEmpty) _invoices = invoices;
    } catch (_) {}
      notifyListeners();
  }
}
