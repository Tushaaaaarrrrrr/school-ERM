import { NextResponse } from 'next/server';
import { stripSchoolSecrets } from '@/lib/server/sanitize';
import { createClient } from '@supabase/supabase-js';
import { redirectForContext, resolveAccessContext } from '@/lib/server/access';

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!token || !url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Missing mobile auth token' }, { status: 401 });
    }

    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user?.email) {
      return NextResponse.json({ success: false, error: 'Invalid Google session' }, { status: 401 });
    }

    const context = await resolveAccessContext(supabase, data.user);
    if (!context.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
    }
    return NextResponse.json({
      success: true,
      user: context.user,
      school: stripSchoolSecrets(context.school),
      state: context.state,
      redirectUrl: redirectForContext(context),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Google authentication failed' },
      { status: 500 }
    );
  }
}
