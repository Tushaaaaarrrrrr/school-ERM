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
    const access = await requireSchoolAccess(null, ['school_admin', 'super_admin']);
    if (!access.ok) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });

    const { id } = await params;
    const body = await request.json();

    const data = await serverDb.reviewAccountDeletionRequest(
      id,
      body.decision,
      body.review_reason,
      body.reviewed_by || access.context?.user?.id,
      body.reviewed_by_name || access.context?.user?.name,
      access.schoolId
    );
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return errorResponse(error);
  }
}
