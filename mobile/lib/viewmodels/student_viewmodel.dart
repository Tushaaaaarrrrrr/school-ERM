import 'package:flutter/foundation.dart';
import '../data/models/student_model.dart';
import '../data/models/fee_model.dart';
import '../data/models/exam_model.dart';
import '../data/models/transport_model.dart';
import '../data/models/notice_model.dart';
import '../data/services/mock_data.dart';

class StudentViewModel extends ChangeNotifier {
  final StudentModel _student = MockData.studentsClass10A[4]; // Rahul Verma
  final List<FeeInvoiceModel> _invoices = MockData.studentInvoices;
  final List<ExamResultModel> _examResults = MockData.studentExamResults;
  final TransportRouteModel _route = MockData.sampleRoute;
  final List<NoticeModel> _notices = MockData.schoolNotices;

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
}
