import { NextResponse } from 'next/server';
import { getAccessContext, redirectForContext } from '@/lib/server/access';
import { signSessionCookie } from '@/lib/server/session-cookie';

export async function POST() {
  try {
    const context = await getAccessContext();
    if (!context.authenticated || !context.user) {
      return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
    }
    const session = await signSessionCookie(context.user);
    const response = NextResponse.json({
      success: true,
      session,
      user: context.user,
      state: context.state,
      redirectUrl: redirectForContext(context),
    });
    response.cookies.set('school_erp_session', session, {
      path: '/',
      maxAge: 604800,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
    });
    return response;
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Authentication verification failed' },
      { status: 500 }
    );
  }
}
