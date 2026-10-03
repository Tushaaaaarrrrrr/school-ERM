import { serverDb } from './db';
import { canMarkStudent } from '@/lib/utils/attendance-scope';

export async function attendanceRoster(access: any, includeSubjects = false, date = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })) {
  const schoolId = access.schoolId;
  const [students, classes, sections, teachers] = await Promise.all([
    serverDb.getStudents(schoolId), serverDb.getClasses(schoolId), serverDb.getSections(schoolId), serverDb.getTeachers(schoolId),
  ]);
  const user = access.context.user;
  const teacher = teachers.find((t: any) => t.status === 'active' && (t.id === user.teacher_id || t.id === String(user.id).replace(/^usr-/, '') || (user.email && t.email?.toLowerCase() === user.email.toLowerCase())));
  const coverage = teacher ? (await serverDb.getTemporaryAssignments(schoolId, { replacementEmployeeId: teacher.id, status: 'active' })).filter((a) => a.assignment_type === 'class_attendance_coverage' && a.start_date <= date && date <= a.end_date).map((a) => a.absent_employee_id) : [];
  const assignments = includeSubjects && teacher ? await serverDb.getTeacherAssignments(schoolId, teacher.id) : [];
  return students.filter((student: any) => student.status === 'active' && student.current_enrollment &&
    (access.role === 'school_admin' || canMarkStudent(teacher?.id || '', student.current_enrollment, classes, sections, coverage) || assignments.some((a: any) => a.class_id === student.current_enrollment?.class_id && (!a.section_id || a.section_id === student.current_enrollment?.section_id))));
}

export async function teacherForAccess(access: any) {
  const user = access.context.user;
  return (await serverDb.getTeachers(access.schoolId)).find((t: any) => t.status === 'active' &&
    (t.id === user.teacher_id || t.id === String(user.id).replace(/^usr-/, '') || (user.email && t.email?.toLowerCase() === user.email.toLowerCase())));
}
