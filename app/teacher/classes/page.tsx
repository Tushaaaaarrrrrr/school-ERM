'use client';

// ============================================================================
// Teacher's My Classes, Student Roster & Academic/Attendance Insights
// ============================================================================

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { teacherService, studentService, insightService } from '@/lib/services/api';
import {
  TeacherAssignment,
  Student,
  ClassAcademicInsights,
  ClassAttendanceInsights,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Users,
  GraduationCap,
  Trophy,
  Award,
  TrendingUp,
  UserCheck,
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';

function TeacherClassesContent() {
  const searchParams = useSearchParams();
  const classIdParam = searchParams.get('classId');
  const sectionIdParam = searchParams.get('sectionId');

  const { currentUser, currentSchool } = useAuth();
  const teacherId = currentUser?.teacher_id || 'tch-001';
  const schoolId = currentSchool?.id || 'sch-001';

  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [selectedAsgId, setSelectedAsgId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [academicInsights, setAcademicInsights] = useState<ClassAcademicInsights | null>(null);
  const [attendanceInsights, setAttendanceInsights] = useState<ClassAttendanceInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Active view inside class: 'roster' | 'academics' | 'attendance'
  const [classTab, setClassTab] = useState<'roster' | 'academics' | 'attendance'>('roster');

  useEffect(() => {
    async function loadAssignments() {
      setIsLoading(true);
      try {
        const list = await teacherService.getAssignments(schoolId, teacherId);
        setAssignments(list);

        let activeId = list[0]?.id || '';
        if (classIdParam && sectionIdParam) {
          const match = list.find((a) => a.class_id === classIdParam && a.section_id === sectionIdParam);
          if (match) activeId = match.id;
        }
        setSelectedAsgId(activeId);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAssignments();
  }, [schoolId, teacherId, classIdParam, sectionIdParam]);

  useEffect(() => {
    if (!selectedAsgId) return;

    async function loadRosterAndInsights() {
      setIsLoading(true);
      try {
        const asg = assignments.find((a) => a.id === selectedAsgId);
        if (asg) {
          const [allStudents, acad, att] = await Promise.all([
            studentService.getStudents(schoolId, {
              classId: asg.class_id,
              sectionId: asg.section_id,
            }),
            insightService.getClassAcademicInsights(schoolId, asg.class_id, asg.section_id),
            insightService.getClassAttendanceInsights(schoolId, asg.class_id, asg.section_id),
          ]);
          setStudents(allStudents);
          setAcademicInsights(acad);
          setAttendanceInsights(att);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadRosterAndInsights();
  }, [selectedAsgId, schoolId, assignments]);

  const activeAsg = assignments.find((a) => a.id === selectedAsgId);

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Classes & Academic Insights</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Student rosters, class toppers, subject averages, and attendance attention lists
          </p>
        </div>
      </div>

      {/* Class Selector Pills */}
      <div className="flex flex-wrap gap-2">
        {assignments.map((asg) => {
          const isSelected = asg.id === selectedAsgId;
          return (
            <button
              key={asg.id}
              onClick={() => setSelectedAsgId(asg.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {asg.class_name} ({asg.section_name}) • {asg.subject_name}
            </button>
          );
        })}
      </div>

      {activeAsg && (
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold w-fit">
          <button
            onClick={() => setClassTab('roster')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              classTab === 'roster'
                ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Enrolled Students ({students.length})</span>
          </button>
          <button
            onClick={() => setClassTab('academics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              classTab === 'academics'
                ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Class Academic Insights & Toppers</span>
          </button>
          <button
            onClick={() => setClassTab('attendance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              classTab === 'attendance'
                ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Attendance & Attention List</span>
          </button>
        </div>
      )}

      {/* TAB 1: STUDENT ROSTER */}
      {classTab === 'roster' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {activeAsg?.class_name} ({activeAsg?.section_name}) • {activeAsg?.subject_name} — Student List ({students.length})
              </h3>
            </div>
          </div>

          {isLoading ? (
            <div className="p-5">
              <TableSkeleton rows={5} cols={4} />
            </div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No students enrolled in this section yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3 w-20">Roll No</th>
                    <th className="px-5 py-3">Student Full Name</th>
                    <th className="px-5 py-3">Registration Number</th>
                    <th className="px-5 py-3">Gender</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {st.current_enrollment?.roll_number || '—'}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {st.first_name} {st.last_name}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-indigo-600 font-medium">
                        {st.registration_number}
                      </td>
                      <td className="px-5 py-3.5 capitalize text-slate-500">{st.gender || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACADEMIC INSIGHTS */}
      {classTab === 'academics' && academicInsights && (
        <div className="space-y-6">
          {/* Top Performers / Toppers Card */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200 rounded-2xl p-6 shadow-2xs">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-amber-950 uppercase tracking-wider">
                Class Academic Topper{academicInsights.toppers.length > 1 ? 's (Joint Top Performers)' : ''}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {academicInsights.toppers.map((topper) => (
                <div
                  key={topper.student_id}
                  className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-2xs flex items-center gap-4"
                >
                  {topper.photo_url ? (
                    <img
                      src={topper.photo_url}
                      alt={topper.student_name}
                      className="w-14 h-14 rounded-xl object-cover border-2 border-amber-300"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center text-lg">
                      {topper.student_name[0]}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                        Rank #{topper.rank}
                      </span>
                      {topper.is_joint && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                          Joint
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{topper.student_name}</h4>
                    <p className="text-xs text-slate-500 font-mono">Roll #{topper.roll_number || '1'}</p>
                    <span className="text-sm font-extrabold text-amber-700 block mt-0.5">
                      {topper.average_percentage}% Normalized
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-amber-800/80 mt-3 font-medium">
              * Calculated strictly across published exam results. Normalized across subjects.
            </p>
          </div>

          {/* Class Average & Subject Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" /> Overall Class Average
              </h4>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-extrabold text-indigo-900">{academicInsights.class_average_pct}%</span>
                <span className="text-xs text-slate-500 font-medium">Across all evaluated subjects</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" /> Subject-wise Averages
              </h4>
              <div className="space-y-2 text-xs">
                {academicInsights.subject_averages.map((sub) => (
                  <div key={sub.subject_id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <span className="font-semibold text-slate-800">{sub.subject_name}</span>
                    <span className="font-bold text-indigo-700">{sub.average_pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE INSIGHTS */}
      {classTab === 'attendance' && attendanceInsights && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Perfect Attendance Card */}
            <div className="bg-white p-6 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-bold text-emerald-950 uppercase tracking-wider">
                  Perfect Attendance (100%)
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                Students present on all scheduled working days (excluding school holidays and approved leave)
              </p>

              <div className="space-y-2">
                {attendanceInsights.perfect_attendance_students.map((st) => (
                  <div
                    key={st.student_id}
                    className="p-3 bg-white rounded-xl border border-emerald-100 flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{st.student_name}</span>
                      <span className="text-[10px] font-mono text-slate-400">Roll #{st.roll_number || '—'}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      100% Present
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Needs Attendance Attention */}
            <div className="bg-white p-6 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h4 className="text-sm font-bold text-rose-950 uppercase tracking-wider">
                  Needs Attendance Attention
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                Students with &lt; 75% monthly attendance or 3+ consecutive working-day absences
              </p>

              <div className="space-y-2">
                {attendanceInsights.needs_attention_students.map((st) => (
                  <div
                    key={st.student_id}
                    className="p-3 bg-white rounded-xl border border-rose-100 flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{st.student_name}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Roll #{st.roll_number || '—'} • {st.consecutive_absent_days} Consecutive Absences
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-rose-700 block">{st.attendance_pct}%</span>
                      <span className="text-[9px] text-rose-500 font-bold uppercase">Attention</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeacherClassesPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={5} cols={4} />}>
      <TeacherClassesContent />
    </Suspense>
  );
}
