import { serverDb } from '@/lib/server/db';
import { NextResponse } from 'next/server';
import { requireSchoolAccess } from '@/lib/server/access';
import { getServiceSupabase } from '@/lib/server/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const access = await requireSchoolAccess(searchParams.get('schoolId') || undefined, ['school_admin', 'teacher']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });

    const data = await serverDb.getTeacherAssignments(access.schoolId, searchParams.get('teacherId') || undefined);
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
    if (!supabase) return NextResponse.json({ success: true, data: body });

    // Validate or resolve academic_year_id to a valid UUID
    let academicYearId = body.academic_year_id;
    const isUuid = (v: any) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

    if (!isUuid(academicYearId)) {
      const { data: activeYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('school_id', access.schoolId)
        .order('is_current', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeYear?.id) {
        academicYearId = activeYear.id;
      } else {
        const { data: anyYear } = await supabase
          .from('academic_years')
          .select('id')
          .limit(1)
          .maybeSingle();
        academicYearId = anyYear?.id || null;
      }
    }

    const payload: any = {
      school_id: access.schoolId,
      academic_year_id: academicYearId,
      teacher_id: body.teacher_id,
      class_id: body.class_id,
      section_id: body.section_id || null,
      subject_id: body.subject_id,
    };

    // Query existing to prevent conflict errors with partial unique indexes
    let query = supabase
      .from('teacher_assignments')
      .select('id')
      .eq('school_id', access.schoolId)
      .eq('teacher_id', body.teacher_id)
      .eq('class_id', body.class_id)
      .eq('subject_id', body.subject_id);

    if (academicYearId) {
      query = query.eq('academic_year_id', academicYearId);
    }
    if (body.section_id) {
      query = query.eq('section_id', body.section_id);
    } else {
      query = query.is('section_id', null);
    }

    const { data: existing } = await query.maybeSingle();

    let data, error;
    if (existing?.id) {
      const res = await supabase
        .from('teacher_assignments')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      data = res.data;
      error = res.error;
    } else {
      const res = await supabase
        .from('teacher_assignments')
        .insert(payload)
        .select()
        .single();
      data = res.data;
      error = res.error;
    }
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error saving teacher assignment' },
      { status: 500 }
    );
  }
}
