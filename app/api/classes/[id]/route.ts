import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { requireSchoolAccess } from '@/lib/server/access';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const access = await requireSchoolAccess(null, ['school_admin']);
    if (!access.ok) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });

    const updated = await serverDb.updateClass(id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error updating class' },
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

    await serverDb.deleteClass(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error deleting class' },
      { status: 500 }
    );
  }
}
