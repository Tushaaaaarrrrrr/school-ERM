import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { requireSchoolAccess } from '@/lib/server/access';

function errorResponse(error: any) {
  return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
}

export async function GET(request: Request) {
  try {
    const access = await requireSchoolAccess(null, ['school_admin', 'accountant']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    const { searchParams } = new URL(request.url);
    const feeStructureId = searchParams.get('fee_structure_id') || undefined;
    const data = await serverDb.getFeeVersions(access.schoolId, feeStructureId);
    return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireSchoolAccess(null, ['school_admin', 'accountant']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    const body = await request.json();
    if (body.fee_structure_id && body.new_amount !== undefined) {
      const data = await serverDb.updateClassFeeStructure({ ...body, school_id: access.schoolId });
      return NextResponse.json({ success: true, data });
    }
    const data = await serverDb.createFeeVersion({ ...body, school_id: access.schoolId });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return errorResponse(error);
  }
}
