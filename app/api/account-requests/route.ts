import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { requireSchoolAccess } from '@/lib/server/access';

function errorResponse(error: any) {
  return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
}

export async function GET(request: Request) {
  try {
    const access = await requireSchoolAccess();
    if (!access.ok) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });

    const { searchParams } = new URL(request.url);
    const requestedSchoolId = searchParams.get('school_id') || access.schoolId;

    if (access.role === 'school_admin' || access.role === 'super_admin') {
      const data = await serverDb.getAccountDeletionRequests(requestedSchoolId);
      return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const requestedBy = access.context?.user?.id;
    const data = await serverDb.getAccountDeletionRequests(requestedSchoolId, requestedBy);
    return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireSchoolAccess();
    if (!access.ok) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });

    const body = await request.json();

    // Safety and school deletion lifecycle actions
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

    // Default: User account deletion request
    const data = await serverDb.createAccountDeletionRequest({
      ...body,
      school_id: access.schoolId || body.school_id,
      requested_by: access.context?.user?.id || body.user_id,
    });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return errorResponse(error);
  }
}
