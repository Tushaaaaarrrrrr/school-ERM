class StudentModel {
  final String id;
  final String fullName;
  final String admissionNumber;
  final String rollNumber;
  final String className;
  final String section;
  final String classId;
  final String sectionId;
  final String gender;
  final String? parentName;
  final String? parentPhone;
  final String? busRouteNumber;
  final String? busStopName;
  final String? photoUrl;
  final String healthInfo;
  final double attendancePercentage;

  const StudentModel({
    required this.id,
    required this.fullName,
    required this.admissionNumber,
    required this.rollNumber,
    required this.className,
    required this.section,
    this.classId = '',
    this.sectionId = '',
    required this.gender,
    this.parentName,
    this.parentPhone,
    this.busRouteNumber,
    this.busStopName,
    this.photoUrl,
    this.healthInfo = '',
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
      admissionNumber: json['admission_number'] as String? ??
          json['registration_number'] as String? ??
          '',
      rollNumber: json['roll_number'] as String? ?? '',
      className: json['class_name'] as String? ??
          enrollment?['class_name'] as String? ??
          '',
      section: json['section'] as String? ??
          enrollment?['section_name'] as String? ??
          '',
      classId: json['class_id'] as String? ??
          enrollment?['class_id'] as String? ??
          '',
      sectionId: json['section_id'] as String? ??
          enrollment?['section_id'] as String? ??
          '',
      gender: json['gender'] as String? ?? '',
      parentName: json['parent_name'] as String? ??
          guardian?['guardian_name'] as String? ??
          guardian?['father_name'] as String?,
      parentPhone: json['parent_phone'] as String? ??
          guardian?['primary_phone'] as String?,
      busRouteNumber: json['bus_route_number'] as String?,
      busStopName: json['bus_stop_name'] as String?,
      photoUrl: json['photo_url'] as String?,
      healthInfo: json['health_info'] as String? ??
          json['medical_info'] as String? ??
          json['medical_notes'] as String? ??
          '',
      attendancePercentage:
          (json['attendance_percentage'] as num?)?.toDouble() ?? 0,
    );
  }

  StudentModel copyWith({
    String? id,
    String? fullName,
    String? admissionNumber,
    String? rollNumber,
    String? className,
    String? section,
    String? classId,
    String? sectionId,
    String? gender,
    String? parentName,
    String? parentPhone,
    String? busRouteNumber,
    String? busStopName,
    String? photoUrl,
    String? healthInfo,
    double? attendancePercentage,
  }) {
    return StudentModel(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      admissionNumber: admissionNumber ?? this.admissionNumber,
      rollNumber: rollNumber ?? this.rollNumber,
      className: className ?? this.className,
      section: section ?? this.section,
      classId: classId ?? this.classId,
      sectionId: sectionId ?? this.sectionId,
      gender: gender ?? this.gender,
      parentName: parentName ?? this.parentName,
      parentPhone: parentPhone ?? this.parentPhone,
      busRouteNumber: busRouteNumber ?? this.busRouteNumber,
      busStopName: busStopName ?? this.busStopName,
      photoUrl: photoUrl ?? this.photoUrl,
      healthInfo: healthInfo ?? this.healthInfo,
      attendancePercentage: attendancePercentage ?? this.attendancePercentage,
    );
  }
}
