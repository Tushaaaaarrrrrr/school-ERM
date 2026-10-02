import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { getAccessibleStudentIds, requireSchoolAccess } from '@/lib/server/access';

function errorResponse(error: any) {
  return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const access = await requireSchoolAccess(null, ['school_admin', 'accountant', 'student', 'parent']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    let data = await serverDb.getFeeInvoices(access.schoolId);
    const requestedStudentId = searchParams.get('studentId') || '';
    if (access.role === 'student' || access.role === 'parent') {
      const allowedStudentIds = await getAccessibleStudentIds(access, access.schoolId);
      data = data.filter((invoice: any) =>
        allowedStudentIds?.has(invoice.student_id) ||
        allowedStudentIds?.has(String(invoice.student_id || '').toLowerCase()) ||
        allowedStudentIds?.has(invoice.registration_number) ||
        allowedStudentIds?.has(String(invoice.registration_number || '').toLowerCase())
      );
    } else if (requestedStudentId) {
      const target = requestedStudentId.toLowerCase();
      const clean = target.replace(/^usr-/, '');
      data = data.filter((invoice: any) => {
        const sId = String(invoice.student_id || '').toLowerCase();
        const sReg = String(invoice.registration_number || '').toLowerCase();
        return sId === target || sId === clean || sReg === target || sReg === clean;
      });
    }
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireSchoolAccess(null, ['school_admin', 'accountant']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    const body = await request.json();
    const data = await serverDb.createFeeInvoice({ ...body, school_id: access.schoolId });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return errorResponse(error);
  }
}
