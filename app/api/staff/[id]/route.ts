import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { Staff } from '@/lib/types';
import { requireSchoolAccess } from '@/lib/server/access';
import { checkEmailRegistry } from '@/lib/server/email-registry';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const access = await requireSchoolAccess(undefined, ['school_admin']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    const existing = (await serverDb.getStaff(access.schoolId)).find((item) => item.id === id);
    if (!existing) return NextResponse.json({ success: false, error: 'Staff member not found' }, { status: 404 });
    delete body.school_id;
    if (body.email && body.email.trim().toLowerCase() !== existing.email?.trim().toLowerCase()) {
      const emailCheck = await checkEmailRegistry(body.email, {
        excludeUserId: id,
        excludeEmail: existing.email,
        targetSchoolId: access.schoolId,
        targetRole: 'staff',
      });
      if (!emailCheck.valid || !emailCheck.available) {
        return NextResponse.json({ success: false, error: emailCheck.error || 'Staff email is not available.' }, { status: 409 });
      }
    }
    const updated = await serverDb.updateStaff(id, body as Partial<Staff>);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error updating staff' },
      { status: 500 }
    );
  }
}
