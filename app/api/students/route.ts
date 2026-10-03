import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { attendanceRoster } from '@/lib/server/student-attendance';
import { requireSchoolAccess } from '@/lib/server/access';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedSchoolId = searchParams.get('schoolId') || undefined;
    const access = await requireSchoolAccess(requestedSchoolId, ['school_admin', 'teacher', 'staff', 'driver', 'student', 'parent']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    let list = access.role === 'teacher' ? await attendanceRoster(access, true) : await serverDb.getStudents(access.schoolId);
    if (access.role === 'student' || access.role === 'parent') {
      const login = String(access.context.user?.login_id || access.context.user?.email || '').toLowerCase();
      const email = String(access.context.user?.email || '').toLowerCase();
      const studentId = String(access.context.user?.student_id || '').toLowerCase();
      const cleanUserId = String(access.context.user?.id || '').replace(/^usr-/, '').toLowerCase();
      list = list.filter((student: any) => {
        const guardian = student.guardian || {};
        return (
          (studentId && String(student.id).toLowerCase() === studentId) ||
          (cleanUserId && String(student.id).toLowerCase() === cleanUserId) ||
          String(student.registration_number || student.admission_number || '').toLowerCase() === login ||
          String(student.email || '').toLowerCase() === email ||
          String(guardian.email || guardian.guardian_email || guardian.father_email || '').toLowerCase() === email
        );
      });
    }
    return NextResponse.json({ success: true, data: list });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error fetching students' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const access = await requireSchoolAccess(body.school_id, ['school_admin']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });

    body.school_id = access.schoolId;
    const created = await serverDb.createStudent(body);
    return NextResponse.json({ success: true, data: created });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error creating student' },
      { status: 500 }
    );
  }
}
