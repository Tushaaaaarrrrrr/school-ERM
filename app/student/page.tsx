'use client';

// ============================================================================
// Student Home Dashboard (Full-Width Responsive Bento Redesign via Stitch)
// Engineered for 13", 14", 15", 16" Laptops and All Display Form Factors
// ============================================================================

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import {
  studentService,
  timetableService,
  feeService,
  examService,
  noticeService,
  leaveService,
  attendanceService,
  transportService,
} from '@/lib/services/api';
import {
  Student,
  TimetableEntry,
  StudentFeeInvoice,
  Exam,
  ExamResult,
  Notice,
  StudentLeave,
  StudentAttendance,
  StudentTransportAssignment,
  StudentTransportEvent,
  Vehicle,
} from '@/lib/types';
import { InvoiceStatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatTime, formatDate, formatPercentage } from '@/lib/utils/formatters';
import {
  IndianRupee,
  Award,
  Clock,
  Sparkles,
  Bell,
  CalendarCheck,
  CalendarDays,
  Palmtree,
  ArrowRight,
  Bus,
  MapPin,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BookOpen,
  FileText,
  UploadCloud,
  Check,
  Shield,
  PhoneCall,
  Download,
  Flame,
} from 'lucide-react';
import { CardSkeleton } from '@/components/ui/skeleton';
import { SchoolStatusBoard } from '@/components/school/school-status-board';

interface AssignmentItem {
  id: string;
  title: string;
  subject: string;
  teacher: string;
  dueDate: string;
  urgency: 'urgent' | 'upcoming' | 'completed' | 'graded';
  status: 'pending' | 'submitted' | 'graded';
  score?: string;
  feedback?: string;
}

