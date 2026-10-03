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
}
