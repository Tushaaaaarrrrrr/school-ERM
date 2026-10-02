import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function getAuthenticatedSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Authentication service is not configured');
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(items: Array<{ name: string; value: string; options?: any }>) {
        try { items.forEach(({ name, value, options }) => store.set(name, value, options)); } catch {}
      },
    },
  });
}

export function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (
    url &&
    serviceKey &&
    !url.includes('demo.supabase.co') &&
    !url.includes('your-project-id')
  ) {
    return createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return null;
}

export async function requireIdentity() {
  const supabase = await getAuthenticatedSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) return { supabase, user: null };
  return { supabase, user };
}
