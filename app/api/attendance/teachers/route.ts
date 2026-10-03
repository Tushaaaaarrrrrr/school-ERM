import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { teacherForAccess } from '@/lib/server/student-attendance';
import { requireSchoolAccess } from '@/lib/server/access';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams.entries());
    const access = await requireSchoolAccess(null, ['school_admin', 'teacher']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    
    let data = await serverDb.getTeacherAttendances(access.schoolId);
    const teacher = access.role === 'teacher' ? await teacherForAccess(access) : null;
    if (access.role === 'teacher') data = data.filter((r: any) => r.teacher_id === teacher?.id);
    if (filters.teacherId) data = data.filter((r: any) => r.teacher_id === filters.teacherId);
    if (filters.date) data = data.filter((r: any) => r.attendance_date === filters.date);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const access = await requireSchoolAccess(body.school_id, ['school_admin']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    
    if (!(await serverDb.getTeachers(access.schoolId)).some((t: any) => t.id === body.teacher_id) || !['present','absent','leave','partial'].includes(body.status)) return NextResponse.json({ success: false, error: 'Invalid teacher or status' }, { status: 400 });
    const data = await serverDb.createTeacherAttendance({ school_id: access.schoolId, teacher_id: body.teacher_id, attendance_date: body.attendance_date, status: body.status, remarks: body.remarks || null, marked_by: access.context.profile?.id });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
