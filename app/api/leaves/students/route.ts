import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { attendanceRoster } from '@/lib/server/student-attendance';
import { getAccessibleStudentIds, requireSchoolAccess } from '@/lib/server/access';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams.entries());
    const access = await requireSchoolAccess(null, ['school_admin', 'teacher', 'parent', 'student']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    
    // @ts-ignore
    let data = await serverDb.getStudentLeaves(access.schoolId);
    const allowedStudentIds = access.role === 'teacher' ? new Set((await attendanceRoster(access)).map((st: any) => st.id)) : await getAccessibleStudentIds(access, access.schoolId);
    if (allowedStudentIds) data = data.filter((item: any) => allowedStudentIds.has(item.student_id));
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const access = await requireSchoolAccess(body.school_id, ['school_admin', 'teacher', 'parent', 'student']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    
    const student = (await serverDb.getStudents(access.schoolId)).find((st: any) => st.id === body.student_id);
    const allowed = access.role === 'teacher' ? new Set((await attendanceRoster(access)).map((st: any) => st.id)) : await getAccessibleStudentIds(access, access.schoolId);
    if (!student || (allowed && !allowed.has(student.id))) return NextResponse.json({ success: false, error: 'Forbidden student' }, { status: 403 });
    if (!['full_day', 'partial_day'].includes(body.leave_type) || !body.reason?.trim() || body.end_date < body.start_date) return NextResponse.json({ success: false, error: 'Invalid leave request' }, { status: 400 });
    const data = await serverDb.createStudentLeave({ school_id: access.schoolId, student_id: student.id, academic_year_id: student.current_enrollment?.academic_year_id, leave_type: body.leave_type, start_date: body.start_date, end_date: body.end_date, partial_start_time: body.partial_start_time || null, partial_end_time: body.partial_end_time || null, reason: body.reason, status: ['teacher','school_admin'].includes(access.role) ? 'approved' : 'pending' });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const access = await requireSchoolAccess(updates.school_id, ['school_admin', 'teacher']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    
    const existing = (await serverDb.getStudentLeaves(access.schoolId)).find((r: any) => r.id === id);
    if (!existing || (access.role === 'teacher' && !(await attendanceRoster(access)).some((st: any) => st.id === existing.student_id))) return NextResponse.json({ success: false, error: 'Forbidden leave' }, { status: 403 });
    if (!['approved', 'rejected'].includes(updates.status)) return NextResponse.json({ success: false, error: 'Invalid leave decision' }, { status: 400 });
    const data = await serverDb.updateStudentLeave(id, { status: updates.status, approved_at: updates.status === 'approved' ? new Date().toISOString() : null, reason: updates.status === 'rejected' && updates.rejection_reason ? `${existing.reason}\nRejection: ${updates.rejection_reason}` : existing.reason });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
