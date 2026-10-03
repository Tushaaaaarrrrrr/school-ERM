import { NextResponse } from 'next/server';
import { requireSchoolAccess } from '@/lib/server/access';
import { getServiceSupabase } from '@/lib/server/auth';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requireSchoolAccess(undefined, ['school_admin']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });

    const supabase = getServiceSupabase();
    if (!supabase) return NextResponse.json({ success: true });

    const { error } = await supabase.from('teacher_assignments').delete().eq('id', id).eq('school_id', access.schoolId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error removing teacher assignment' },
      { status: 500 }
    );
  }
}
