import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function POST(request: Request) {
  try {
    const { targetType, targetId, newPin, unlockedByName } = await request.json();
    if (!targetType || !targetId) {
      return NextResponse.json({ success: false, error: 'Target parameters required' }, { status: 400 });
    }

    await serverDb.unlockAndResetPin({
      targetType,
      targetId,
      newPin,
      unlockedByName,
    });
    return NextResponse.json({ success: true, message: 'PIN updated and account unlocked successfully.' });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'PIN reset error' },
      { status: 500 }
    );
  }
}
