import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJsonBody } from '@/lib/server/validation';
import { clientIp, consume, tooManyRequests } from '@/lib/server/rate-limit';
import { serverDb } from '@/lib/server/db';
import { getAccessContext } from '@/lib/server/access';
import { UserPersona } from '@/lib/types';
import { signSessionCookie } from '@/lib/server/session-cookie';

const pinInput = z.object({
  pin: z.string().max(10),
  user: z.record(z.any()).optional(),
  identifier: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const retryAfter = consume(`pin-auth:${clientIp(request)}`, 30, 5 * 60_000);
    if (retryAfter > 0) return tooManyRequests(retryAfter);

    const parsed = await parseJsonBody(request, pinInput);
    if (!parsed.ok) return parsed.response;
    const { pin, user: bodyUser } = parsed.data;

    const context = await getAccessContext();
    const user = (context.authenticated ? context.user : bodyUser) as UserPersona | undefined;

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
    }

    const result = await serverDb.verifyPin(user, pin);
    if (result.success) {
      const session = await signSessionCookie(user);
      const response = NextResponse.json({ ...result, success: true, session, user });
      response.cookies.set('school_erp_session', session, {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false,
      });
      return response;
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'PIN verification error' },
      { status: 500 }
    );
  }
}
