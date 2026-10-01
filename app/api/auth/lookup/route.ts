import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { stripSchoolSecrets, studentLoginProfile } from '@/lib/server/sanitize';

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
    const candidateSchools = targetSchool ? [targetSchool] : schools;
    const cleanIdentifier = identifier.toLowerCase();

    const student = await serverDb.findStudentByRegistration(identifier, targetSchool?.id);
    if (student) {
      if (student.status !== 'active') {
        return NextResponse.json({
          success: true,
          exists: false,
          isDeactivated: true,
          error: `This student account (${student.registration_number}) has been deactivated or suspended. Please contact your school administrator.`,
        });
      }

      const sch = schools.find((s) => s.id === student.school_id) || targetSchool || schools[0];
      const schoolId = student.school_id || sch?.id;
      return NextResponse.json({
        success: true,
        exists: true,
        user: {
          id: `usr-${student.id}`,
          name: `${student.first_name} ${student.last_name}`,
          email: student.guardian?.email,
          role: 'student',
          school_id: schoolId,
          school_name: sch?.name,
          school_code: sch?.code,
          student_id: student.id,
          login_id: student.registration_number,
          avatar_url: student.photo_url,
        },
        studentData: studentLoginProfile(student),
        schoolData: stripSchoolSecrets(sch),
      });
    }

    for (const school of candidateSchools) {
      const adminEmails = (school.admin_email || '')
        .split(',')
        .map((e: string) => e.trim().toLowerCase())
        .filter(Boolean);

      if (adminEmails.includes(cleanIdentifier)) {
        return NextResponse.json({
          success: true,
          exists: true,
          user: {
            id: `usr-admin-${school.id}`,
            name: school.admin_name || `${school.name} Administrator`,
            email: cleanIdentifier,
            role: 'school_admin',
            school_id: school.id,
            school_name: school.name,
            school_code: school.code,
            login_id: cleanIdentifier,
          },
          schoolData: stripSchoolSecrets(school),
        });
      }

      const [teachers, staff, parents] = await Promise.all([
        serverDb.getTeachers(school.id),
        serverDb.getStaff(school.id),
        serverDb.getParents(school.id),
      ]);

      const teacher = teachers.find((t: any) =>
        t.email?.toLowerCase() === cleanIdentifier ||
        t.employee_number?.toLowerCase() === cleanIdentifier
      );
      if (teacher) {
        return NextResponse.json({
          success: true,
          exists: true,
          user: {
            id: `usr-${teacher.id}`,
            name: `${teacher.first_name} ${teacher.last_name}`.trim(),
            email: teacher.email,
            role: 'teacher',
            school_id: school.id,
            school_name: school.name,
            school_code: school.code,
            login_id: teacher.employee_number || teacher.email,
            avatar_url: teacher.photo_url,
          },
          teacherData: teacher,
          schoolData: stripSchoolSecrets(school),
        });
      }

      const staffMember = staff.find((s: any) =>
        s.email?.toLowerCase() === cleanIdentifier ||
        s.employee_number?.toLowerCase() === cleanIdentifier
      );
      if (staffMember) {
        const staffRole = staffMember.staff_type === 'driver' ? 'driver' : 'staff';
        return NextResponse.json({
          success: true,
          exists: true,
          user: {
            id: `usr-${staffMember.id}`,
            name: `${staffMember.first_name} ${staffMember.last_name}`.trim(),
            email: staffMember.email,
            role: staffRole,
            school_id: school.id,
            school_name: school.name,
            school_code: school.code,
            login_id: staffMember.employee_number || staffMember.email,
            avatar_url: staffMember.photo_url,
          },
          staffData: staffMember,
          schoolData: stripSchoolSecrets(school),
        });
      }

      const parent = parents.find((p: any) =>
        p.email?.toLowerCase() === cleanIdentifier ||
        p.primary_phone?.replace(/\D/g, '') === identifier.replace(/\D/g, '')
      );
      if (parent) {
        return NextResponse.json({
          success: true,
          exists: true,
          user: {
            id: `usr-${parent.id}`,
            name: parent.full_name || parent.name || 'Parent',
            email: parent.email,
            role: 'parent',
            school_id: school.id,
            school_name: school.name,
            school_code: school.code,
            login_id: parent.email || parent.primary_phone,
            avatar_url: parent.photo_url,
          },
          parentData: parent,
          schoolData: stripSchoolSecrets(school),
        });
      }
    }

    return NextResponse.json({ success: true, exists: false });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Lookup failed' },
      { status: 500 }
    );
  }
}
