import 'package:flutter_test/flutter_test.dart';
import 'package:gi_campus/data/models/user_model.dart';

void main() {
  test('session preserves database identity through storage and cookies', () {
    final user = UserModel.fromJson({
      'id': 'auth-profile',
      'email': 'student@example.com',
      'name': 'Student',
      'role': 'student',
      'school_id': 'school',
      'student_id': 'database-student',
      'teacher_id': 'teacher',
      'staff_id': 'staff',
      'parent_id': 'parent',
      'login_id': 'registration',
    });
    final restored = UserModel.fromJsonString(user.toJsonString());
    expect(restored.studentId, 'database-student');
    expect(restored.toJson()['student_id'], 'database-student');
    expect(restored.teacherId, 'teacher');
    expect(restored.staffId, 'staff');
    expect(restored.parentId, 'parent');
    expect(restored.id, 'auth-profile');
  });
  test('request session excludes large photos and uses server role names', () {
    final user = UserModel.fromJson({
      'id': 'user',
      'email': 'admin@example.com',
      'name': 'Admin',
      'role': 'school_admin',
      'school_id': 'school',
      'student_id': 'student',
      'avatar_url': 'data:image/png;base64,${'A' * 50000}'
    });
    final session = user.toSessionJson();
    expect(session.containsKey('avatar_url'), isFalse);
    expect(session['role'], 'school_admin');
    expect(session['student_id'], 'student');
    expect(session.toString().length, lessThan(1000));
    expect(user.toJson()['avatar_url'], user.avatarUrl);
  });
}
