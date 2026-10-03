import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { requireSchoolAccess } from '@/lib/server/access';

function errorResponse(error: any) {
  return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const access = await requireSchoolAccess(body.school_id || body.schoolId || null, ['school_admin']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    if (body.action === 'reverse') {
      const data = await serverDb.reverseAcademicYearTransition(access.schoolId, id, body.actorName, body.actorId);
      return NextResponse.json({ success: true, data });
    }
    delete body.school_id;
    const data = await serverDb.updateTransitionBatch(id, body);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function DELETE() {
  return NextResponse.json({ success: false, error: 'Delete is not enabled for this endpoint.' }, { status: 405 });
}
