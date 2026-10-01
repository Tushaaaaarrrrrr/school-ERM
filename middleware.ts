import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { escapeLikePattern } from '@/lib/utils/security';

const PORTAL_ROLES: Record<string, string[]> = {
  '/admin': ['school_admin'],
  '/teacher': ['teacher'],
  '/student': ['student'],
  '/staff': ['staff', 'accountant'],
  '/driver': ['driver'],
  '/parent': ['parent'],
  '/super-admin': ['super_admin'],
};

function portalForRole(role?: string) {
  return role === 'super_admin' ? '/super-admin'
    : role === 'school_admin' ? '/admin'
    : role === 'teacher' ? '/teacher'
    : role === 'student' ? '/student'
    : role === 'driver' ? '/driver'
    : role === 'parent' ? '/parent'
    : role === 'staff' || role === 'accountant' ? '/staff'
    : '/join';
}

function guardedPortal(pathname: string) {
  return Object.keys(PORTAL_ROLES).find((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const portal = guardedPortal(request.nextUrl.pathname);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isConfigured =
    Boolean(url && key) &&
    !url?.includes('demo.supabase.co') &&
    !url?.includes('your-project-id') &&
    key !== 'demo-anon-key';

  // In demo / mock environment or when Supabase is not configured on hosting, allow client-side routing
  if (!isConfigured) {
    const sessionCookie = request.cookies.get('school_erp_session')?.value;
    if (sessionCookie) {
      try {
        let raw = sessionCookie.trim();
        if (raw.startsWith('"') && raw.endsWith('"')) raw = raw.slice(1, -1);
        try {
          raw = decodeURIComponent(raw);
        } catch {}
        const parsed = JSON.parse(raw);
        const role = parsed?.role;
        if (portal && (!role || !PORTAL_ROLES[portal].includes(role))) {
          return NextResponse.redirect(new URL(portalForRole(role), request.url));
        }
      } catch {}
    }
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
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!portal) {
      return response;
    }

    const db = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createClient(url!, process.env.SUPABASE_SERVICE_ROLE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : supabase;

    const email = user.email?.trim().toLowerCase() || '';
    let { data: profile } = await db
      .from('profiles')
      .select('id, role, status')
      .eq('auth_user_id', user.id)
      .limit(1)
      .maybeSingle();
    if (!profile && email) {
      ({ data: profile } = await db
        .from('profiles')
        .select('id, role, status')
        .ilike('email', escapeLikePattern(email))
        .limit(1)
        .maybeSingle());
    }

    if (!profile || (profile.status && profile.status !== 'active')) {
      return NextResponse.redirect(new URL('/join', request.url));
    }

    const { data: membership } = await db
      .from('school_memberships')
      .select('role, status')
      .eq('user_id', profile.id)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const role = profile.role === 'super_admin' ? 'super_admin' : membership?.role;
    if (!role || !PORTAL_ROLES[portal].includes(role)) {
      return NextResponse.redirect(new URL(portalForRole(role), request.url));
    }

    return response;
  } catch {
    return NextResponse.redirect(new URL('/join', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*', '/teacher/:path*', '/student/:path*', '/staff/:path*', '/driver/:path*', '/parent/:path*', '/super-admin/:path*'],
};
