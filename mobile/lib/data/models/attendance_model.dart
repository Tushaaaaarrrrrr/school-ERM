enum AttendanceStatus { present, absent, late, excused }

class AttendanceRecord {
  final String studentId;
  final String studentName;
  final String rollNumber;
  AttendanceStatus status;
  final String? remarks;

  AttendanceRecord({
    required this.studentId,
    required this.studentName,
    required this.rollNumber,
    this.status = AttendanceStatus.present,
    this.remarks,
  });
}
