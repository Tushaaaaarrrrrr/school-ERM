const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  const exports = {};
  new Function('exports','require',code)(exports,(name) => { if (!(name in dependencies)) throw new Error(name); return dependencies[name]; });
  return exports;
}
const {canMarkStudent} = load('lib/utils/attendance-scope.ts');
const classes=[{id:'six',class_teacher_id:'teacher-six'},{id:'seven',class_teacher_id:'teacher-seven'}];
const sections=[{id:'six-a',class_id:'six',class_teacher_id:'teacher-six'},{id:'seven-a',class_id:'seven',class_teacher_id:'teacher-seven'}];
assert.equal(canMarkStudent('teacher-seven',{class_id:'six',section_id:'six-a'},classes,sections),false);
assert.equal(canMarkStudent('teacher-seven',{class_id:'seven',section_id:'seven-a'},classes,sections),true);
assert.equal(canMarkStudent('teacher-seven',{class_id:'six',section_id:'six-a'},classes,sections,['teacher-six']),true);
assert.equal(canMarkStudent('',{class_id:'seven'},classes,sections),false);
assert.equal(canMarkStudent('teacher-six',{class_id:'seven',section_id:'six-a'},classes,sections),false);
assert.equal(canMarkStudent('teacher-six',{class_id:'six',section_id:'six-a'},[{id:'six',class_teacher_id:'other'}],sections),true);
const student={id:'one',status:'active',current_enrollment:{class_id:'seven',section_id:'seven-a',academic_year_id:'year'}};
let saved=0;
const access={ok:true,schoolId:'school',role:'teacher',context:{user:{id:'teacher',name:'Teacher'},profile:{id:'teacher'}}};
const route=load('app/api/attendance/students/route.ts',{
 'next/server':{NextResponse:{json:(body,options={})=>({body,status:options.status||200})}},
 '@/lib/server/access':{requireSchoolAccess:async()=>access,getAccessibleStudentIds:async()=>null},
 '@/lib/server/student-attendance':{attendanceRoster:async()=>[student]},
 '@/lib/server/db':{serverDb:{getStudentAttendances:async()=>[],createStudentAttendance:async(row)=>{saved++;return row;}}},
});
(async()=>{
 const record={student_id:'one',class_id:'seven',section_id:'seven-a',attendance_date:'2026-10-03',status:'present'};
 const post=(body)=>route.POST({json:async()=>body});
 assert.equal((await post({...record,student_id:'two'})).status,403);
 assert.equal((await post({...record,class_id:'six'})).status,400);
 assert.equal((await post({...record,status:null})).status,400);
 assert.equal(saved,0);
 const result=await post(record);
 assert.equal(result.status,200);
 assert.equal(saved,1);
 assert.equal(result.body.data.academic_year_id,'year');
 assert.equal(result.body.data.school_id,'school');
 const roster=await route.GET({url:'https://school/api/attendance/students?roster=true'});
 assert.deepEqual(roster.body.data,[student]);
 const web=fs.readFileSync('app/teacher/attendance/page.tsx','utf8');
 assert(web.includes('status: null'));
 assert(!web.includes("status: attendanceMap[st.id]?.status || 'present'"));
 const shell=fs.readFileSync('mobile/lib/views/shell/main_shell_view.dart','utf8');
 for(const path of ['/teacher','/teacher/attendance','/teacher/classes','/teacher/exams','/teacher/leave','/teacher/timetable','/teacher/payments']) assert(shell.includes(`TeacherPortalView(path: '${path}')`));
 console.log('Teacher class isolation, coverage, unmarked defaults, validated saves and seven portal routes passed');
})().catch(error=>{console.error(error);process.exitCode=1});
