import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { UserPersona } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { user } = await request.json();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User is required' }, { status: 400 });
    }

    const status = await serverDb.getUserPinStatus(user as UserPersona);
    return NextResponse.json({ success: true, data: status });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error fetching PIN status' },
      { status: 500 }
    );
  }
}
