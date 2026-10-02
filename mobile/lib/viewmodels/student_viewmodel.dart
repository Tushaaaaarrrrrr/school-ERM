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
  List<Map<String, dynamic>> _receipts = const [];
  List<Map<String, dynamic>> _charges = const [];
  List<Map<String, dynamic>> _attendance = const [];
  List<Map<String, dynamic>> _leaves = const [];
  List<Map<String, dynamic>> _timetable = const [];
  List<Map<String, dynamic>> _results = const [];
  List<Map<String, dynamic>> _transportAssignments = const [];
  List<Map<String, dynamic>> _transportRoutes = const [];
  List<Map<String, dynamic>> _transportStops = const [];
  List<Map<String, dynamic>> _transportEvents = const [];
  String? _loadedFor;

  StudentModel get student => _student;
  List<FeeInvoiceModel> get invoices => _invoices;
  List<ExamResultModel> get examResults => _examResults;
  TransportRouteModel get route => _route;
  List<NoticeModel> get notices => _notices;
  List<Map<String, dynamic>> get receipts => _receipts;
  List<Map<String, dynamic>> get charges => _charges;
  List<Map<String, dynamic>> get attendance => _attendance;
  List<Map<String, dynamic>> get leaves => _leaves;
  List<Map<String, dynamic>> get timetable => _timetable;
  List<Map<String, dynamic>> get results => _results;
  List<Map<String, dynamic>> get transportAssignments => _transportAssignments;
  List<Map<String, dynamic>> get transportRoutes => _transportRoutes;
  List<Map<String, dynamic>> get transportStops => _transportStops;
  List<Map<String, dynamic>> get transportEvents => _transportEvents;

  double get totalOutstandingFee {
    final invoiceBalance = _invoices.fold(0.0, (acc, inv) => acc + inv.dueBalance);
    final chargesBalance = _charges
        .where((c) => c['status'] == 'pending' || c['status'] == 'partial')
        .fold(0.0, (acc, c) => acc + (((c['remaining_amount'] ?? c['amount'] ?? 0) as num).toDouble()));
    return invoiceBalance + chargesBalance;
  }

  double get totalPendingFees => totalOutstandingFee;
  int get unpaidInvoicesCount =>
      _invoices.where((i) => i.status != FeeInvoiceStatus.paid).length;
  UserModel? _currentUser;
  bool _isLoading = false;
  bool get isLoading => _isLoading;

  Future<void> refresh([UserModel? user]) =>
      loadFor(user ?? _currentUser, force: true);

  Future<void> loadFor(UserModel? user, {bool force = false}) async {
    if (user == null) return;
    _currentUser = user;
    if (!force && _loadedFor == user.id) return;
    _loadedFor = user.id;
    _isLoading = true;
    notifyListeners();
    try {
      final students = await ApiClient.getStudents(schoolId: user.schoolId);
      if (students.isNotEmpty) {
        final loginId = (user.loginId ?? '').toLowerCase();
        final cleanUserId = user.id.replaceFirst(RegExp(r'^usr-'), '').toLowerCase();
        if (user.role == UserRole.parent) {
          _student = students.first;
        } else {
          _student = students.firstWhere(
            (s) =>
                s.admissionNumber.toLowerCase() == loginId ||
                s.id.toLowerCase() == cleanUserId ||
                s.id.toLowerCase() == user.id.toLowerCase(),
            orElse: () => _student,
          );
        }
      }
      if ((_student.photoUrl == null || _student.photoUrl!.isEmpty) &&
          (user.avatarUrl != null && user.avatarUrl!.isNotEmpty)) {
        _student = _student.copyWith(photoUrl: user.avatarUrl);
      }
    } catch (_) {}
    try {
      final notices = await ApiClient.getNotices();
      if (notices.isNotEmpty) _notices = notices;
    } catch (_) {}
    final studentLookupId = _student.id.isNotEmpty
        ? _student.id
        : (user.loginId?.isNotEmpty == true ? user.loginId! : user.id.replaceFirst(RegExp(r'^usr-'), ''));
    try {
      _invoices = await ApiClient.getFeeInvoices(studentId: studentLookupId);
    } catch (_) {}
    try {
      _receipts = await ApiClient.getPaymentReceipts(studentId: studentLookupId);
    } catch (_) {}
    try {
      _charges = await ApiClient.getStudentCharges(studentId: studentLookupId);
    } catch (_) {}
    try {
      _attendance =
          await ApiClient.getStudentAttendance(studentId: studentLookupId);
    } catch (_) {}
    try {
      _leaves = await ApiClient.getStudentLeaves(studentId: _student.id);
    } catch (_) {}
    try {
      _timetable = await ApiClient.getTimetable(
        schoolId: user.schoolId,
        classId: _student.classId,
        sectionId: _student.sectionId,
      );
    } catch (_) {}
    try {
      _results = await ApiClient.getExamResults(studentId: _student.id);
    } catch (_) {}
    try {
      _transportAssignments =
          await ApiClient.getTransportAssignments(studentId: _student.id);
      _transportRoutes = await ApiClient.getTransportRoutes();
      final routeId = _transportAssignments.isNotEmpty
          ? (_transportAssignments.first['route_id'] as String? ?? '')
          : '';
      _transportStops = await ApiClient.getTransportStops(routeId: routeId);
      _transportEvents =
          await ApiClient.getTransportEvents(studentId: _student.id);
    } catch (_) {}
    _isLoading = false;
    notifyListeners();
  }
}
