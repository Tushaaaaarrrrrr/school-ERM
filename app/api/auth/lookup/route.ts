import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = (searchParams.get('identifier') || '')
      .trim()
      .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-');
    const schoolCode = (searchParams.get('schoolCode') || '').trim().toUpperCase();

    if (!identifier) {
      return NextResponse.json({ success: false, error: 'Identifier is required' }, { status: 400 });
    }

    const schools = await serverDb.getSchools();
    const targetSchool = schoolCode ? schools.find((s) => s.code.toUpperCase() === schoolCode) : null;

    const student = await serverDb.findStudentByRegistration(identifier, targetSchool?.id);
    if (student) {
      const sch = schools.find((s) => s.id === student.school_id) || targetSchool || schools[0];
      return NextResponse.json({
        success: true,
        exists: true,
        user: {
          id: `usr-${student.id}`,
          name: `${student.first_name} ${student.last_name}`,
          email: student.guardian?.email,
          role: 'student',
          school_id: sch?.id,
          school_name: sch?.name,
          school_code: sch?.code,
          student_id: student.id,
          login_id: student.registration_number,
        },
        studentData: student,
        schoolData: sch,
      });
    }

    return NextResponse.json({ success: true, exists: false });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Lookup failed' },
      { status: 500 }
    );
  }
}
