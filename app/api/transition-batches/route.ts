import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { requireSchoolAccess } from '@/lib/server/access';

function errorResponse(error: any) {
  return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedSchoolId = searchParams.get('school_id') || searchParams.get('schoolId') || null;
    const access = await requireSchoolAccess(requestedSchoolId, ['school_admin']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    const action = searchParams.get('action');
    if (action === 'suggestions') {
      const sourceYearId = searchParams.get('sourceYearId') || '';
      const targetYearId = searchParams.get('targetYearId') || '';
      const data = await serverDb.getTransitionSuggestions(access.schoolId, sourceYearId, targetYearId);
      return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (action === 'can-reverse') {
      const targetYearId = searchParams.get('targetYearId') || '';
      const data = await serverDb.canReverseTransition(access.schoolId, targetYearId);
      return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const data = await serverDb.getTransitionBatchs(access.schoolId);
    return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const access = await requireSchoolAccess(body.school_id || body.schoolId || null, ['school_admin']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    if (body.items) {
      const data = await serverDb.executeAcademicYearTransition(access.schoolId, body);
      return NextResponse.json({ success: true, data });
    }
    const data = await serverDb.createTransitionBatch({ ...body, school_id: access.schoolId });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return errorResponse(error);
  }
}
