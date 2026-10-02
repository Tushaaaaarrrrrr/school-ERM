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
    let data = await serverDb.getPaymentReceipts(access.schoolId);
    const studentId = searchParams.get('studentId');
    const allowedStudentIds = await getAccessibleStudentIds(access, access.schoolId);
    if (allowedStudentIds) {
      data = data.filter((item: any) =>
        allowedStudentIds.has(item.student_id) ||
        allowedStudentIds.has(String(item.student_id || '').toLowerCase()) ||
        allowedStudentIds.has(item.registration_number_snapshot) ||
        allowedStudentIds.has(String(item.registration_number_snapshot || '').toLowerCase())
      );
    } else if (studentId) {
      const target = studentId.toLowerCase();
      const clean = target.replace(/^usr-/, '');
      data = data.filter((item: any) => {
        const sId = String(item.student_id || '').toLowerCase();
        const sReg = String(item.registration_number_snapshot || '').toLowerCase();
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
    const data = await serverDb.createPaymentReceipt({ ...body, school_id: access.schoolId });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return errorResponse(error);
  }
}
