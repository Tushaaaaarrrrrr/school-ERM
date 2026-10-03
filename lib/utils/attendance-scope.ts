// A section's teacher overrides the whole-class teacher.
export function canMarkStudent(teacherId: string, enrollment: any, classes: any[], sections: any[], coveredTeacherIds: string[] = []): boolean {
  if (!teacherId || !enrollment) return false;
  const cls = classes.find((c) => c.id === enrollment.class_id);
  const section = sections.find((s) => s.id === enrollment.section_id && s.class_id === cls?.id);
  return !!cls && [teacherId, ...coveredTeacherIds].includes(section?.class_teacher_id || cls.class_teacher_id);
}
