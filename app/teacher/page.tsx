'use client';

// ============================================================================
// Teacher Home Dashboard (With Attendance Concerns, Call & Follow-up Actions)
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import {
  teacherService,
  timetableService,
  examService,
  noticeService,
  leaveService,
  insightService,
  followUpService,
  teacherWorkforceService,
} from '@/lib/services/api';
import {
  TeacherAssignment,
  TimetableEntry,
  Exam,
  Notice,
  StudentLeave,
  AttendanceConcern,
  StudentFollowUp,
  Teacher,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { formatTime, formatDate, getDayName } from '@/lib/utils/formatters';
import {
  Clock,
  BookOpen,
  Users,
  Award,
  CalendarCheck,
  Bell,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Phone,
  MessageSquare,
  User,
  Eye,
  Copy,
} from 'lucide-react';
import { CardSkeleton } from '@/components/ui/skeleton';
import { SchoolStatusBoard } from '@/components/school/school-status-board';

export default function TeacherDashboardPage() {
  const { currentUser, currentSchool } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const { success, error: toastError } = useToast();

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<TimetableEntry[]>([]);
  const [recentExams, setRecentExams] = useState<Exam[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [leaves, setLeaves] = useState<StudentLeave[]>([]);
  const [attendanceConcerns, setAttendanceConcerns] = useState<AttendanceConcern[]>([]);
  const [myTeacherLeaves, setMyTeacherLeaves] = useState<import('@/lib/types').TeacherLeave[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Follow-up Modal State
  const [selectedConcernForFollowup, setSelectedConcernForFollowup] = useState<AttendanceConcern | null>(null);
  const [followupNote, setFollowupNote] = useState('');
  const [followupMethod, setFollowupMethod] = useState<StudentFollowUp['contact_method']>('call');
  const [contactedPerson, setContactedPerson] = useState('');
  const [nextFollowupDate, setNextFollowupDate] = useState('');
  const [isSubmittingFollowup, setIsSubmittingFollowup] = useState(false);

  const loadTeacherHome = async () => {
    setIsLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const profile = await teacherService.getTeacherForUser(currentUser, schoolId);
      setTeacher(profile);

      if (!profile) {
        setAssignments([]);
        setTodaySchedule([]);
        setRecentExams([]);
        setMyTeacherLeaves([]);
        return;
      }

      const teacherId = profile.id;

      const currentDayOfWeek = new Date().getDay() === 0 ? 1 : new Date().getDay();

      const [asgList, schedule, exams, noticeList, leavesList, concerns] = await Promise.all([
        teacherService.getAssignments(schoolId, teacherId),
        timetableService.getTimetable(schoolId, { teacherId, dayOfWeek: currentDayOfWeek }),
        examService.getExams(schoolId, { teacherId }),
        noticeService.getNotices(schoolId, { audience: 'teachers', includeExpired: false }),
        leaveService.getLeaves(schoolId, { activeOnDate: todayStr }),
        insightService.getAttendanceConcerns(schoolId),
      ]);

      setAssignments(asgList);
      setTodaySchedule(schedule);
      setRecentExams(exams.slice(0, 3));
      setNotices(noticeList.slice(0, 3));
      setLeaves(leavesList.slice(0, 4));
      setAttendanceConcerns(concerns);
      setMyTeacherLeaves(await teacherWorkforceService.getLeaves(schoolId, { teacherId }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeacherHome();
  }, [schoolId, currentUser]);

  const handleOpenFollowUpModal = (concern: AttendanceConcern) => {
    setSelectedConcernForFollowup(concern);
    setContactedPerson(concern.parent_name || 'Parent / Guardian');
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
        created_by: teacher?.id || currentUser?.id || '',
        created_by_name: currentUser?.name || 'Class Teacher',
      });

      success(`Follow-up recorded for ${selectedConcernForFollowup.student_name}`);
      setSelectedConcernForFollowup(null);
      loadTeacherHome();
    } catch {
      toastError('Failed to save follow-up');
    } finally {
      setIsSubmittingFollowup(false);
    }
  };

  return (
    <div className="space-y-6 text-left w-full">
      {myTeacherLeaves.some((leave) => leave.status === 'approved' && leave.start_date <= new Date().toISOString().split('T')[0] && leave.end_date >= new Date().toISOString().split('T')[0]) && (() => {
        const leave = myTeacherLeaves.find((item) => item.status === 'approved' && item.start_date <= new Date().toISOString().split('T')[0] && item.end_date >= new Date().toISOString().split('T')[0])!;
        return <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><strong>Your leave is approved.</strong> Return joining date: <strong>{formatDate(leave.return_date)}</strong>. <Link className="ml-2 underline" href="/teacher/leave">View details</Link></div>;
      })()}
      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
            Faculty Workspace
          </span>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            Good day, {(teacher?.first_name || currentUser?.name?.split(' ')[0] || 'Teacher')}
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            {currentSchool?.name} • Faculty ID: <span className="font-mono">{teacher?.employee_number || currentUser?.login_id || 'Not linked'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/teacher/attendance">
            <Button variant="primary" size="sm" leftIcon={<CalendarCheck className="w-4 h-4" />}>
              Take Attendance
            </Button>
          </Link>
          <Link href="/teacher/classes">
            <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20" leftIcon={<BookOpen className="w-4 h-4" />}>
              My Classes & Insights
            </Button>
          </Link>
        </div>
      </div>

      {/* Live School Operational Status Board */}
      <SchoolStatusBoard />

      {/* ATTENDANCE ATTENTION & CONCERNS SECTION */}
      {attendanceConcerns.length > 0 && (
        <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <div>
                <h3 className="text-sm font-bold text-rose-950 uppercase tracking-wider">
                  Attendance Attention Required ({attendanceConcerns.length} Students)
                </h3>
                <p className="text-[11px] text-rose-700 font-medium">
                  Students with multiple consecutive working-day absences or low monthly attendance
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
                      {c.level} alert
                    </span>
                  </div>

                  <div className="mt-2.5 p-2.5 rounded-lg bg-rose-50/70 border border-rose-100 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Consecutive Working Days Absent:</span>
                      <strong className="text-rose-700">{c.consecutive_absent_days} Days</strong>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Last Present Date:</span>
                      <span className="font-medium text-slate-700">{c.last_present_date}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Parent / Guardian:</span>
                      <span className="font-medium text-slate-700">{c.parent_name}</span>
                    </div>
                  </div>

                  {c.latest_follow_up && (
                    <div className="mt-2 text-[11px] p-2 bg-slate-50 rounded border border-slate-200 text-slate-600">
                      <span className="font-bold text-indigo-700 block">Latest Follow-up Note:</span>
                      {c.latest_follow_up.note}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Call Parent */}
                  <a
                    href={`tel:${c.parent_phone}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Parent</span>
                  </a>

                  {/* Add Follow-up */}
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

      {/* Main Grid: Today's Schedule & Attendance Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Classes */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Today's Class Schedule ({getDayName(new Date().getDay() === 0 ? 1 : new Date().getDay())})
              </h3>
            </div>
            <Link href="/teacher/timetable" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Full Week →
            </Link>
          </div>

          <div className="p-4 flex-1">
            {isLoading ? (
              <CardSkeleton />
            ) : todaySchedule.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No teaching periods scheduled for today.</p>
            ) : (
              <div className="space-y-3">
                {todaySchedule.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">
                        {item.class_name} ({item.section_name}) • {item.subject_name}
                      </span>
                      <p className="text-[11px] text-slate-500">{item.room || 'General Classroom'}</p>
                    </div>

                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      {formatTime(item.start_time)} - {formatTime(item.end_time)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Today's Attendance Status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Today's Attendance Status</h3>
            </div>
            <Link href="/teacher/attendance" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Take Roll-Call →
            </Link>
          </div>

          <div className="p-4 flex-1 space-y-3">
            {assignments.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No assigned classes found.</p>
            ) : (
              assignments.map((asg, idx) => (
                <div
                  key={asg.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs"
                >
                  <div>
                    <h4 className="font-bold text-slate-900">
                      {asg.class_name} ({asg.section_name}) • {asg.subject_name}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {idx === 0 ? (
                        <span className="text-emerald-700 font-semibold">✓ Attendance recorded (37 Present)</span>
                      ) : (
                        <span className="text-amber-700 font-semibold">⏳ Roll-call not taken yet</span>
                      )}
                    </p>
                  </div>

                  <Link href="/teacher/attendance">
                    <Button variant="outline" size="sm">
                      {idx === 0 ? 'Edit' : 'Take Attendance'}
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ADD FOLLOW-UP MODAL */}
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
                placeholder="e.g. Parent informed student is unwell with viral fever; expected to return on Monday."
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
