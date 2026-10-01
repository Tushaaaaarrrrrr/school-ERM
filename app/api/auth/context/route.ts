import { NextResponse } from 'next/server';
import { stripSchoolSecrets } from '@/lib/server/sanitize';
import { getAccessContext } from '@/lib/server/access';

export async function GET() {
  try {
    const context = await getAccessContext();
    const body = 'school' in context ? { ...context, school: stripSchoolSecrets(context.school) } : context;
    return NextResponse.json(body, { status: context.authenticated ? 200 : 401 });
  } catch {
    return NextResponse.json({ authenticated: true, state: 'ERROR', error: "We couldn't check your access right now. Please try again." }, { status: 503 });
  }
}
