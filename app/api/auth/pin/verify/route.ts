import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJsonBody } from '@/lib/server/validation';
import { clientIp, consume, tooManyRequests } from '@/lib/server/rate-limit';
import { serverDb } from '@/lib/server/db';
import { getAccessContext } from '@/lib/server/access';
import { UserPersona } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const retryAfter = consume(`pin-verify:${clientIp(request)}`, 30, 5 * 60_000);
    if (retryAfter > 0) return tooManyRequests(retryAfter);
    const context = await getAccessContext();
    const user = context.authenticated ? (context.user as UserPersona | undefined) : undefined;
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
    }

    const parsed = await parseJsonBody(request, z.object({ pin: z.string().max(10) }));
    if (!parsed.ok) return parsed.response;
    const { pin } = parsed.data;

    const result = await serverDb.verifyPin(user, pin);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'PIN verification error' },
      { status: 500 }
    );
  }
}
