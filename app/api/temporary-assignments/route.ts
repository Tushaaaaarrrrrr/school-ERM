import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { TemporaryAssignment } from '@/lib/types';
import { requireSchoolAccess } from '@/lib/server/access';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedSchoolId = searchParams.get('schoolId') || undefined;
    const access = await requireSchoolAccess(requestedSchoolId, [
      'school_admin',
      'teacher',
      'staff',
      'accountant',
      'driver',
    ]);
    if (!access.ok || !access.schoolId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    }

    const absentEmployeeId = searchParams.get('absentEmployeeId') || undefined;
    const replacementEmployeeId = searchParams.get('replacementEmployeeId') || undefined;
    const status = searchParams.get('status') || undefined;

    const list = await serverDb.getTemporaryAssignments(access.schoolId, {
      absentEmployeeId,
      replacementEmployeeId,
      status,
    });

    return NextResponse.json({ success: true, data: list });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error fetching temporary assignments' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const access = await requireSchoolAccess(body.school_id, ['school_admin']);
    if (!access.ok || !access.schoolId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    }

    if (
      !body.absent_employee_id ||
      !body.absent_employee_name ||
      !body.replacement_employee_id ||
      !body.replacement_employee_name ||
      !body.start_date ||
      !body.end_date ||
      !body.duty_details
    ) {
      return NextResponse.json(
        { success: false, error: 'Missing required assignment fields (absent & replacement employee, dates, duty details).' },
        { status: 400 }
      );
    }

    if (body.end_date < body.start_date) {
      return NextResponse.json(
        { success: false, error: 'End date cannot be earlier than start date.' },
        { status: 400 }
      );
    }

    // Role check: Same-role substitution is default. Cross-role requires emergency override
    const absentRole = (body.absent_employee_role || '').toLowerCase();
    const replacementRole = (body.replacement_employee_role || '').toLowerCase();
    if (absentRole && replacementRole && absentRole !== replacementRole) {
      if (!body.is_emergency_override || !body.override_reason?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Cross-role substitution is not permitted by default. School Administrator must provide an emergency override with a logged justification.',
          },
          { status: 400 }
        );
      }
    }

    body.school_id = access.schoolId;
    body.created_by = (access.context as any).user?.id;
    body.created_by_name = (access.context as any).user?.name || 'School Administrator';

    const created = await serverDb.createTemporaryAssignment(body as TemporaryAssignment);
    return NextResponse.json({ success: true, data: created });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error creating temporary assignment' },
      { status: 500 }
    );
  }
}
