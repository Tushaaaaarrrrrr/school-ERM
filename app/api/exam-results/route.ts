import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
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
    const data = await serverDb.createExamResult({ ...body, school_id: access.schoolId });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const access = await requireSchoolAccess(null, ['school_admin', 'teacher']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    const body = await request.json();
    if (!body.id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    delete body.school_id;
    const data = await serverDb.updateExamResult(body.id, body);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return errorResponse(error);
  }
}
