import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirectForContext, resolveAccessContext } from '@/lib/server/access';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const pendingCookies: Array<{ name: string; value: string; options?: any }> = [];
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            pendingCookies.splice(0, pendingCookies.length, ...cookiesToSet);
          },
        },
      });

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data?.user?.email) {
        const userEmail = data.user.email.trim().toLowerCase();

        try {
          const context = await resolveAccessContext(supabase, data.user);
          const auditResult = await supabase.rpc('record_authenticated_auth_event', {
            p_event_type: 'google_login_success',
            p_success: true,
            p_user_agent: request.headers.get('user-agent'),
            p_platform: 'Web Browser',
            p_details: { access_state: context.state },
          });
          if (auditResult.error) console.error('Unable to record OAuth audit event:', auditResult.error.message);
          const response = NextResponse.redirect(`${origin}${redirectForContext(context)}`);
          pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          return response;
        } catch (accessError) {
          console.error('OAuth access-context failure:', accessError);
          const response = NextResponse.redirect(`${origin}/login?error=access_context_failed`);
          pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          return response;
        }
      }
      console.error('OAuth code exchange failed:', error?.message || 'No verified Google user returned');
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_callback_failed&next=${encodeURIComponent(next)}`);
}
