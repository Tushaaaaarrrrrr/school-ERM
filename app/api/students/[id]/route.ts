import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { requireSchoolAccess } from '@/lib/server/access';
import { checkEmailRegistry } from '@/lib/server/email-registry';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requireSchoolAccess(null, ['school_admin', 'teacher', 'staff', 'driver', 'student', 'parent']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    const students = await serverDb.getStudents(access.schoolId);
    const cleanId = id.replace(/^usr-/, '').toLowerCase();
    const found = students.find((s: any) =>
      s.id.toLowerCase() === cleanId ||
      String(s.registration_number || '').toLowerCase() === cleanId
    );
    if (!found) return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });

    if (access.role === 'student' || access.role === 'parent') {
      const login = String(access.context?.user?.login_id || access.context?.user?.email || '').toLowerCase();
      const email = String(access.context?.user?.email || '').toLowerCase();
      const studentId = String(access.context?.user?.student_id || '').toLowerCase();
      const cleanUserId = String(access.context?.user?.id || '').replace(/^usr-/, '').toLowerCase();
      const guardian = (found.guardian || {}) as any;
      const foundAny = found as any;
      const matches =
        (studentId && String(found.id).toLowerCase() === studentId) ||
        (cleanUserId && String(found.id).toLowerCase() === cleanUserId) ||
        String(found.registration_number || foundAny.admission_number || '').toLowerCase() === login ||
        String(foundAny.email || '').toLowerCase() === email ||
        String(guardian.email || guardian.guardian_email || guardian.father_email || '').toLowerCase() === email;
      if (!matches) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ success: true, data: found });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error fetching student' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const access = await requireSchoolAccess(null, ['school_admin']);
    if (!access.ok) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    if (access.schoolId && body.guardian?.email) {
      const existing = (await serverDb.getStudents(access.schoolId)).find((item) => item.id === id);
      const emailCheck = await checkEmailRegistry(body.guardian.email, {
        excludeUserId: id,
        excludeEmail: existing?.guardian?.email,
        targetSchoolId: access.schoolId,
        targetRole: 'parent',
      });
      if (!emailCheck.valid || !emailCheck.available) {
        return NextResponse.json({ success: false, error: emailCheck.error || 'Parent email is not available.' }, { status: 409 });
      }
    }

    const updated = await serverDb.updateStudent(id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error updating student' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requireSchoolAccess(null, ['school_admin']);
    if (!access.ok) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });

    await serverDb.deleteStudent(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error deleting student' },
      { status: 500 }
    );
  }
}
