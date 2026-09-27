import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { EmployeeSalaryAdjustment } from '@/lib/types';
import { requireSchoolAccess } from '@/lib/server/access';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedSchoolId = searchParams.get('schoolId') || undefined;
    const access = await requireSchoolAccess(requestedSchoolId, [
      'school_admin',
      'accountant',
      'teacher',
      'staff',
    ]);
    if (!access.ok || !access.schoolId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    }

    const employeeId = searchParams.get('employeeId') || undefined;
    const month = searchParams.get('month') || undefined;
    const type = searchParams.get('type') || undefined;
    const assignmentId = searchParams.get('assignmentId') || undefined;

    const list = await serverDb.getSalaryAdjustments(access.schoolId, {
      employeeId,
      month,
      type,
      assignmentId,
    });

    return NextResponse.json({ success: true, data: list });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error fetching salary adjustments' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const access = await requireSchoolAccess(body.school_id, ['school_admin', 'accountant']);
    if (!access.ok || !access.schoolId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    }

    if (!body.employee_id || !body.adjustment_type || !body.reason || body.amount === undefined || !body.effective_date) {
      return NextResponse.json(
        { success: false, error: 'Missing required adjustment fields (employee, type, reason, amount, effective date).' },
        { status: 400 }
      );
    }

    if (!['reimbursement', 'deduction'].includes(body.adjustment_type)) {
      return NextResponse.json(
        { success: false, error: 'Adjustment type must be either "reimbursement" or "deduction".' },
        { status: 400 }
      );
    }

    const amount = Number(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Adjustment amount must be a positive number greater than 0.' },
        { status: 400 }
      );
    }

    body.amount = amount;
    body.school_id = access.schoolId;
    body.billing_month = body.billing_month || body.effective_date.slice(0, 7);
    body.created_by = access.context.user?.id;
    body.created_by_name = access.context.user?.name || 'School Administrator';

    const created = await serverDb.createSalaryAdjustment(body as EmployeeSalaryAdjustment);
    return NextResponse.json({ success: true, data: created });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error creating salary adjustment' },
      { status: 500 }
    );
  }
}
