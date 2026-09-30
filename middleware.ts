import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // 1. Check if user has an active School ERP credential session cookie (students, teachers, staff, parents)
  const sessionCookie = request.cookies.get('school_erp_session')?.value;
  if (sessionCookie) {
    try {
      let raw = sessionCookie.trim();
      if (raw.startsWith('"') && raw.endsWith('"')) {
        raw = raw.slice(1, -1);
      }
      try {
        raw = decodeURIComponent(raw);
      } catch {}
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.id || parsed.role)) {
        return response;
      }
    } catch {
      // In case of malformed cookie, proceed to Supabase check
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isConfigured =
    Boolean(url && key) &&
    !url?.includes('demo.supabase.co') &&
    !url?.includes('your-project-id') &&
    key !== 'demo-anon-key';

  // In demo / mock environment or when Supabase is not configured on hosting, allow client-side routing
  if (!isConfigured) {
    return response;
  }

  try {
    const supabase = createServerClient(url!, key!, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return response;
    }

    // No valid server session — redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  } catch {
    // If Supabase server auth check fails, allow response to avoid infinite redirects
    return response;
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/teacher/:path*', '/student/:path*', '/staff/:path*', '/driver/:path*', '/parent/:path*', '/super-admin/:path*'],
};
