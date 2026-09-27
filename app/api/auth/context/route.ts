import { NextResponse } from 'next/server';
import { getAccessContext } from '@/lib/server/access';

export async function GET() {
  try {
    const context = await getAccessContext();
    return NextResponse.json(context, { status: context.authenticated ? 200 : 401 });
  } catch {
    return NextResponse.json({ authenticated: true, state: 'ERROR', error: "We couldn't check your access right now. Please try again." }, { status: 503 });
  }
}
