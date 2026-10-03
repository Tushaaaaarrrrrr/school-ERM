import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { teacherForAccess } from '@/lib/server/student-attendance';
import { requireSchoolAccess } from '@/lib/server/access';

function errorResponse(error: any) {
  return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireSchoolAccess(null, ['school_admin', 'teacher']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    const { id } = await params;
    const body = await request.json();
    const existing = (await serverDb.getExams(access.schoolId)).find((e: any) => e.id === id);
    const teacher = access.role === 'teacher' ? await teacherForAccess(access) : null;
    if (!existing || (access.role === 'teacher' && existing.teacher_id !== teacher?.id)) return NextResponse.json({ success: false, error: 'Forbidden exam' }, { status: 403 });
    if (!['draft', 'published'].includes(body.status)) return NextResponse.json({ success: false, error: 'Invalid exam status' }, { status: 400 });
    const data = await serverDb.updateExam(id, { status: body.status, published_at: body.status === 'published' ? new Date().toISOString() : null });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function DELETE() {
  return NextResponse.json({ success: false, error: 'Delete is not enabled for this endpoint.' }, { status: 405 });
}
