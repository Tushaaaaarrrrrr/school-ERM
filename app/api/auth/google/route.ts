import { NextResponse } from 'next/server';
import { getAccessContext, redirectForContext } from '@/lib/server/access';

export async function POST() {
  try {
    const context = await getAccessContext();
    if (!context.authenticated) return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
    return NextResponse.json({ success: true, user: context.user, state: context.state, redirectUrl: redirectForContext(context) });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Authentication verification failed' },
      { status: 500 }
    );
  }
}
