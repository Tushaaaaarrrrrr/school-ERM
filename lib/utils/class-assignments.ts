import type { SchoolClass, Section, StudentEnrollment, Teacher, TeacherAssignment, Subject, SchoolRoom } from '@/lib/types';

export function resolveTeacherAssignments(schoolId: string, assignments: TeacherAssignment[], classes: SchoolClass[], sections: Section[], subjects: Subject[], rooms: SchoolRoom[] = []): TeacherAssignment[] {
  // ponytail: linear lookups suit school-sized lists; index by ID if profiling shows a bottleneck.
  const result = assignments.map((a) => {
    const cls = classes.find((c) => c.id === a.class_id);
    const section = sections.find((s) => s.id === a.section_id && s.class_id === a.class_id);
    return { ...a, class_name: cls?.name, section_name: section?.name,
      subject_name: subjects.find((s) => s.id === a.subject_id)?.name,
      room_number: rooms.find((r) => r.id === section?.room_id)?.room_number || section?.room_number || rooms.find((r) => r.id === cls?.room_id)?.room_number || cls?.default_room_number };
  });
  for (const record of [...classes, ...sections]) {
    if (!record.class_teacher_id) continue;
    const section = 'class_id' in record ? record : undefined;
    const cls = section ? classes.find((c) => c.id === section.class_id) : record as SchoolClass;
    if (!cls) continue;
    result.push({
      id: `asg-ct-${section ? 'sec' : 'cls'}-${record.id}`,
      school_id: schoolId, academic_year_id: '', teacher_id: record.class_teacher_id,
      class_id: cls.id, class_name: cls.name, section_id: section?.id || '',
      section_name: section?.name, subject_id: '', subject_name: 'Class Teacher',
      room_number: rooms.find((r) => r.id === section?.room_id)?.room_number || section?.room_number || rooms.find((r) => r.id === cls.room_id)?.room_number || cls.default_room_number, created_at: record.created_at,
    });
  }
  return result;
}

export function resolveEnrollmentClass(enrollment: StudentEnrollment, classes: SchoolClass[], sections: Section[], teachers: Pick<Teacher, 'id' | 'first_name' | 'last_name'>[], rooms: SchoolRoom[] = []): StudentEnrollment {
  const nameMatches = classes.filter((c) => enrollment.class_name?.trim() && c.name.trim().toLowerCase() === enrollment.class_name.trim().toLowerCase());
  const cls = classes.find((c) => c.id === enrollment.class_id) || (nameMatches.length === 1 ? nameMatches[0] : undefined);
  if (!cls) return { ...enrollment, class_teacher_name: undefined, room_number: undefined };
  const classSections = sections.filter((s) => s.class_id === cls.id);
  const sectionMatches = classSections.filter((s) => enrollment.section_name?.trim() && s.name.trim().toLowerCase() === enrollment.section_name.trim().toLowerCase());
  const section = classSections.find((s) => s.id === enrollment.section_id) || (sectionMatches.length === 1 ? sectionMatches[0] : undefined);
  const owner = section?.class_teacher_id ? section : cls;
  const teacher = teachers.find((t) => t.id === owner.class_teacher_id);
  return {
    ...enrollment, class_id: cls.id, class_name: cls.name,
    section_id: section?.id || enrollment.section_id, section_name: section?.name || enrollment.section_name,
    class_teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}`.trim() : owner.class_teacher_name || undefined,
    room_number: rooms.find((r) => r.id === section?.room_id)?.room_number || section?.room_number || rooms.find((r) => r.id === cls.room_id)?.room_number || cls.default_room_number || undefined,
  };
}
