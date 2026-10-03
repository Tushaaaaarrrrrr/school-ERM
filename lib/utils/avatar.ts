import type { UserPersona, School } from '@/lib/types';

/**
 * Universal helper to resolve profile photo / avatar URL for ANY role:
 * 1. Checks user.photo_url directly
 * 2. If empty, inspects local entity caches for Teacher, Student, Staff, Driver, Parent, or School Admin
 */
export function resolveUserPhoto(
  user: UserPersona | null | undefined,
  school?: School | null
): string | null {
  if (!user) return null;
  if (user.photo_url && user.photo_url.trim()) return user.photo_url.trim();
  if (user.role === 'school_admin' && school?.logo_url) return school.logo_url;
  if (typeof localStorage === 'undefined') return null;

  try {
    const role = user.role;
    const userId = user.id?.replace(/^usr-/, '') || '';
    const email = (user.email || '').trim().toLowerCase();
    const loginId = (user.login_id || '').trim().toLowerCase();

    if (role === 'teacher') {
      const teacherId = user.teacher_id || userId;
      const raw = localStorage.getItem('school_erp_teachers');
      if (raw) {
        const teachers = JSON.parse(raw);
        const t = teachers.find(
          (tch: any) =>
            (teacherId && tch.id === teacherId) ||
            (email && tch.email?.trim().toLowerCase() === email) ||
            (loginId && tch.employee_number?.trim().toLowerCase() === loginId)
        );
        if (t?.photo_url) return t.photo_url;
      }
    } else if (role === 'student') {
      const studentId = user.student_id || userId;
      const raw = localStorage.getItem('school_erp_students');
      if (raw) {
        const students = JSON.parse(raw);
        const s = students.find(
          (std: any) =>
            (studentId && std.id === studentId) ||
            (loginId && std.registration_number?.trim().toLowerCase() === loginId) ||
            std.auth_user_id === user.id
        );
        if (s?.photo_url) return s.photo_url;
      }
    } else if (role === 'staff' || role === 'driver' || role === 'accountant') {
      const staffId = user.staff_id || user.driver_id || userId;
      const raw = localStorage.getItem('school_erp_staff');
      if (raw) {
        const staffList = JSON.parse(raw);
        const st = staffList.find(
          (member: any) =>
            (staffId && member.id === staffId) ||
            (email && member.email?.trim().toLowerCase() === email) ||
            (loginId && member.employee_number?.trim().toLowerCase() === loginId)
        );
        if (st?.photo_url) return st.photo_url;
      }
    } else if (role === 'parent') {
      const parentId = user.parent_id || userId;
      const raw = localStorage.getItem('school_erp_parents');
      if (raw) {
        const parents = JSON.parse(raw);
        const p = parents.find(
          (par: any) =>
            (parentId && par.id === parentId) ||
            (email && par.email?.trim().toLowerCase() === email) ||
            par.auth_user_id === user.id
        );
        if (p?.photo_url) return p.photo_url;
      }
    } else if (role === 'school_admin') {
      if (school?.logo_url) return school.logo_url;
      const raw = localStorage.getItem('school_erp_schools');
      if (raw) {
        const schools = JSON.parse(raw);
        const s = schools.find((sch: any) => sch.id === user.school_id);
        if (s?.logo_url) return s.logo_url;
      }
    }
  } catch {}

  return null;
}

/**
 * Universal helper to resolve official registered name for ANY role:
 * If a user logged in with an external email / OAuth account (e.g. Google "Alpha IITIAN"),
 * this resolves their official registered entity name (e.g. "teacher one") from the school records.
 */
export function resolveUserName(
  user: UserPersona | null | undefined,
  school?: School | null
): string {
  if (!user) return 'User';
  if (user.role === 'super_admin') return user.name || 'Super Admin';
  if (typeof localStorage === 'undefined') return user.name || 'User';

  try {
    const role = user.role;
    const userId = user.id?.replace(/^usr-/, '') || '';
    const email = (user.email || '').trim().toLowerCase();
    const loginId = (user.login_id || '').trim().toLowerCase();

    if (role === 'teacher') {
      const teacherId = user.teacher_id || userId;
      const raw = localStorage.getItem('school_erp_teachers');
      if (raw) {
        const teachers = JSON.parse(raw);
        const t = teachers.find(
          (tch: any) =>
            (teacherId && tch.id === teacherId) ||
            (email && tch.email?.trim().toLowerCase() === email) ||
            (loginId && tch.employee_number?.trim().toLowerCase() === loginId)
        );
        if (t) {
          const regName = `${t.first_name || ''} ${t.last_name || ''}`.trim();
          if (regName) return regName;
        }
      }
    } else if (role === 'student') {
      const studentId = user.student_id || userId;
      const raw = localStorage.getItem('school_erp_students');
      if (raw) {
        const students = JSON.parse(raw);
        const s = students.find(
          (std: any) =>
            (studentId && std.id === studentId) ||
            (loginId && std.registration_number?.trim().toLowerCase() === loginId) ||
            std.auth_user_id === user.id
        );
        if (s) {
          const regName = `${s.first_name || ''} ${s.last_name || ''}`.trim();
          if (regName) return regName;
        }
      }
    } else if (role === 'staff' || role === 'driver' || role === 'accountant') {
      const staffId = user.staff_id || user.driver_id || userId;
      const raw = localStorage.getItem('school_erp_staff');
      if (raw) {
        const staffList = JSON.parse(raw);
        const st = staffList.find(
          (member: any) =>
            (staffId && member.id === staffId) ||
            (email && member.email?.trim().toLowerCase() === email) ||
            (loginId && member.employee_number?.trim().toLowerCase() === loginId)
        );
        if (st) {
          const regName = `${st.first_name || ''} ${st.last_name || ''}`.trim();
          if (regName) return regName;
        }
      }
    } else if (role === 'school_admin' && school?.admin_name) {
      return school.admin_name;
    }
  } catch {}

  return user.name || 'User';
}
