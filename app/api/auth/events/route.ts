import { NextResponse } from 'next/server';
import { getAccessContext } from '@/lib/server/access';
import { requireIdentity } from '@/lib/server/auth';

export async function GET(request: Request) {
  try {
    const context = await getAccessContext();
    if (!context.authenticated) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    if (context.state !== 'SUPER_ADMIN' && !(context.state === 'ACTIVE_SCHOOL_USER' && context.user?.role === 'school_admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const params = new URL(request.url).searchParams;
    const { supabase } = await requireIdentity();
    let query = supabase.from('auth_events').select('*, schools(name)').order('created_at', { ascending: false }).limit(Math.min(Number(params.get('limit') || 100), 500));
    if (context.state !== 'SUPER_ADMIN') query = query.eq('school_id', context.user!.school_id!);
    else if (params.get('schoolId')) query = query.eq('school_id', params.get('schoolId')!);
    if (params.get('eventType')) query = query.eq('event_type', params.get('eventType')!);
    if (params.get('role')) query = query.eq('role', params.get('role')!);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, data: (data || []).map((event: any) => ({ ...event, school_name: event.schools?.name })) });
  } catch (error) {
    console.error('Auth events API failure:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load authentication events' }, { status: 500 });
  }
}
