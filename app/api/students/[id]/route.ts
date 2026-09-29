import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { requireSchoolAccess } from '@/lib/server/access';
import { checkEmailRegistry } from '@/lib/server/email-registry';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const access = await requireSchoolAccess(null, ['school_admin']);
    if (!access.ok) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    if (access.schoolId && body.guardian?.email) {
      const existing = (await serverDb.getStudents(access.schoolId)).find((item) => item.id === id);
      const emailCheck = await checkEmailRegistry(body.guardian.email, {
        excludeUserId: id,
        excludeEmail: existing?.guardian?.email,
        targetSchoolId: access.schoolId,
        targetRole: 'parent',
      });
      if (!emailCheck.valid || !emailCheck.available) {
        return NextResponse.json({ success: false, error: emailCheck.error || 'Parent email is not available.' }, { status: 409 });
      }
    }

    const updated = await serverDb.updateStudent(id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error updating student' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requireSchoolAccess(null, ['school_admin']);
    if (!access.ok) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });

    await serverDb.deleteStudent(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error deleting student' },
      { status: 500 }
    );
  }
}
