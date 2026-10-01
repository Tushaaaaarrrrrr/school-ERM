import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { getAccessContext } from '@/lib/server/access';
import { UserPersona } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const context = await getAccessContext();
    const user = context.authenticated ? (context.user as UserPersona | undefined) : undefined;
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
    }

    const { pin } = await request.json();
    if (typeof pin !== 'string') {
      return NextResponse.json({ success: false, error: 'PIN required' }, { status: 400 });
    }

    const result = await serverDb.verifyPin(user, pin);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'PIN verification error' },
      { status: 500 }
    );
  }
}
