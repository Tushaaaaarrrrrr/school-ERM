import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { UserPersona } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { user, pin } = await request.json();
    if (!user || typeof pin !== 'string') {
      return NextResponse.json({ success: false, error: 'User and PIN required' }, { status: 400 });
    }

    const result = await serverDb.verifyPin(user as UserPersona, pin);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'PIN verification error' },
      { status: 500 }
    );
  }
}
