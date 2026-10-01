class StudentModel {
  final String id;
  final String fullName;
  final String admissionNumber;
  final String rollNumber;
  final String className;
  final String section;
  final String gender;
  final String? parentName;
  final String? parentPhone;
  final String? busRouteNumber;
  final String? busStopName;
  final String? photoUrl;
  final double attendancePercentage;

  const StudentModel({
    required this.id,
    required this.fullName,
    required this.admissionNumber,
    required this.rollNumber,
    required this.className,
    required this.section,
    required this.gender,
    this.parentName,
    this.parentPhone,
    this.busRouteNumber,
    this.busStopName,
    this.photoUrl,
    this.attendancePercentage = 94.5,
  });

  String get classSection => '$className - $section';

  factory StudentModel.fromJson(Map<String, dynamic> json) {
    final first = (json['first_name'] as String? ?? '').trim();
    final last = (json['last_name'] as String? ?? '').trim();
    final enrollment = json['current_enrollment'] as Map<String, dynamic>?;
    final guardian = json['guardian'] as Map<String, dynamic>?;
    return StudentModel(
      id: json['id'] as String,
      fullName: json['full_name'] as String? ?? '$first $last'.trim(),
      admissionNumber: json['admission_number'] as String? ?? json['registration_number'] as String? ?? '',
      rollNumber: json['roll_number'] as String? ?? '',
      className: json['class_name'] as String? ?? enrollment?['class_name'] as String? ?? '',
      section: json['section'] as String? ?? enrollment?['section_name'] as String? ?? '',
      gender: json['gender'] as String? ?? '',
      parentName: json['parent_name'] as String? ?? guardian?['guardian_name'] as String? ?? guardian?['father_name'] as String?,
      parentPhone: json['parent_phone'] as String? ?? guardian?['primary_phone'] as String?,
      busRouteNumber: json['bus_route_number'] as String?,
      busStopName: json['bus_stop_name'] as String?,
      photoUrl: json['photo_url'] as String?,
      attendancePercentage: (json['attendance_percentage'] as num?)?.toDouble() ?? 0,
    );
  }
}
