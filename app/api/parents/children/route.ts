// ============================================================================
// Multi-Child Parent API
// Returns all students linked to the authenticated parent by email, phone, or explicit parent-student links
// ============================================================================

import { NextResponse } from 'next/server';
import { getAccessContext } from '@/lib/server/access';
import { serverDb } from '@/lib/server/db';
import { getServiceSupabase } from '@/lib/server/auth';
import { Student } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const context = await getAccessContext();
    if (!context.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetSchoolId = searchParams.get('schoolId') || context.user?.school_id || '';
    const queryEmail = searchParams.get('email');
    const queryParentId = searchParams.get('parentId');

    // Only school_admin and super_admin can query for arbitrary parents
    const isStaffOrAdmin =
      context.state === 'SUPER_ADMIN' ||
      (context.state === 'ACTIVE_SCHOOL_USER' &&
        ['school_admin', 'teacher', 'staff'].includes(context.user?.role || ''));

    const parentEmail = (isStaffOrAdmin && queryEmail ? queryEmail : context.profile?.email || context.user?.email || '')
      .toLowerCase()
      .trim();

    const parentPhone = (context.profile?.phone || '').replace(/\D/g, '');

    // Identify which schools to search
    let schoolIds: string[] = [];
    if (targetSchoolId) {
      schoolIds = [targetSchoolId];
    } else if (context.state === 'SUPER_ADMIN') {
      const allSchools = await serverDb.getSchools();
      schoolIds = allSchools.map((s) => s.id);
    } else if (context.user?.school_id) {
      schoolIds = [context.user.school_id];
    }

    const matchedMap = new Map<string, Student>();

    for (const sId of schoolIds) {
      const students = await serverDb.getStudents(sId);

      for (const st of students) {
        const guardianEmail = st.guardian?.email?.toLowerCase().trim();
        const guardianPhone = (st.guardian?.primary_phone || '').replace(/\D/g, '');
        const secondaryPhone = (st.guardian?.secondary_phone || '').replace(/\D/g, '');

        let isMatch = false;

        // 1. Email match
        if (parentEmail && guardianEmail && guardianEmail === parentEmail) {
          isMatch = true;
        }

        // 2. Phone match (if 10 digits match)
        if (!isMatch && parentPhone && parentPhone.length >= 10) {
          if (guardianPhone === parentPhone || secondaryPhone === parentPhone) {
            isMatch = true;
          }
        }

        // 3. Auth user ID match
        if (!isMatch && context.profile?.id && st.auth_user_id === context.profile.id) {
          isMatch = true;
        }

        if (isMatch) {
          matchedMap.set(st.id, st);
        }
      }
    }

    const matchedStudents = Array.from(matchedMap.values());

    if (matchedStudents.length === 0 && parentEmail) {
      const adminClient = getServiceSupabase();
      if (adminClient) {
        try {
          const { data: directStudents } = await adminClient
            .from('students')
            .select('*')
            .ilike('guardian->>email', parentEmail)
            .eq('status', 'active');
          if (directStudents && directStudents.length > 0) {
            matchedStudents.push(...directStudents);
          }
        } catch {}

        if (matchedStudents.length === 0) {
          try {
            const { data: gList } = await adminClient
              .from('guardians')
              .select('student_id')
              .ilike('email', parentEmail);
            if (gList && gList.length > 0) {
              const studentIds = gList.map((g: any) => g.student_id);
              const { data: sList } = await adminClient
                .from('students')
                .select('*')
                .in('id', studentIds);
              if (sList && sList.length > 0) {
                matchedStudents.push(...sList);
              }
            }
          } catch {}
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: matchedStudents,
      count: matchedStudents.length,
      parentEmail,
    });
  } catch (error: any) {
    console.error('Failed to fetch parent children:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch linked children' },
      { status: 500 }
    );
  }
}
