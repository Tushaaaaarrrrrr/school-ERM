// Self-check: verify student name modification rejection logic
import assert from 'node:assert';

function checkStudentNameUpdateAllowed(role, originalName, newName) {
  const isStudent = role === 'student';
  if (isStudent && newName !== undefined) {
    if (newName.trim() !== originalName.trim()) {
      return { allowed: false, error: 'Students are not authorized to modify their official name.' };
    }
  }
  return { allowed: true };
}

// Test cases
console.log('Testing Student Name Lock Logic...');

// 1. Student trying to change name -> Must be rejected
const res1 = checkStudentNameUpdateAllowed('student', 'Student two', 'Hacked Name');
assert.strictEqual(res1.allowed, false, 'Student name change must be blocked');
assert.ok(res1.error.includes('not authorized'));

// 2. Student updating phone without changing name -> Must be allowed
const res2 = checkStudentNameUpdateAllowed('student', 'Student two', 'Student two');
assert.strictEqual(res2.allowed, true, 'Unchanged name should be allowed');

// 3. Admin / Teacher updating their display name -> Must be allowed
const res3 = checkStudentNameUpdateAllowed('teacher', 'Teacher Jane', 'Jane Doe');
assert.strictEqual(res3.allowed, true, 'Teachers can update their display name');

const res4 = checkStudentNameUpdateAllowed('school_admin', 'Admin User', 'Principal User');
assert.strictEqual(res4.allowed, true, 'School admin can update their display name');

console.log('All student name protection self-checks passed!');
