import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { requireSchoolAccess } from '@/lib/server/access';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams.entries());
    const access = await requireSchoolAccess(null, ['school_admin', 'driver', 'staff', 'parent']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    
    // @ts-ignore
    const data = await serverDb.getTransportEvents(access.schoolId, filters);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const access = await requireSchoolAccess(body.school_id, ['school_admin', 'driver']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    
    // @ts-ignore
    const data = await serverDb.createTransportEvent({ ...body, school_id: access.schoolId });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
