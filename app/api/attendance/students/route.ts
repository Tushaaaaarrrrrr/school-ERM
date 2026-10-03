import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { getAccessibleStudentIds, requireSchoolAccess } from '@/lib/server/access';
import { attendanceRoster } from '@/lib/server/student-attendance';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const access = await requireSchoolAccess(null, ['school_admin', 'teacher', 'student', 'parent']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    const roster = access.role === 'teacher' || access.role === 'school_admin' ? await attendanceRoster(access, false, url.searchParams.get('date') || undefined) : null;
    if (url.searchParams.get('roster') === 'true') {
      if (!roster) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      return NextResponse.json({ success: true, data: roster }, { headers: { 'Cache-Control': 'no-store' } });
    }
    let data = await serverDb.getStudentAttendances(access.schoolId);
    const allowed = roster ? new Set(roster.map((s: any) => s.id)) : await getAccessibleStudentIds(access, access.schoolId);
    data = data.filter((item: any) => (!allowed || allowed.has(item.student_id)) &&
      (!url.searchParams.get('studentId') || item.student_id === url.searchParams.get('studentId')) &&
      (!url.searchParams.get('classId') || item.class_id === url.searchParams.get('classId')) &&
      (!url.searchParams.get('sectionId') || item.section_id === url.searchParams.get('sectionId')) &&
      (!url.searchParams.get('date') || item.attendance_date === url.searchParams.get('date')));
    return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const access = await requireSchoolAccess(body.school_id, ['school_admin', 'teacher']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    const roster = await attendanceRoster(access, false, body.attendance_date);
    const student = roster.find((s: any) => s.id === body.student_id);
    if (!student) return NextResponse.json({ success: false, error: 'You are not assigned to take attendance for this student.' }, { status: 403 });
    const enrollment = student.current_enrollment!;
    if (body.class_id !== enrollment.class_id || body.section_id !== enrollment.section_id) return NextResponse.json({ success: false, error: 'Student is not enrolled in this class and section.' }, { status: 400 });
    if (!['present', 'absent', 'leave', 'partial'].includes(body.status) || !/^\d{4}-\d{2}-\d{2}$/.test(body.attendance_date || '') || !Number.isFinite(Date.parse(body.attendance_date))) return NextResponse.json({ success: false, error: 'Invalid attendance date or status.' }, { status: 400 });
    const profileId = access.context.profile?.id;
    const data = await serverDb.createStudentAttendance({
      school_id: access.schoolId, student_id: student.id, class_id: enrollment.class_id, section_id: enrollment.section_id,
      academic_year_id: enrollment.academic_year_id, attendance_date: body.attendance_date, status: body.status,
      remarks: body.remarks || null, marked_by: /^[0-9a-f-]{36}$/i.test(profileId || '') ? profileId : null,
      marked_by_name: access.context.user.name,
    });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
