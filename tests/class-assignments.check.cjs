const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const compiled = ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, '../lib/utils/class-assignments.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const moduleOutput = { exports: {} };
new Function('exports', compiled)(moduleOutput.exports);
const { resolveTeacherAssignments, resolveEnrollmentClass } = moduleOutput.exports;

function assertPartial(actual, expected) {
  for (const key of Object.keys(expected)) assert.deepEqual(actual[key], expected[key]);
}
{
  const classes = [{ id: 'c6', name: 'Class 6', class_teacher_id: 't2', default_room_number: '102' }, { id: 'c7', name: 'Class 7' }];
  const sections = [{ id: 's6', class_id: 'c6', name: 'A', class_teacher_id: 't2', room_number: '202' }, { id: 's7', class_id: 'c7', name: 'A', class_teacher_id: 't1', room_number: '101' }];
  const subject = { id: 'subject', teacher_id: 't3', class_id: 'c7', section_id: 's7', subject_id: 'math' };
  const assignments = resolveTeacherAssignments('school', [subject], classes, sections, []);
  assert.deepEqual(assignments.map((a) => a.teacher_id), ['t3', 't2', 't2', 't1']);
  assertPartial(assignments.find((a) => a.teacher_id === 't1'), { class_name: 'Class 7', section_name: 'A', room_number: '101' });
  const enrollment = { class_id: 'c7', section_id: 's7', class_teacher_name: 'Old teacher', room_number: 'Old room' };
  const teachers = [{ id: 't1', first_name: 'teacher', last_name: 'one' }, { id: 't2', first_name: 'Tamoghna', last_name: 'Teacher' }];
  assertPartial(resolveEnrollmentClass(enrollment, classes, sections, teachers), { class_teacher_name: 'teacher one', room_number: '101' });
  assertPartial(resolveEnrollmentClass({ ...enrollment, class_id: 'c6', section_id: '' }, classes, sections, teachers), { class_teacher_name: 'Tamoghna Teacher', room_number: '102' });
  const legacyEnrollment = { ...enrollment, class_id: 'old-class-id', section_id: 'old-section-id', class_name: ' class 7 ', section_name: ' a ' };
  assertPartial(resolveEnrollmentClass(legacyEnrollment, classes, sections, teachers), {
    class_id: 'c7', section_id: 's7', class_teacher_name: 'teacher one', room_number: '101',
  });
  assertPartial(resolveEnrollmentClass({ ...legacyEnrollment, section_name: undefined }, classes, sections, teachers), {
    class_teacher_name: undefined, room_number: undefined,
  });
  assertPartial(resolveEnrollmentClass(legacyEnrollment, [...classes, { ...classes[1], id: 'duplicate' }], sections, teachers), {
    class_teacher_name: undefined, room_number: undefined,
  });
  assertPartial(resolveEnrollmentClass(legacyEnrollment, classes, [...sections, { ...sections[1], id: 'duplicate-section' }], teachers), {
    class_teacher_name: undefined, room_number: undefined,
  });
  assert.equal(resolveEnrollmentClass({ ...enrollment, class_name: 'Class 6', section_name: 'wrong' }, classes, sections, teachers).class_id, 'c7');
  const rooms = [{ id: 'r1', room_number: '303' }];
  sections[1].room_id = 'r1';
  assert.equal(resolveEnrollmentClass(enrollment, classes, sections, teachers, rooms).room_number, '303');
  assert.equal(resolveTeacherAssignments('school', [], classes, sections, [], rooms).find((a) => a.teacher_id === 't1').room_number, '303');
  sections[0].class_teacher_id = 't1';
  assert.equal(resolveEnrollmentClass({ ...enrollment, class_id: 'c6', section_id: 's6' }, classes, sections, teachers).class_teacher_name, 'teacher one');
  sections[1].class_teacher_id = undefined;
  assert.equal(resolveEnrollmentClass(enrollment, classes, sections, teachers).class_teacher_name, undefined);
}
console.log("Class assignment regression checks passed");
