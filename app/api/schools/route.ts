import { NextResponse } from 'next/server';
import { stripSchoolSecrets } from '@/lib/server/sanitize';
import { serverDb } from '@/lib/server/db';
import { School } from '@/lib/types';
import { getAccessContext } from '@/lib/server/access';
import { checkEmailRegistry } from '@/lib/server/email-registry';

export async function GET() {
  try {
    const context = await getAccessContext();
    if (!context.authenticated) return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
    const schools = context.state === 'SUPER_ADMIN' ? (await serverDb.getSchools()).map(stripSchoolSecrets) : context.state === 'ACTIVE_SCHOOL_USER' && context.user?.school_id ? [stripSchoolSecrets(await serverDb.getSchoolById(context.user.school_id))].filter(Boolean) : [];
    return NextResponse.json({ success: true, data: schools });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch schools' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await getAccessContext();
    if (!context.authenticated || context.state !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();

    const adminEmail = body.admin_email || body.adminEmail;
    if (adminEmail) {
      const emailCheck = await checkEmailRegistry(adminEmail);
      if (!emailCheck.available) {
        return NextResponse.json(
          { success: false, error: emailCheck.error || 'Admin Google Email is already registered' },
          { status: 409 }
        );
      }
    }

    const newSchool = await serverDb.createSchool(body as School);
    return NextResponse.json({ success: true, data: stripSchoolSecrets(newSchool) });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to create school';
    const isConflict = errorMessage.toLowerCase().includes('already registered') || errorMessage.toLowerCase().includes('duplicate');
    const isValidation = errorMessage.toLowerCase().includes('must') || errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('require');
    const statusCode = isConflict ? 409 : isValidation ? 400 : 500;

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }
}

