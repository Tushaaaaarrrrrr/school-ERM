import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { getAccessContext } from '@/lib/server/access';

const forbidden = () => NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

export async function POST(request: Request) {
  try {
    const context = await getAccessContext();
    if (!context.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
    }

    const { targetType, targetId, newPin } = await request.json();
    if (!targetType || !targetId) {
      return NextResponse.json({ success: false, error: 'Target parameters required' }, { status: 400 });
    }
    if (newPin !== undefined && newPin !== null && newPin !== '' && !/^\d{5}$/.test(String(newPin))) {
      return NextResponse.json({ success: false, error: 'PIN must be exactly 5 digits.' }, { status: 400 });
    }

    const isSuperAdmin = context.state === 'SUPER_ADMIN';
    const schoolId = context.state === 'ACTIVE_SCHOOL_USER' && context.user?.role === 'school_admin'
      ? context.user.school_id
      : undefined;

    if (targetType === 'school_admin') {
      if (!isSuperAdmin) return forbidden();
    } else if (targetType === 'teacher' || targetType === 'staff') {
      if (!isSuperAdmin) {
        if (!schoolId) return forbidden();
        const people = targetType === 'teacher' ? await serverDb.getTeachers(schoolId) : await serverDb.getStaff(schoolId);
        if (!people.some((p: { id: string }) => p.id === targetId)) return forbidden();
      }
    } else {
      return NextResponse.json({ success: false, error: 'Unsupported target type' }, { status: 400 });
    }

    await serverDb.unlockAndResetPin({
      targetType,
      targetId,
      newPin,
      unlockedByName: context.user?.name || (isSuperAdmin ? 'Super Admin' : 'School Admin'),
    });
    return NextResponse.json({ success: true, message: 'PIN updated and account unlocked successfully.' });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'PIN reset error' },
      { status: 500 }
    );
  }
}
