import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { teacherForAccess } from '@/lib/server/student-attendance';
import { requireSchoolAccess } from '@/lib/server/access';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedSchoolId = searchParams.get('schoolId') || undefined;
    const access = await requireSchoolAccess(requestedSchoolId, ['school_admin', 'teacher', 'staff', 'student', 'parent']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    
    let list = await serverDb.getTimetable(access.schoolId);
    if (access.role === 'teacher') { const teacher = await teacherForAccess(access); list = list.filter((entry: any) => entry.teacher_id === teacher?.id); }
    const [classes, sections, subjects, rooms] = await Promise.all([serverDb.getClasses(access.schoolId), serverDb.getSections(access.schoolId), serverDb.getSubjects(access.schoolId), serverDb.getRooms(access.schoolId)]);
    list = list.map((entry: any) => ({ ...entry, class_name: classes.find((c: any) => c.id === entry.class_id)?.name, section_name: sections.find((s: any) => s.id === entry.section_id)?.name, subject_name: subjects.find((s: any) => s.id === entry.subject_id)?.name, room: rooms.find((r: any) => r.id === entry.room_id)?.room_number || entry.room }));
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');
    const dayOfWeek = searchParams.get('dayOfWeek');
    if (classId) list = list.filter((item: any) => item.class_id === classId);
    if (sectionId) list = list.filter((item: any) => item.section_id === sectionId);
    if (dayOfWeek) list = list.filter((item: any) => String(item.day_of_week) === dayOfWeek);
    return NextResponse.json({ success: true, data: list });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error fetching timetable' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const access = await requireSchoolAccess(body.school_id, ['school_admin']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });

    body.school_id = access.schoolId;
    const created = await serverDb.createTimetableEntry(body);
    return NextResponse.json({ success: true, data: created });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error creating timetable entry' },
      { status: 500 }
    );
  }
}
