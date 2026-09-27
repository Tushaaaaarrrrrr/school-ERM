import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { requireSchoolAccess } from '@/lib/server/access';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requireSchoolAccess(id, ['school_admin', 'super_admin']);
    if (!access.ok) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    }

    const school = await serverDb.getSchoolById(id);
    if (!school) {
      return NextResponse.json({ success: false, error: 'School not found' }, { status: 404 });
    }

    const teachers = await serverDb.getTeachers(id);

    const archive = {
      metadata: {
        export_version: '2.0-Enterprise',
        exported_at: new Date().toISOString(),
        school_id: school.id,
        school_name: school.name,
        school_code: school.code,
        records_count: {
          teachers: teachers.length,
        },
      },
      school,
      teachers,
    };

    return NextResponse.json({ success: true, data: archive });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error exporting school data' },
      { status: 500 }
    );
  }
}
