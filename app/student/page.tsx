'use client';

// ============================================================================
// Student Home Dashboard (Minimal, Clean & Student-Centric)
// ============================================================================

import React, { useEffect, useState } from 'react';
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
  Palmtree,
  ArrowRight,
} from 'lucide-react';
import { CardSkeleton } from '@/components/ui/skeleton';
import { SchoolStatusBoard } from '@/components/school/school-status-board';

export default function StudentDashboardPage() {
  const { currentUser, currentSchool } = useAuth();
  const studentId = currentUser?.student_id || 'std-001';
  const schoolId = currentSchool?.id || 'sch-001';

  const [student, setStudent] = useState<Student | null>(null);
  const [todayClasses, setTodayClasses] = useState<TimetableEntry[]>([]);
  const [latestInvoice, setLatestInvoice] = useState<StudentFeeInvoice | null>(null);
  const [recentResults, setRecentResults] = useState<{ exam: Exam; result: ExamResult }[]>([]);
  const [activeLeave, setActiveLeave] = useState<StudentLeave | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [attendancePercentage, setAttendancePercentage] = useState<number>(92);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStudentData() {
      setIsLoading(true);
      try {
        const todayStr = new Date().toISOString().split('T')[0];

        const [std, ttList, invList, resList, activeLv, noticeList, attList] = await Promise.all([
          studentService.getStudentById(studentId),
          timetableService.getTimetable(schoolId, { classId: 'cls-08', sectionId: 'sec-8a', dayOfWeek: 1 }),
          feeService.getInvoices(schoolId, { studentId }),
          examService.getPublishedResultsForStudent(studentId),
          leaveService.getActiveLeaveForStudent(studentId, todayStr),
          noticeService.getNotices(schoolId, { audience: 'students', includeExpired: false }),
          attendanceService.getAttendance(schoolId, { studentId }),
        ]);

        setStudent(std);
        setTodayClasses(ttList);
        setLatestInvoice(invList[0] || null);
        setRecentResults(resList.slice(0, 3));
        setActiveLeave(activeLv || std?.active_leave || null);
        setNotices(noticeList.slice(0, 2));

        if (attList.length > 0) {
          const present = attList.filter((a) => a.status === 'present').length;
          const workingDays = attList.filter((a) => a.status !== 'leave').length || 1;
          const pct = Math.round((present / workingDays) * 100);
          setAttendancePercentage(pct);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStudentData();
  }, [schoolId, studentId]);

  return (
    <div className="space-y-6 text-left w-full">
      {/* Student Greeting Card */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Student Portal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Hello, {currentUser?.name?.split(' ')[0] || student?.first_name || 'Rahul'} 👋
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">
          {student?.current_enrollment?.class_name || '—'} • Section{' '}
          {student?.current_enrollment?.section_name || '—'} • Roll No.{' '}
          <strong className="text-white font-bold">{student?.current_enrollment?.roll_number || '12'}</strong>
        </p>
      </div>

      {/* Live School Operational Status Board */}
      <SchoolStatusBoard />

      {/* Active Leave Banner */}
      {activeLeave && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-sm block">ON APPROVED LEAVE</strong>
            <span>
              {formatDate(activeLeave.start_date)} to {formatDate(activeLeave.end_date)} — Reason: {activeLeave.reason}
            </span>
          </div>
        </div>
      )}

      {/* Today's Classes & Current Fee Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Classes */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Today's Classes</h3>
            </div>
            <Link href="/student/classes" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Timetable →
            </Link>
          </div>

          {isLoading ? (
            <CardSkeleton />
          ) : todayClasses.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No periods scheduled for today.</p>
          ) : (
            <div className="space-y-2.5">
              {todayClasses.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">{item.subject_name}</span>
                    <p className="text-[11px] text-slate-500">{item.teacher_name}</p>
                  </div>
                  <span className="font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {formatTime(item.start_time)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Fee & Attendance Stats */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Attendance & Fee Status</h3>
              </div>
              <Link href="/student/profile" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                Attendance →
              </Link>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/70 border border-emerald-100 text-xs">
              <span className="font-semibold text-emerald-900">This Month Attendance</span>
              <strong className="text-emerald-700 font-extrabold text-sm">{attendancePercentage}% Present</strong>
            </div>

            {latestInvoice ? (
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">{latestInvoice.billing_month} Tuition</span>
                  <InvoiceStatusBadge status={latestInvoice.status} />
                </div>
                <div className="text-xl font-bold text-slate-900">
                  {formatCurrency(latestInvoice.final_amount)}
                </div>
                <p className="text-[11px] text-slate-500">
                  Due date: {formatDate(latestInvoice.due_date)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-2">No active invoices.</p>
            )}
          </div>

          <Link href="/student/fees">
            <Button variant="outline" size="sm" className="w-full">
              View Receipts & Statements
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Exam Results */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Recent Exam Results</h3>
          </div>
          <Link href="/student/results" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
            All Results →
          </Link>
        </div>

        {recentResults.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No official results published yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recentResults.map(({ exam, result }) => (
              <div key={result.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold text-slate-900">{exam.subject_name}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    {formatPercentage(result.marks_obtained || 0, exam.max_marks)}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{exam.name}</p>
                <div className="text-base font-extrabold text-indigo-600">
                  {result.marks_obtained} / {exam.max_marks}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* School Notices */}
      {notices.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Bell className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">School Notices</h3>
          </div>

          <div className="space-y-2.5">
            {notices.map((n) => (
              <div key={n.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                <p className="text-xs text-slate-600">{n.message}</p>
                <span className="text-[10px] text-slate-400 block pt-0.5">{formatDate(n.starts_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
