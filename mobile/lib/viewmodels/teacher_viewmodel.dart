import 'package:flutter/foundation.dart';
import '../data/models/student_model.dart';
import '../data/models/attendance_model.dart';
import '../data/services/mock_data.dart';

class TeacherViewModel extends ChangeNotifier {
  final List<StudentModel> _students = List.from(MockData.studentsClass10A);
  late Map<String, AttendanceRecord> _attendanceMap;
  final String _selectedClass = 'Class 10 - A';
  final DateTime _attendanceDate = DateTime.now();

  TeacherViewModel() {
    _initAttendance();
  }

  List<StudentModel> get students => _students;
  Map<String, AttendanceRecord> get attendanceMap => _attendanceMap;
  String get selectedClass => _selectedClass;
  DateTime get attendanceDate => _attendanceDate;

  int get presentCount => _attendanceMap.values.where((a) => a.status == AttendanceStatus.present).length;
  int get absentCount => _attendanceMap.values.where((a) => a.status == AttendanceStatus.absent).length;
  int get lateCount => _attendanceMap.values.where((a) => a.status == AttendanceStatus.late).length;

  void _initAttendance() {
    _attendanceMap = {
      for (var s in _students)
        s.id: AttendanceRecord(
          studentId: s.id,
          studentName: s.fullName,
          rollNumber: s.rollNumber,
          status: AttendanceStatus.present,
        )
    };
  }

  void toggleStatus(String studentId, AttendanceStatus newStatus) {
    if (_attendanceMap.containsKey(studentId)) {
      _attendanceMap[studentId]!.status = newStatus;
      notifyListeners();
    }
  }

  void markAllPresent() {
    for (var a in _attendanceMap.values) {
      a.status = AttendanceStatus.present;
    }
    notifyListeners();
  }

  void saveAttendance() {
    notifyListeners();
  }
}
