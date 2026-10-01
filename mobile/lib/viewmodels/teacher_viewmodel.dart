import 'package:flutter/foundation.dart';
import '../data/models/student_model.dart';
import '../data/models/attendance_model.dart';
import '../data/models/user_model.dart';
import '../data/services/api_client.dart';

class TeacherViewModel extends ChangeNotifier {
  List<StudentModel> _students = [];
  Map<String, AttendanceRecord> _attendanceMap = {};
  String _selectedClass = '';
  final DateTime _attendanceDate = DateTime.now();
  String? _loadedFor;

  TeacherViewModel() {
    _initAttendance();
  }

  List<StudentModel> get students => _students;
  Map<String, AttendanceRecord> get attendanceMap => _attendanceMap;
  String get selectedClass => _selectedClass.isNotEmpty ? _selectedClass : 'No class assigned';
  DateTime get attendanceDate => _attendanceDate;

  int get presentCount => _attendanceMap.values.where((a) => a.status == AttendanceStatus.present).length;
  int get absentCount => _attendanceMap.values.where((a) => a.status == AttendanceStatus.absent).length;
  int get lateCount => _attendanceMap.values.where((a) => a.status == AttendanceStatus.late).length;
  int get todayPeriodCount => 0;

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

  Future<void> loadFor(UserModel user) async {
    if (_loadedFor == user.id) return;
    _loadedFor = user.id;
    try {
      final students = await ApiClient.getStudents(schoolId: user.schoolId);
      _students = students;
      if (students.isNotEmpty) {
        _selectedClass = '${students.first.className} - Section ${students.first.section}';
      } else {
        _selectedClass = '';
      }
      _initAttendance();
      notifyListeners();
    } catch (_) {
      _students = [];
      _selectedClass = '';
      _initAttendance();
      notifyListeners();
    }
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
