import assert from 'node:assert/strict';
import { resolveUserPhoto } from './avatar';
import type { UserPersona, School } from '@/lib/types';

// Standalone assert-based test per Ponytail guidelines (no external test runner needed)
const store: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, val: string) => {
    store[key] = String(val);
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
  },
  key: (i: number) => Object.keys(store)[i] ?? null,
  length: 0,
} as Storage;

// 1. Direct photo_url
const directUser: UserPersona = {
  id: 'usr-1',
  name: 'Direct User',
  role: 'teacher',
  photo_url: 'https://example.com/direct.png',
};
assert.equal(resolveUserPhoto(directUser), 'https://example.com/direct.png');

// 2. Teacher photo resolved from localStorage
localStorage.setItem(
  'school_erp_teachers',
  JSON.stringify([{ id: 'tch-1', employee_number: 'EMP-01', photo_url: 'https://example.com/teacher.png' }])
);
const teacherUser: UserPersona = {
  id: 'usr-tch-1',
  teacher_id: 'tch-1',
  name: 'Teacher One',
  role: 'teacher',
};
assert.equal(resolveUserPhoto(teacherUser), 'https://example.com/teacher.png');

// 3. Student photo resolved from localStorage
localStorage.setItem(
  'school_erp_students',
  JSON.stringify([{ id: 'std-1', registration_number: 'REG-101', photo_url: 'https://example.com/student.png' }])
);
const studentUser: UserPersona = {
  id: 'usr-std-1',
  name: 'Student One',
  role: 'student',
  login_id: 'REG-101',
};
assert.equal(resolveUserPhoto(studentUser), 'https://example.com/student.png');

// 4. Staff / Driver photo resolved from localStorage
localStorage.setItem(
  'school_erp_staff',
  JSON.stringify([{ id: 'stf-1', photo_url: 'https://example.com/driver.png' }])
);
const driverUser: UserPersona = {
  id: 'usr-stf-1',
  driver_id: 'stf-1',
  name: 'Driver One',
  role: 'driver',
};
assert.equal(resolveUserPhoto(driverUser), 'https://example.com/driver.png');

// 5. Parent photo resolved from localStorage
localStorage.setItem(
  'school_erp_parents',
  JSON.stringify([{ id: 'prt-1', email: 'parent@example.com', photo_url: 'https://example.com/parent.png' }])
);
const parentUser: UserPersona = {
  id: 'usr-prt-1',
  name: 'Parent One',
  role: 'parent',
  email: 'parent@example.com',
};
assert.equal(resolveUserPhoto(parentUser), 'https://example.com/parent.png');

// 6. School Admin photo resolved from school logo
const school: Partial<School> = {
  id: 'sch-1',
  name: 'Delhi Public School',
  logo_url: 'https://example.com/logo.png',
};
const adminUser: UserPersona = {
  id: 'usr-admin-1',
  name: 'Admin User',
  role: 'school_admin',
  school_id: 'sch-1',
};
assert.equal(resolveUserPhoto(adminUser, school as School), 'https://example.com/logo.png');

// 7. Null or missing photo returns null gracefully
assert.equal(resolveUserPhoto(null), null);
assert.equal(resolveUserPhoto(undefined), null);
assert.equal(resolveUserPhoto({ id: 'usr-none', name: 'No Photo', role: 'teacher' }), null);

console.log('✓ All resolveUserPhoto role tests passed successfully!');
