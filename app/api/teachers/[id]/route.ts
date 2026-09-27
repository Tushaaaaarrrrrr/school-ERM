import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { Teacher } from '@/lib/types';
import { requireSchoolAccess } from '@/lib/server/access';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const access = await requireSchoolAccess(undefined, ['school_admin']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    const existing = (await serverDb.getTeachers(access.schoolId)).find((item) => item.id === id);
    if (!existing) return NextResponse.json({ success: false, error: 'Teacher not found' }, { status: 404 });
    delete body.school_id;
    const updated = await serverDb.updateTeacher(id, body as Partial<Teacher>);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error updating teacher' },
      { status: 500 }
    );
  }
}
