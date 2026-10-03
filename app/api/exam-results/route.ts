import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { teacherForAccess } from '@/lib/server/student-attendance';
import { getAccessibleStudentIds, requireSchoolAccess } from '@/lib/server/access';

function errorResponse(error: any) {
  return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const access = await requireSchoolAccess(null, ['school_admin', 'teacher', 'student', 'parent']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    let data = await serverDb.getExamResults(access.schoolId);
    if (access.role === 'teacher') {
      const teacher = await teacherForAccess(access);
      const exams = (await serverDb.getExams(access.schoolId)).filter((e: any) => e.teacher_id === teacher?.id);
      data = data.filter((r: any) => exams.some((e: any) => e.id === r.exam_id));
    }
    const studentId = searchParams.get('studentId');
    const allowedStudentIds = await getAccessibleStudentIds(access, access.schoolId);
    if (allowedStudentIds) {
      data = data.filter((item: any) => allowedStudentIds.has(item.student_id));
    } else if (studentId) {
      data = data.filter((item: any) => item.student_id === studentId);
    }
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
    const exam = (await serverDb.getExams(access.schoolId)).find((e: any) => e.id === body.exam_id);
    const teacher = access.role === 'teacher' ? await teacherForAccess(access) : null;
    if (!exam || (access.role === 'teacher' && exam.teacher_id !== teacher?.id)) return NextResponse.json({ success: false, error: 'Forbidden exam' }, { status: 403 });
    const student = (await serverDb.getStudents(access.schoolId)).find((st: any) => st.id === body.student_id && st.current_enrollment?.class_id === exam.class_id && st.current_enrollment?.section_id === exam.section_id);
    if (!student || typeof body.absent !== 'boolean' || (!body.absent && body.marks_obtained != null && (!Number.isFinite(body.marks_obtained) || body.marks_obtained < 0 || body.marks_obtained > exam.max_marks))) return NextResponse.json({ success: false, error: 'Invalid student or marks' }, { status: 400 });
    const data = await serverDb.createExamResult({ school_id: access.schoolId, exam_id: exam.id, student_id: student.id, absent: body.absent, marks_obtained: body.absent ? 0 : body.marks_obtained ?? null, remarks: body.remarks || null });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function PUT() { return NextResponse.json({ success: false, error: 'Use the validated marks submission endpoint.' }, { status: 405 }); }
