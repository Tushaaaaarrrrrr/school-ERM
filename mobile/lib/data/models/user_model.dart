import 'dart:convert';

enum UserRole {
  superAdmin,
  schoolAdmin,
  teacher,
  student,
  parent,
  driver,
  accountant,
  staff,
}

class UserModel {
  final String id;
  final String email;
  final String name;
  final UserRole role;
  final String schoolId;
  final String schoolName;
  final String schoolCode;
  final String? avatarUrl;
  final String? loginId;

  const UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    required this.schoolId,
    required this.schoolName,
    required this.schoolCode,
    this.avatarUrl,
    this.loginId,
  });

  String get roleDisplayName {
    switch (role) {
      case UserRole.superAdmin: return 'Super Admin';
      case UserRole.schoolAdmin: return 'School Admin';
      case UserRole.teacher: return 'Teacher';
      case UserRole.student: return 'Student';
      case UserRole.parent: return 'Parent';
      case UserRole.driver: return 'Bus Driver';
      case UserRole.accountant: return 'Accountant';
      case UserRole.staff: return 'Staff';
    }
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final roleName = (json['role'] as String? ?? 'student').replaceAll('_', '').toLowerCase();
    return UserModel(
      id: json['id'] as String,
      email: json['email'] as String? ?? '',
      name: json['name'] as String? ?? '',
      role: UserRole.values.firstWhere(
        (r) => r.name.toLowerCase() == roleName,
        orElse: () => UserRole.student,
      ),
      schoolId: json['school_id'] as String? ?? '',
      schoolName: json['school_name'] as String? ?? '',
      schoolCode: json['school_code'] as String? ?? '',
      avatarUrl: json['avatar_url'] as String?,
      loginId: json['login_id'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'name': name,
    'role': role.name,
    'school_id': schoolId,
    'school_name': schoolName,
    'school_code': schoolCode,
    'avatar_url': avatarUrl,
    'login_id': loginId,
  };

  String toJsonString() => jsonEncode(toJson());

  factory UserModel.fromJsonString(String value) {
    return UserModel.fromJson(jsonDecode(value) as Map<String, dynamic>);
  }
}
