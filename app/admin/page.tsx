'use client';

// ============================================================================
// School Admin Executive Dashboard (With Attendance Concerns & Academic Topper Highlights)
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import {
  studentService,
  teacherService,
  feeService,
  attendanceService,
  noticeService,
  leaveService,
  insightService,
  followUpService,
} from '@/lib/services/api';
import {
  Student,
  Teacher,
  StudentPayment,
  Notice,
  StudentLeave,
  AttendanceConcern,
  ClassAcademicInsights,
  StudentFollowUp,
} from '@/lib/types';
import { StatsCard } from '@/components/ui/stats-card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import {
  GraduationCap,
  Users,
  IndianRupee,
  CalendarCheck,
  Bell,
  Clock,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  Phone,
  MessageSquare,
} from 'lucide-react';
import { CardSkeleton } from '@/components/ui/skeleton';
import { SchoolStatusBoard } from '@/components/school/school-status-board';

export default function AdminDashboardPage() {
  const { currentSchool } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const { success, error: toastError } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [recentPayments, setRecentPayments] = useState<StudentPayment[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [activeLeaves, setActiveLeaves] = useState<StudentLeave[]>([]);
  const [attendanceConcerns, setAttendanceConcerns] = useState<AttendanceConcern[]>([]);
  const [academicHighlights, setAcademicHighlights] = useState<ClassAcademicInsights | null>(null);

  const [attendanceSummary, setAttendanceSummary] = useState<{
    totalPresent: number;
    totalAbsent: number;
    totalLeave: number;
    totalStudents: number;
    attendancePercentage: number;
    byClass: { class_name: string; total: number; present: number; absent: number; leave: number }[];
  } | null>(null);

  const [feeSummary, setFeeSummary] = useState<{
    expected: number;
    collected: number;
    pending: number;
    overdue: number;
  }>({
    expected: 0,
    collected: 0,
    pending: 0,
    overdue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Follow-up modal state
  const [selectedConcernForFollowup, setSelectedConcernForFollowup] = useState<AttendanceConcern | null>(null);
  const [followupNote, setFollowupNote] = useState('');
  const [followupMethod, setFollowupMethod] = useState<StudentFollowUp['contact_method']>('call');
  const [contactedPerson, setContactedPerson] = useState('');
  const [nextFollowupDate, setNextFollowupDate] = useState('');
  const [isSubmittingFollowup, setIsSubmittingFollowup] = useState(false);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      const [stdList, tchList, fSummary, invoices, attSummary, noticeList, leavesList, concerns, acadHigh] =
        await Promise.all([
          studentService.getStudents(schoolId),
          teacherService.getTeachers(schoolId),
          feeService.getFeeSummary(schoolId, '2026-08'),
          feeService.getInvoices(schoolId),
          attendanceService.getTodayAttendanceSummary(schoolId),
          noticeService.getNotices(schoolId, { includeExpired: false }),
          leaveService.getLeaves(schoolId, { activeOnDate: todayStr }),
          insightService.getAttendanceConcerns(schoolId),
          insightService.getClassAcademicInsights(schoolId, 'cls-08'),
        ]);

      setStudents(stdList);
      setTeachers(tchList);
      setFeeSummary(fSummary);
      setAttendanceSummary(attSummary);
      setNotices(noticeList.slice(0, 3));
      setActiveLeaves(leavesList.slice(0, 4));
      setAttendanceConcerns(concerns);
      setAcademicHighlights(acadHigh);

      // Extract recent payments from invoices
      const allPayments: StudentPayment[] = [];
      invoices.forEach((inv) => {
        if (inv.payments) allPayments.push(...inv.payments);
      });
      setRecentPayments(allPayments.slice(0, 4));
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [schoolId]);

  const handleOpenFollowUpModal = (concern: AttendanceConcern) => {
    setSelectedConcernForFollowup(concern);
    setContactedPerson(concern.parent_name || 'Parent');
    setFollowupNote('');
    setFollowupMethod('call');
    setNextFollowupDate('');
  };

  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConcernForFollowup || !followupNote.trim()) {
      toastError('Please enter a follow-up note');
      return;
    }

    setIsSubmittingFollowup(true);
    try {
      await followUpService.createFollowUp({
        school_id: schoolId,
        student_id: selectedConcernForFollowup.student_id,
        type: 'attendance',
        note: followupNote.trim(),
        contact_method: followupMethod,
        contacted_person_name: contactedPerson.trim(),
        next_follow_up_at: nextFollowupDate || undefined,
        status: 'in_progress',
        created_by: 'usr-admin-01',
        created_by_name: 'School Administrator',
      });

      success(`Follow-up saved for ${selectedConcernForFollowup.student_name}`);
      setSelectedConcernForFollowup(null);
      loadDashboard();
    } catch {
      toastError('Failed to record follow-up');
    } finally {
      setIsSubmittingFollowup(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {currentSchool?.name || 'School Dashboard'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Academic Year 2026-27
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/students">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Add Student
            </Button>
          </Link>
          <Link href="/admin/teachers">
            <Button variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Add Teacher
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="Enrolled Students"
          value={students.length.toString()}
          subtitle="Across all classes"
          icon={GraduationCap}
        />
        <StatsCard
          title="Faculty & Teachers"
          value={teachers.length.toString()}
          subtitle="Full-time staff"
          icon={Users}
        />
        <StatsCard
          title="August Fee Collection"
          value={formatCurrency(feeSummary.collected)}
          subtitle={`of ${formatCurrency(feeSummary.expected)} expected`}
          icon={IndianRupee}
          accentColor="emerald"
        />
        <StatsCard
          title="Today's Attendance"
          value={
            attendanceSummary && attendanceSummary.totalStudents > 0
              ? `${attendanceSummary.attendancePercentage}%`
              : '0%'
          }
          subtitle={`${attendanceSummary?.totalPresent || 0} of ${attendanceSummary?.totalStudents || 0} Present`}
          icon={CalendarCheck}
        />
      </div>

      {/* ATTENDANCE CONCERNS ALERT BANNER */}
      {attendanceConcerns.length > 0 && (
        <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <div>
                <h3 className="text-sm font-bold text-rose-950 uppercase tracking-wider">
                  Attendance Concerns ({attendanceConcerns.length} Flagged Students)
                </h3>
                <p className="text-[11px] text-rose-700 font-medium">
                  Students requiring immediate administrative check-in due to consecutive absences
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {attendanceConcerns.map((c) => (
              <div
                key={c.student_id}
                className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs flex flex-col justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{c.student_name}</h4>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {c.class_name} ({c.section_name}) • Reg #{c.registration_number}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        c.level === 'critical'
                          ? 'bg-rose-600 text-white'
                          : c.level === 'concern'
                          ? 'bg-amber-500 text-white'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {c.level}
                    </span>
                  </div>

                  <div className="mt-2.5 p-2.5 rounded-lg bg-rose-50/70 border border-rose-100 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Consecutive Days Absent:</span>
                      <strong className="text-rose-700">{c.consecutive_absent_days} Working Days</strong>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Last Present:</span>
                      <span className="font-medium text-slate-700">{c.last_present_date}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Parent / Guardian:</span>
                      <span className="font-medium text-slate-700">{c.parent_name}</span>
                    </div>
                  </div>

                  {c.latest_follow_up && (
                    <div className="mt-2 text-[11px] p-2 bg-slate-50 rounded border border-slate-200 text-slate-600">
                      <span className="font-bold text-indigo-700 block">Latest Teacher Note:</span>
                      {c.latest_follow_up.note}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={`tel:${c.parent_phone}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Parent</span>
                  </a>

                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleOpenFollowUpModal(c)}
                    leftIcon={<MessageSquare className="w-3 h-3 text-indigo-600" />}
                  >
                    + Add Follow-up
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Class Attendance & Academic Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Attendance Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Today&apos;s Class Attendance</h3>
            </div>
            <Link href="/admin/attendance" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              Details <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 flex-1 space-y-3">
            {attendanceSummary?.byClass && attendanceSummary.byClass.length > 0 && attendanceSummary.totalStudents > 0 ? (
              attendanceSummary.byClass.map((cls) => {
                const pct = cls.total > 0 ? Math.round((cls.present / cls.total) * 100) : 0;
                return (
                  <div key={cls.class_name} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50">
                    <div>
                      <span className="font-bold text-slate-900">{cls.class_name}</span>
                      <p className="text-[11px] text-slate-400">
                        {cls.present} present • {cls.absent} absent • {cls.leave} leave
                      </p>
                    </div>
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      {pct}%
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">No attendance roll-calls recorded today</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Classes will show attendance progress once roll-call begins.</p>
              </div>
            )}
          </div>
        </div>

        {/* Live School Operational Status Board (OPEN / CLOSED / HOLIDAY) */}
        <SchoolStatusBoard />
      </div>

      {/* FOLLOW-UP MODAL */}
      {selectedConcernForFollowup && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedConcernForFollowup(null)}
          title={`Log Attendance Follow-up: ${selectedConcernForFollowup.student_name}`}
          description="Record parent communication details and next scheduled check-in"
        >
          <form onSubmit={handleSaveFollowUp} className="space-y-4 text-xs text-left">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Method *</label>
                <select
                  value={followupMethod}
                  onChange={(e) => setFollowupMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-bold capitalize"
                >
                  <option value="call">Phone Call</option>
                  <option value="message">SMS / WhatsApp</option>
                  <option value="in_person">In-Person Meeting</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <Input
                label="Contacted Person Name *"
                required
                value={contactedPerson}
                onChange={(e) => setContactedPerson(e.target.value)}
                placeholder="e.g. Rajesh Kumar (Father)"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Follow-up Discussion Notes *</label>
              <textarea
                required
                rows={3}
                value={followupNote}
                onChange={(e) => setFollowupNote(e.target.value)}
                placeholder="e.g. Discussed long absence with parent; confirmed medical leave."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>

            <Input
              label="Next Follow-up Date (Optional)"
              type="date"
              value={nextFollowupDate}
              onChange={(e) => setNextFollowupDate(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedConcernForFollowup(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingFollowup}>
                Save Follow-up Record
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
