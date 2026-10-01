import { NextResponse } from 'next/server';
import { requireSchoolAccess } from '@/lib/server/access';
import { getServiceSupabase } from '@/lib/server/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const access = await requireSchoolAccess(searchParams.get('schoolId') || undefined, ['school_admin', 'teacher']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });

    const supabase = getServiceSupabase();
    if (!supabase) return NextResponse.json({ success: true, data: [] });

    let query = supabase.from('teacher_assignments').select('*').eq('school_id', access.schoolId);
    const teacherId = searchParams.get('teacherId');
    if (teacherId) query = query.eq('teacher_id', teacherId);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error fetching teacher assignments' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const access = await requireSchoolAccess(body.school_id, ['school_admin']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });

    const supabase = getServiceSupabase();
    if (!supabase) return NextResponse.json({ success: false, error: 'Database is not configured' }, { status: 503 });

    const payload = {
      school_id: access.schoolId,
      academic_year_id: body.academic_year_id,
      teacher_id: body.teacher_id,
      class_id: body.class_id,
      section_id: body.section_id || null,
      subject_id: body.subject_id,
    };
    const { data, error } = await supabase
      .from('teacher_assignments')
      .upsert(payload, { onConflict: 'school_id,academic_year_id,teacher_id,class_id,section_id,subject_id' })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error saving teacher assignment' },
      { status: 500 }
    );
  }
}
