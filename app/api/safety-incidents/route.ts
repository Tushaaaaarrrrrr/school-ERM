import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { requireSchoolAccess } from '@/lib/server/access';

function errorResponse(error: any) {
  return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
}

export async function POST(request: Request) {
  try {
    const access = await requireSchoolAccess();
    if (!access.ok) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });

    const body = await request.json();

    if (body.action === 'suspend_school') {
      const data = await serverDb.suspendSchool(body.schoolId, body.typedSchoolCode, body.reason, body.superAdminName);
      return NextResponse.json({ success: true, data });
    }
    if (body.action === 'restore_school') {
      const data = await serverDb.restoreSchool(body.schoolId, body.superAdminName);
      return NextResponse.json({ success: true, data });
    }
    if (body.action === 'schedule_school_deletion') {
      const data = await serverDb.scheduleSchoolDeletion(
        body.schoolId,
        body.typedDeleteText,
        body.gracePeriodDays,
        body.reason,
        body.superAdminId,
        body.superAdminName
      );
      return NextResponse.json({ success: true, data });
    }
    if (body.action === 'cancel_school_deletion') {
      await serverDb.cancelSchoolDeletion(body.schoolId, body.superAdminName, body.cancellationReason);
      return NextResponse.json({ success: true, data: { cancelled: true } });
    }

    return NextResponse.json({ success: true, data: { message: 'Incident processed' } });
  } catch (error: any) {
    return errorResponse(error);
  }
}
