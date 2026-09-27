import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { Staff } from '@/lib/types';
import { requireSchoolAccess } from '@/lib/server/access';
import { checkEmailRegistry } from '@/lib/server/email-registry';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedSchoolId = searchParams.get('schoolId') || undefined;
    const access = await requireSchoolAccess(requestedSchoolId, ['school_admin', 'staff', 'accountant']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    const schoolId = access.schoolId;
    const list = await serverDb.getStaff(schoolId);
    return NextResponse.json({ success: true, data: list });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error fetching staff' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const access = await requireSchoolAccess(body.school_id, ['school_admin']);
    if (!access.ok) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status });

    if (body.email) {
      const emailCheck = await checkEmailRegistry(body.email, {
        targetSchoolId: access.schoolId,
        targetRole: body.staff_type || 'staff',
      });
      if (!emailCheck.valid || !emailCheck.available) {
        return NextResponse.json(
          { success: false, error: emailCheck.error || 'Invalid or duplicate email address.' },
          { status: 400 }
        );
      }
    }

    body.school_id = access.schoolId;
    const created = await serverDb.createStaff(body as Staff);
    return NextResponse.json({ success: true, data: created });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error creating staff' },
      { status: 500 }
    );
  }
}