export default function StudentDashboardPage() {
  const { currentUser, currentSchool, currentYear } = useAuth();
  const studentId = currentUser?.student_id || currentUser?.id || 'std-001';
  const schoolId = currentSchool?.id || 'sch-001';

  const [student, setStudent] = useState<Student | null>(null);
  const [todayClasses, setTodayClasses] = useState<TimetableEntry[]>([]);
  const [latestInvoice, setLatestInvoice] = useState<StudentFeeInvoice | null>(null);
  const [recentResults, setRecentResults] = useState<{ exam: Exam; result: ExamResult }[]>([]);
  const [activeLeave, setActiveLeave] = useState<StudentLeave | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [attendancePercentage, setAttendancePercentage] = useState<number>(94);
  const [transportAssignment, setTransportAssignment] = useState<StudentTransportAssignment | null>(null);
  const [transportVehicle, setTransportVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Homework Filter Tab State
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');

  // Academic Assignments List
  const assignments: AssignmentItem[] = useMemo(
    () => [
      {
        id: 'asg-1',
        title: 'Optics & Light Refraction Lab Report',
        subject: 'Science (Physics)',
        teacher: 'Mrs. Anita Roy',
        dueDate: 'Today, 5:00 PM',
        urgency: 'urgent',
        status: 'pending',
      },
      {
        id: 'asg-2',
        title: 'Problem Set 5.2 — Quadratic Factoring',
        subject: 'Mathematics',
        teacher: 'Mr. David Miller',
        dueDate: 'Tomorrow, 9:00 AM',
        urgency: 'upcoming',
        status: 'pending',
      },
      {
        id: 'asg-3',
        title: 'Critical Essay: Shakespeare\'s The Tempest',
        subject: 'English Literature',
        teacher: 'Mrs. Clara Vance',
        dueDate: 'Submitted 2 days ago',
        urgency: 'graded',
        status: 'graded',
        score: '28 / 30 (Grade A+)',
        feedback: 'Exceptional character analysis and textual citations.',
      },
      {
        id: 'asg-4',
        title: 'World Geography: Major Ocean Currents & Map Plot',
        subject: 'Social Studies',
        teacher: 'Ms. Kapoor',
        dueDate: 'Yesterday, 4:00 PM',
        urgency: 'completed',
        status: 'submitted',
      },
    ],
    []
  );

  useEffect(() => {
    async function loadStudentData() {
      setIsLoading(true);
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const dayOfWeek = new Date().getDay() || 1;

        const [std, ttList, invList, resList, activeLv, noticeList, attList, transStatus, vehicles] = await Promise.all([
          studentService.getStudentById(studentId),
          timetableService.getTimetable(schoolId, { classId: 'cls-08', sectionId: 'sec-8a', dayOfWeek }),
          feeService.getInvoices(schoolId, { studentId }),
          examService.getPublishedResultsForStudent(studentId),
          leaveService.getActiveLeaveForStudent(studentId, todayStr),
          noticeService.getNotices(schoolId, { audience: 'students', includeExpired: false }),
          attendanceService.getAttendance(schoolId, { studentId }),
          transportService.getStudentTodayTransportStatus(studentId, todayStr).catch(() => ({ assignment: null, todayEvent: null })),
          transportService.getVehicles(schoolId).catch(() => []),
        ]);

        setStudent(std);
        setTodayClasses(ttList);
        setLatestInvoice(invList[0] || null);
        setRecentResults(resList.slice(0, 4));
        setActiveLeave(activeLv || std?.active_leave || null);
        setNotices(noticeList.slice(0, 3));
        setAttendance(attList);

        if (transStatus.assignment) {
          setTransportAssignment(transStatus.assignment);
          if (transStatus.assignment.vehicle_id) {
            const v = vehicles.find((item) => item.id === transStatus.assignment?.vehicle_id) || null;
            setTransportVehicle(v);
          }
        }

        if (attList.length > 0) {
          const present = attList.filter((a) => a.status === 'present').length;
          const workingDays = attList.filter((a) => a.status !== 'leave').length || 1;
          const pct = Math.round((present / workingDays) * 100);
          setAttendancePercentage(pct);
        }
      } catch (err) {
        console.error('Error loading student dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStudentData();
  }, [schoolId, studentId]);

  // Attendance metrics
  const presentCount = attendance.filter((a) => a.status === 'present').length || 18;
  const absentCount = attendance.filter((a) => a.status === 'absent').length || 1;
  const leaveCount = attendance.filter((a) => a.status === 'leave').length || (activeLeave ? 1 : 0);

  // Filtered tasks
  const filteredAssignments = useMemo(() => {
    if (taskFilter === 'all') return assignments;
    if (taskFilter === 'pending') return assignments.filter((a) => a.status === 'pending');
    if (taskFilter === 'submitted') return assignments.filter((a) => a.status === 'submitted');
    if (taskFilter === 'graded') return assignments.filter((a) => a.status === 'graded');
    return assignments;
  }, [assignments, taskFilter]);

  // Determine current active/live period based on index or time
  const currentPeriodIndex = 1; // 2nd period in demo

  return (
    <div className="space-y-6 text-left w-full">
      {/* ==================================================================== */}
      {/* 1. STUDENT BENTO HERO GREETING BANNER (Full Page Responsive)         */}
      {/* ==================================================================== */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-sm">
        {/* Ambient atmospheric lighting discs */}
        <div className="absolute -right-12 -bottom-12 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute right-48 -top-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Academic Session {currentYear?.name || '2026–27'} • Term 2</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Hello, {student?.first_name || currentUser?.name?.split(' ')[0] || 'Rahul'}! 👋
            </h1>

            <p className="text-xs sm:text-sm text-indigo-100/90 max-w-2xl leading-relaxed">
              Welcome back to your academic dashboard. You have{' '}
              <span className="font-semibold text-white underline decoration-amber-400 underline-offset-4">
                {todayClasses.length > 0 ? `${todayClasses.length} classes scheduled today` : 'regular classes'}
              </span>{' '}
              and your monthly attendance compliance stands at{' '}
              <span className="font-semibold text-emerald-300 underline decoration-emerald-400 underline-offset-4">
                {attendancePercentage}% Present
              </span>
              .
            </p>

            {/* Quick Badges Pill Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white font-medium">
                {student?.current_enrollment?.class_name || 'Class 8'} — Section{' '}
                {student?.current_enrollment?.section_name || 'A'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white font-medium">
                Roll No: <strong className="text-white">{student?.current_enrollment?.roll_number || '12'}</strong>
              </span>
              <span className="px-3 py-1 rounded-full bg-indigo-900/50 border border-indigo-400/30 text-indigo-200 font-mono">
                Reg: {student?.registration_number || 'SIS2-2'}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 flex items-center gap-1.5 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Scholar
              </span>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <Link href="/student/results">
              <Button
                variant="primary"
                size="sm"
                className="bg-white text-indigo-900 hover:bg-slate-100 font-bold border-0 shadow-sm"
                leftIcon={<Award className="w-4 h-4 text-indigo-600" />}
              >
                Report Cards
              </Button>
            </Link>
            <Link href="/student/classes">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/15 hover:bg-white/25 border-white/30 text-white font-semibold backdrop-blur-xs"
                leftIcon={<CalendarDays className="w-4 h-4" />}
              >
                Timetable
              </Button>
            </Link>
            <Link href="/student/profile">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/15 hover:bg-white/25 border-white/30 text-white font-semibold backdrop-blur-xs"
                leftIcon={<CalendarCheck className="w-4 h-4" />}
              >
                Attendance
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. OPERATIONAL STATUS & ACTIVE LEAVE ALERTS                          */}
      {/* ==================================================================== */}
      <SchoolStatusBoard />

      {activeLeave && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3.5 text-xs shadow-2xs">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <strong className="font-bold text-sm text-amber-950">APPROVED LEAVE IN EFFECT</strong>
              <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-bold">
                Official Leave
              </span>
            </div>
            <p className="text-amber-800">
              {formatDate(activeLeave.start_date)} to {formatDate(activeLeave.end_date)} • Reason:{' '}
              <span className="font-medium text-amber-950">{activeLeave.reason}</span>
            </p>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. MAIN BENTO GRID (8 cols Left / 4 cols Right across all laptops)  */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        {/* ================================================================== */}
        {/* LEFT / PRIMARY COLUMN: 8 Columns                                  */}
        {/* ================================================================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Today's Class Schedule & Live Timetable */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-slate-900">Today's Class Schedule</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Class Day
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time period progression, teacher details, and room assignments
                </p>
              </div>

              <Link
                href="/student/classes"
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors self-start sm:self-auto"
              >
                <span>Full Timetable</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3 py-2">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : todayClasses.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <CalendarDays className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No periods scheduled for today.</p>
                <p className="text-[11px] text-slate-400">Enjoy your study break or review past lessons.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayClasses.map((item, idx) => {
                  const isCurrent = idx === currentPeriodIndex;
                  const isCompleted = idx < currentPeriodIndex;

                  return (
                    <div
                      key={item.id}
                      className={`relative overflow-hidden rounded-xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
                        isCurrent
                          ? 'border-2 border-indigo-600 bg-indigo-50/40 shadow-xs'
                          : isCompleted
                          ? 'border-slate-200/70 bg-slate-50/60 opacity-80 hover:opacity-100'
                          : 'border-slate-200 bg-white hover:border-indigo-200'
                      }`}
                    >
                      {isCurrent && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600" />
                      )}

                      <div className="flex items-center gap-3.5 pl-1">
                        <div className="w-12 text-center shrink-0">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isCurrent
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-200/80 text-slate-700'
                            }`}
                          >
                            P{idx + 1}
                          </span>
                          <span className="block font-mono text-[11px] font-bold text-slate-800 mt-1">
                            {formatTime(item.start_time)}
                          </span>
                        </div>

                        <div className="w-px h-8 bg-slate-200 hidden sm:block" />

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{item.subject_name}</span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-2xs animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                LIVE NOW
                              </span>
                            )}
                            {isCompleted && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            Teacher: <span className="font-medium text-slate-700">{item.teacher_name}</span>
                            {item.room && (
                              <span> • Room {item.room}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center pl-16 sm:pl-0">
                        {isCurrent ? (
                          <Link href="/student/classes">
                            <Button size="xs" variant="primary" className="text-xs">
                              Classroom Notes
                            </Button>
                          </Link>
                        ) : isCompleted ? (
                          <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            Concluded
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            Upcoming
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card 2: Recent Published Exam Results */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <Award className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-slate-900">Recent Exam Results</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-semibold">
                    Term Assessment
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official published scores certified by Academic Examination Cell
                </p>
              </div>

              <Link
                href="/student/results"
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors self-start sm:self-auto"
              >
                <span>All Results</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Performance Highlights Banner */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-indigo-50/40 border border-emerald-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <span className="font-bold text-emerald-950 block">High Academic Standing</span>
                  <span className="text-emerald-800 text-[11px]">
                    Consistent performance with 90%+ in major STEM & humanities subjects
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] hidden md:inline">
                Top Percentile
              </span>
            </div>

            {recentResults.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <Award className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No published results available yet.</p>
                <p className="text-[11px] text-slate-400">Scores will appear here once officially released by teachers.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {recentResults.map(({ exam, result }) => {
                  const pct = Math.round(((result.marks_obtained || 0) / (exam.max_marks || 100)) * 100);
                  const isTopScore = pct >= 90;

                  return (
                    <div
                      key={result.id}
                      className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-indigo-300 transition-all space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-900 block truncate max-w-[160px]">
                            {exam.subject_name}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate max-w-[160px]">
                            {exam.name}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                            isTopScore
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                          }`}
                        >
                          {pct}% ({pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : 'Pass'})
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between pt-1">
                        <div className="text-lg font-extrabold text-indigo-700">
                          {result.marks_obtained}{' '}
                          <span className="text-xs font-normal text-slate-400">/ {exam.max_marks}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatDate(exam.exam_date)}
                        </span>
                      </div>

                      {/* Score Progress Bar */}
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            isTopScore ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card 3: Assignments & Tasks Tracker */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-slate-900">Assignments & Tasks</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track upcoming homework, project submissions, and teacher feedback
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
                {(['all', 'pending', 'submitted', 'graded'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setTaskFilter(tab)}
                    className={`px-3 py-1 rounded-lg capitalize transition-all ${
                      taskFilter === tab
                        ? 'bg-white text-indigo-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredAssignments.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition-all ${
                    task.urgency === 'urgent'
                      ? 'border-amber-300 bg-amber-50/30'
                      : task.urgency === 'graded'
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                        task.urgency === 'urgent'
                          ? 'bg-amber-100 text-amber-900'
                          : task.urgency === 'graded'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      <BookOpen className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900">{task.title}</span>
                        {task.urgency === 'urgent' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-700" />
                            {task.dueDate}
                          </span>
                        )}
                        {task.urgency === 'graded' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-700" />
                            {task.score}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500">
                        {task.subject} • Assigned by <span className="font-medium text-slate-700">{task.teacher}</span>
                      </p>

                      {task.feedback && (
                        <p className="text-[11px] text-emerald-800 italic pt-0.5">
                          "{task.feedback}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-13 md:pl-0 shrink-0">
                    {task.status === 'pending' ? (
                      <Button
                        size="xs"
                        variant="primary"
                        className="text-xs font-semibold"
                        leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
                      >
                        Submit Work
                      </Button>
                    ) : (
                      <Button size="xs" variant="outline" className="text-xs font-medium">
                        View Details
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* RIGHT COLUMN: 4 Columns (Health, Transport, Fees, Notices)         */}
        {/* ================================================================== */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Attendance Health & Compliance */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Attendance Health</h3>
              </div>
              <Link href="/student/profile" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                Details →
              </Link>
            </div>

            {/* Circular Progress Gauge */}
            <div className="py-2 flex flex-col items-center justify-center">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" fill="transparent" r="40" stroke="#f1f5f9" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="#10b981"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * attendancePercentage) / 100}
                    strokeLinecap="round"
                    strokeWidth="8"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    {attendancePercentage}%
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                    Present
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Metrics Mini Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <span className="block text-emerald-800 text-[10px] font-bold uppercase">Present</span>
                <span className="text-base font-extrabold text-emerald-700 mt-0.5 block">{presentCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
                <span className="block text-rose-800 text-[10px] font-bold uppercase">Absent</span>
                <span className="text-base font-extrabold text-rose-700 mt-0.5 block">{absentCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                <span className="block text-amber-800 text-[10px] font-bold uppercase">Leaves</span>
                <span className="text-base font-extrabold text-amber-700 mt-0.5 block">{leaveCount}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Mandated compliance: 75% • In good academic standing
            </p>
          </div>

          {/* Card 2: Live Bus Transport Tracker */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bus className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Transit & Bus Fleet</h3>
              </div>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                Fleet Active
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50/60 to-slate-50 border border-amber-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                    Assigned Vehicle
                  </span>
                  <div className="font-extrabold text-slate-900 text-sm">
                    {transportVehicle?.vehicle_name || transportAssignment?.vehicle_name || 'School Bus #14'}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono block">
                    {transportVehicle?.vehicle_number || transportAssignment?.vehicle_number || 'KA-04-E-8821'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Pickup Time</span>
                  <span className="text-sm font-mono font-extrabold text-indigo-700">
                    {formatTime(transportAssignment?.estimated_pickup_time || '07:20 AM')}
                  </span>
                </div>
              </div>

              {/* Route stop node */}
              <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                  <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="font-medium truncate">
                    {transportAssignment?.stop_name || 'Maple Avenue Stop #3'}
                  </span>
                </div>
                <Link
                  href="/student/transport"
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 underline"
                >
                  Track Bus
                </Link>
              </div>
            </div>
          </div>

          {/* Card 3: Fee Status & Dues */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Fee Status & Invoices</h3>
              </div>
              <Link href="/student/fees" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                Receipts →
              </Link>
            </div>

            {latestInvoice ? (
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-700">
                    {latestInvoice.billing_month} Tuition
                  </span>
                  <InvoiceStatusBadge status={latestInvoice.status} />
                </div>

                <div className="text-2xl font-black text-slate-950">
                  {formatCurrency(latestInvoice.final_amount)}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/70">
                  <span>Due Date: {formatDate(latestInvoice.due_date)}</span>
                  <span className="font-medium text-emerald-700">
                    Paid: {formatCurrency(latestInvoice.paid_amount || 0)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-slate-400 text-xs">
                All fees up to date. No pending dues.
              </div>
            )}

            <Link href="/student/fees" className="block">
              <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                View Official Receipts & Statements
              </Button>
            </Link>
          </div>

          {/* Card 4: School Notices */}
          {notices.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Bell className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">School Notices</h3>
              </div>

              <div className="space-y-3">
                {notices.map((n) => (
                  <div
                    key={n.id}
                    className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5 text-xs hover:bg-white hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 truncate max-w-[200px]">{n.title}</h4>
                      <span className="text-[10px] text-slate-400">{formatDate(n.starts_at)}</span>
                    </div>
                    <p className="text-slate-600 line-clamp-2 leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
