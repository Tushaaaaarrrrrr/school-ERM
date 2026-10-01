import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { requireSchoolAccess } from '@/lib/server/access';
import { getAssignedDriverTransport } from '@/lib/server/driver-access';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams.entries());
    const access = await requireSchoolAccess(null, ['school_admin', 'driver', 'staff', 'parent', 'student']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    if (access.role === 'driver') {
      const assigned = await getAssignedDriverTransport(access.schoolId, access.context);
      if (!assigned.vehicle) return NextResponse.json({ success: true, data: [] });
      filters.vehicle_id = assigned.vehicle.id;
    }
    
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
    const access = await requireSchoolAccess(body.school_id, ['school_admin', 'driver', 'staff']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    if (access.role === 'driver') {
      const assigned = await getAssignedDriverTransport(access.schoolId, access.context);
      if (!assigned.vehicle || body.vehicle_id !== assigned.vehicle.id || !assigned.routes.some((r: any) => r.id === body.route_id)) {
        return NextResponse.json({ success: false, error: 'Driver is not assigned to this route.' }, { status: 403 });
      }
    }
    
    // @ts-ignore
    const data = await serverDb.createTransportEvent({ ...body, school_id: access.schoolId });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('student_id');
    const eventType = url.searchParams.get('event_type') || undefined;
    const eventDate = url.searchParams.get('event_date') || new Date().toISOString().split('T')[0];
    const access = await requireSchoolAccess(null, ['school_admin', 'driver', 'staff']);
    if (!access.ok || !access.schoolId || !studentId) {
      return NextResponse.json({ success: false, error: 'Forbidden or missing parameters' }, { status: 400 });
    }
    if (access.role === 'driver') {
      const assigned = await getAssignedDriverTransport(access.schoolId, access.context);
      if (!assigned.vehicle) return NextResponse.json({ success: false, error: 'Driver is not assigned to an active route.' }, { status: 403 });
    }

    // @ts-ignore
    await serverDb.deleteTransportEvent(access.schoolId, studentId, eventDate, eventType);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
