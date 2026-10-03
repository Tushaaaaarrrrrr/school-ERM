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
    
    let data = await serverDb.getTeacherLeaves(access.schoolId);
    const teacher = access.role === 'teacher' ? await teacherForAccess(access) : null;
    if (access.role === 'teacher') data = data.filter((r: any) => r.teacher_id === teacher?.id);
    if (filters.teacherId) data = data.filter((r: any) => r.teacher_id === filters.teacherId);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const access = await requireSchoolAccess(body.school_id, ['school_admin', 'teacher']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    
    const teacher = access.role === 'teacher' ? await teacherForAccess(access) : (await serverDb.getTeachers(access.schoolId)).find((t: any) => t.id === body.teacher_id);
    if (!teacher) return NextResponse.json({ success: false, error: 'Teacher not found' }, { status: 403 });
    if (!['full_day','partial_day'].includes(body.leave_type) || !body.reason?.trim() || body.end_date < body.start_date || body.return_date <= body.end_date) return NextResponse.json({ success: false, error: 'Invalid leave request' }, { status: 400 });
    const data = await serverDb.createTeacherLeave({ school_id: access.schoolId, teacher_id: teacher.id, leave_type: body.leave_type, start_date: body.start_date, end_date: body.end_date, return_date: body.return_date, reason: body.reason.trim(), status: 'pending' });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const access = await requireSchoolAccess(updates.school_id, ['school_admin']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    
    if (!(await serverDb.getTeacherLeaves(access.schoolId)).some((r: any) => r.id === id)) return NextResponse.json({ success: false, error: 'Leave not found' }, { status: 404 });
    const data = await serverDb.updateTeacherLeave(id, { status: updates.status, start_date: updates.start_date, end_date: updates.end_date, return_date: updates.return_date, admin_notes: updates.admin_notes, reviewed_at: new Date().toISOString(), reviewed_by: access.context.profile?.id });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
