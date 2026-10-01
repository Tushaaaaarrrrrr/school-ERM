import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { getAccessContext } from '@/lib/server/access';
import { UserPersona } from '@/lib/types';

export async function POST() {
  try {
    const context = await getAccessContext();
    const user = context.authenticated ? (context.user as UserPersona | undefined) : undefined;
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
    }

    const { pin: _pin, holderId: _holderId, ...status } = await serverDb.getUserPinStatus(user);
    return NextResponse.json({ success: true, data: status });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error fetching PIN status' },
      { status: 500 }
    );
  }
}
