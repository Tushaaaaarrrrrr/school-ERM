import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { requireSchoolAccess } from '@/lib/server/access';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const requestedSchoolId = searchParams.get('schoolId') || undefined;
    const access = await requireSchoolAccess(requestedSchoolId, ['school_admin', 'accountant']);
    if (!access.ok || !access.schoolId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    }

    await serverDb.deleteSalaryAdjustment(id, access.schoolId);
    return NextResponse.json({ success: true, message: 'Salary adjustment deleted successfully' });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error deleting salary adjustment' },
      { status: 500 }
    );
  }
}
