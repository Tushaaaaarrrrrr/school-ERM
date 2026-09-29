import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { requireSchoolAccess } from '@/lib/server/access';

export async function GET(request: Request) {
  try {
    const access = await requireSchoolAccess(null, ['school_admin']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    const { searchParams } = new URL(request.url);
    const parents = await serverDb.getParents(access.schoolId);
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase().trim();
    const data = parents.filter((parent: any) => {
      if (status && parent.status !== status) return false;
      if (!search) return true;
      return [
        parent.guardian_name,
        parent.father_name,
        parent.mother_name,
        parent.email,
        parent.primary_phone,
      ].some((value) => String(value || '').toLowerCase().includes(search));
    });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireSchoolAccess(null, ['school_admin']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    const body = await request.json();
    body.school_id = access.schoolId;
    const created = await serverDb.createParent(body);
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
  }
}
