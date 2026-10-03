import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { requireSchoolAccess } from '@/lib/server/access';

function errorResponse(error: any) {
  return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
}

const READERS = ['school_admin', 'teacher', 'staff', 'accountant', 'driver', 'parent', 'student'];

// Same id normalisation as auth/password: ids match with or without a `usr-` prefix.
function callerIds(access: any): Set<string> {
  const u = access.context?.user || {};
  return new Set(
    [u.id, u.email, u.login_id, u.teacher_id, u.staff_id, u.student_id, u.parent_id]
      .map((v) => String(v || '').trim().toLowerCase())
      .filter(Boolean)
      .flatMap((id) => (id.startsWith('usr-') ? [id, id.slice(4)] : [id, `usr-${id}`]))
  );
}

const isMine = (n: any, ids: Set<string>) => ids.has(String(n?.recipient_user_id || '').trim().toLowerCase());

export async function GET() {
  try {
    const access = await requireSchoolAccess(null, READERS);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    const all = await serverDb.getNotifications(access.schoolId);
    const ids = callerIds(access);
    const data = access.role === 'school_admin' ? all : all.filter((n: any) => isMine(n, ids));
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    // No client caller creates notifications today; admin-only until one needs more.
    const access = await requireSchoolAccess(null, ['school_admin']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    const body = await request.json();
    const data = await serverDb.createNotification({ ...body, school_id: access.schoolId });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const access = await requireSchoolAccess(null, READERS);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    const body = await request.json();
    if (!body.id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    delete body.school_id;
    let updates = body;
    if (access.role !== 'school_admin') {
      const existing = (await serverDb.getNotifications(access.schoolId)).find((n: any) => n.id === body.id);
      if (!existing || !isMine(existing, callerIds(access))) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      updates = { id: body.id, read_at: body.read_at ?? new Date().toISOString() };
    }
    const data = await serverDb.updateNotification(body.id, access.schoolId, updates);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return errorResponse(error);
  }
}
