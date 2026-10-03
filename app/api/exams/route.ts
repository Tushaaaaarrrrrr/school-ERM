import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { teacherForAccess } from '@/lib/server/student-attendance';
import { requireSchoolAccess } from '@/lib/server/access';

function errorResponse(error: any) {
  return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
}

export async function GET() {
  try {
    const access = await requireSchoolAccess(null, ['school_admin', 'teacher']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    let data = await serverDb.getExams(access.schoolId);
    if (access.role === 'teacher') { const teacher = await teacherForAccess(access); data = data.filter((e: any) => e.teacher_id === teacher?.id); }
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireSchoolAccess(null, ['school_admin', 'teacher']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    const body = await request.json();
    const teacher = access.role === 'teacher' ? await teacherForAccess(access) : null;
    if (access.role === 'teacher' && (!teacher || !(await serverDb.getTeacherAssignments(access.schoolId, teacher.id)).some((a: any) => a.class_id === body.class_id && a.section_id === body.section_id && a.subject_id === body.subject_id))) return NextResponse.json({ success: false, error: 'Subject is not assigned to you' }, { status: 403 });
    if (!body.name?.trim() || !Number.isFinite(body.max_marks) || body.max_marks <= 0) return NextResponse.json({ success: false, error: 'Invalid exam name or maximum marks' }, { status: 400 });
    const data = await serverDb.createExam({ school_id: access.schoolId, academic_year_id: body.academic_year_id, class_id: body.class_id, section_id: body.section_id, subject_id: body.subject_id, teacher_id: teacher?.id || body.teacher_id, name: body.name.trim(), max_marks: body.max_marks, exam_date: body.exam_date, status: 'draft' });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return errorResponse(error);
  }
}
