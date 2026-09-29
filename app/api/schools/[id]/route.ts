import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { School } from '@/lib/types';
import { requireSchoolAccess, getAccessContext } from '@/lib/server/access';
import { checkEmailRegistry } from '@/lib/server/email-registry';

const SCHOOL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

function validSchoolHours(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const hours = value as Record<string, unknown>;
  return SCHOOL_DAYS.every((day) => {
    const entry = hours[day] as Record<string, unknown> | undefined;
    if (!entry || typeof entry.is_open !== 'boolean') return false;
    if (!entry.is_open) return true;
    return typeof entry.start_time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(entry.start_time) &&
      typeof entry.end_time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(entry.end_time) &&
      entry.end_time > entry.start_time;
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requireSchoolAccess(id);
    if (!access.ok) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status });
    const school = await serverDb.getSchoolById(id);
    if (!school) {
      return NextResponse.json({ success: false, error: 'School not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: school });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error retrieving school' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await getAccessContext();
    const isSuperAdmin = context.authenticated && context.state === 'SUPER_ADMIN';
    const isOwnSchoolAdmin = context.authenticated && context.state === 'ACTIVE_SCHOOL_USER' &&
      context.user?.role === 'school_admin' && context.user.school_id === id;
    if (context.authenticated && !isSuperAdmin && !isOwnSchoolAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    if (body.school_hours !== undefined && !validSchoolHours(body.school_hours)) {
      return NextResponse.json({ success: false, error: 'Invalid weekly school timing' }, { status: 400 });
    }
    if (isSuperAdmin && body.admin_email) {
      const existing = await serverDb.getSchoolById(id);
      const emailCheck = await checkEmailRegistry(body.admin_email, {
        excludeEmail: existing?.admin_email,
        excludeSchoolId: id,
        targetSchoolId: id,
        targetRole: 'school_admin',
      });
      if (!emailCheck.valid || !emailCheck.available) {
        return NextResponse.json({ success: false, error: emailCheck.error || 'School admin email is not available.' }, { status: 409 });
      }
    }
    const allowed = isSuperAdmin ? body : {
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      logo_url: body.logo_url,
      profile_photo_max_mb: body.profile_photo_max_mb,
      timezone: body.timezone,
      school_contact_phone: body.school_contact_phone,
      school_contact_alternate: body.school_contact_alternate,
      school_hours: body.school_hours,
    };
    const updated = await serverDb.updateSchool(id, allowed as Partial<School>);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Error updating school';
    const isConflict = errorMessage.toLowerCase().includes('already registered') || errorMessage.toLowerCase().includes('duplicate');
    const isValidation = errorMessage.toLowerCase().includes('must') || errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('require');
    const statusCode = isConflict ? 409 : isValidation ? 400 : 500;

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }
}
