import type { School, Student } from '@/lib/types';
import { hasConfiguredPin } from '@/lib/server/secrets';

export function stripSchoolSecrets<T extends Partial<School> | null | undefined>(school: T): T {
  if (!school) return school;
  const { admin_pin, security_answer: _answer, ...rest } = school as Partial<School>;
  return { ...rest, has_admin_pin: hasConfiguredPin(admin_pin) } as T;
}

// Only what the pre-login lookup needs to build a student session; no contact, medical or fee data.
export function studentLoginProfile(student: Student) {
  return {
    id: student.id,
    school_id: student.school_id,
    first_name: student.first_name,
    last_name: student.last_name,
    registration_number: student.registration_number,
    status: student.status,
    photo_url: student.photo_url,
    current_enrollment: student.current_enrollment,
    guardian: { email: student.guardian?.email },
  };
}
