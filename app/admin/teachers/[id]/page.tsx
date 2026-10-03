'use client';

// ============================================================================
// Comprehensive Teacher Profile Page (Overview, Salary History & Assignments)
// ============================================================================

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  teacherService,
  payrollService,
  academicService,
  timetableService,
  authLogService,
  teacherWorkforceService,
  salaryAdjustmentService,
  temporaryAssignmentService,
} from '@/lib/services/api';
import {
  Teacher,
  TeacherAssignment,
  EmployeeSalaryHistory,
  EmployeePayment,
  TimetableEntry,
  SchoolClass,
  Section,
  Subject,
  AuthEvent,
  TeacherAttendance,
  TeacherLeave,
  EmployeeSalaryAdjustment,
  TemporaryAssignment,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Modal } from '@/components/ui/modal';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { SalaryAdjustmentModal } from '@/components/payroll/salary-adjustment-modal';
import { TemporaryAssignmentModal } from '@/components/payroll/temporary-assignment-modal';
import { DateInput } from '@/components/ui/date-input';
import { GoogleEmailInput } from '@/components/ui/google-email-input';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { confirmDeleteTwice } from '@/lib/utils/delete-confirm';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/context/auth-context';
import {
  ArrowLeft,
  GraduationCap,
  IndianRupee,
  CalendarCheck,
  Phone,
  Mail,
  Calendar,
  Edit3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  BookOpen,
  Building,
  ShieldCheck,
  PlusCircle,
  MinusCircle,
  CalendarCheck2,
  Trash2,
  Calculator,
  Briefcase,
  UserCheck,
} from 'lucide-react';
import { CardSkeleton } from '@/components/ui/skeleton';

export default function TeacherProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { currentUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [salaryHistory, setSalaryHistory] = useState<EmployeeSalaryHistory[]>([]);
  const [payments, setPayments] = useState<EmployeePayment[]>([]);
  const [adjustments, setAdjustments] = useState<EmployeeSalaryAdjustment[]>([]);
  const [temporaryAssignments, setTemporaryAssignments] = useState<TemporaryAssignment[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuthEvent[]>([]);
  const [teacherAttendance, setTeacherAttendance] = useState<TeacherAttendance[]>([]);
  const [teacherLeaves, setTeacherLeaves] = useState<TeacherLeave[]>([]);

  // Metadata for assignments
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'attendance' | 'leaves' | 'classes' | 'schedule' | 'payments' | 'adjustments' | 'coverage' | 'salary_history' | 'account' | 'history'
  >('overview');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isAssignCoverageModalOpen, setIsAssignCoverageModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Teacher Form
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeNumber: '',
    joiningDate: '',
    photoUrl: '',
    status: 'active' as Teacher['status'],
  });
  const [isTeacherEmailAvailable, setIsTeacherEmailAvailable] = useState<boolean | null>(true);
  const [isTeacherEmailChecking, setIsTeacherEmailChecking] = useState(false);

  // Salary Update Form
  const [salaryForm, setSalaryForm] = useState({
    newSalary: 35000,
    effectiveFrom: new Date().toISOString().split('T')[0],
    reason: 'Annual Performance Increment',
  });

  // Assign Subject Form
  const [assignForm, setAssignForm] = useState({
    classId: '',
    sectionId: '',
    subjectId: '',
  });

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const t = await teacherService.getTeacherById(resolvedParams.id);
      if (t) {
        setTeacher(t);
        const [salHist, pmtList, ttList, clsList, secList, subList, logs, attendanceRows, leaveRows, adjList, asgList] = await Promise.all([
          teacherService.getTeacherSalaryHistory(t.id),
          payrollService.getEmployeePayments(t.school_id, { employeeType: 'teacher' }),
          timetableService.getTimetable(t.school_id, { teacherId: t.id }),
          academicService.getClasses(t.school_id),
          academicService.getSections(t.school_id),
          academicService.getSubjects(t.school_id),
          authLogService.getEvents({ schoolId: t.school_id, limit: 100 }),
          teacherWorkforceService.getAttendance(t.school_id, { teacherId: t.id }),
          teacherWorkforceService.getLeaves(t.school_id, { teacherId: t.id }),
          salaryAdjustmentService.getAdjustments(t.school_id, { employeeId: t.id }),
          temporaryAssignmentService.getAssignments(t.school_id),
        ]);

        setSalaryHistory(salHist);
        setPayments(pmtList.filter((p) => p.employee_id === t.id));
        setTimetable(ttList);
        setClasses(clsList);
        setSections(secList);
        setSubjects(subList);
        setAuditLogs(logs.filter((l) => l.user_id === t.id || l.details?.teacherName?.toString().includes(t.first_name)));
        setTeacherAttendance(attendanceRows);
        setTeacherLeaves(leaveRows);
        setAdjustments(adjList);
        setTemporaryAssignments(
          asgList.filter((a) => a.absent_employee_id === t.id || a.replacement_employee_id === t.id)
        );

        setEditForm({
          firstName: t.first_name,
          lastName: t.last_name,
          email: t.email,
          phone: t.phone,
          employeeNumber: t.employee_number,
          joiningDate: t.joining_date,
          photoUrl: t.photo_url || '',
          status: t.status,
        });

        setSalaryForm({
          newSalary: t.monthly_salary || 35000,
          effectiveFrom: new Date().toISOString().split('T')[0],
          reason: 'Annual Performance Increment',
        });
      }
    } catch (err) {
      console.error(err);
      toastError('Failed to load teacher profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [resolvedParams.id]);

  const handleDeleteAdjustment = async (id: string) => {
    if (!confirmDeleteTwice('this salary adjustment')) return;
    try {
      await salaryAdjustmentService.deleteAdjustment(id, currentUser || undefined);
      success('Salary adjustment deleted successfully');
      loadProfile();
    } catch {
      toastError('Failed to delete salary adjustment');
    }
  };

  const handleUpdateAssignmentStatus = async (id: string, status: TemporaryAssignment['status']) => {
    try {
      await temporaryAssignmentService.updateAssignment(id, { status }, currentUser || undefined);
      success(`Temporary assignment status marked as ${status}`);
      loadProfile();
    } catch {
      toastError('Failed to update assignment status');
    }
  };

  // Calculate dynamic tenure duration
  const calculateTenure = (joiningDate: string) => {
    try {
      const start = new Date(joiningDate);
      const now = new Date();
      const years = now.getFullYear() - start.getFullYear();
      const months = now.getMonth() - start.getMonth();
      const totalMonths = years * 12 + months;
      const y = Math.floor(totalMonths / 12);
      const m = totalMonths % 12;

      if (y > 0 && m > 0) return `${y} years, ${m} months with school`;
      if (y > 0) return `${y} years with school`;
      return `${Math.max(1, m)} months with school`;
    } catch {
      return 'Active Faculty Member';
    }
  };

  const handleSaveTeacherEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;

    if (isTeacherEmailChecking) {
      toastError('Checking teacher email availability...');
      return;
    }
    if (isTeacherEmailAvailable === false) {
      toastError('Teacher email is not available for login.');
      return;
    }

    try {
      await teacherService.updateTeacher(
        teacher.id,
        {
          first_name: editForm.firstName,
          last_name: editForm.lastName,
          email: editForm.email,
          phone: editForm.phone,
          employee_number: editForm.employeeNumber,
          joining_date: editForm.joiningDate,
          photo_url: editForm.photoUrl,
          status: editForm.status,
        },
        currentUser?.id,
        currentUser?.name
      );

      success('Teacher details updated successfully');
      setIsEditModalOpen(false);
      loadProfile();
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to update teacher profile');
    }
  };

  const handleUpdateSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;

    try {
      await teacherService.updateTeacherSalary(
        teacher.id,
        salaryForm.newSalary,
        salaryForm.effectiveFrom,
        salaryForm.reason,
        currentUser?.id,
        currentUser?.name
      );

      success('Teacher salary updated and history record preserved');
      setIsSalaryModalOpen(false);
      loadProfile();
    } catch {
      toastError('Failed to update salary');
    }
  };

  const handleAssignSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;

    try {
      const cls = classes.find((c) => c.id === assignForm.classId);
      const sec = sections.find((s) => s.id === assignForm.sectionId);
      const sub = subjects.find((sb) => sb.id === assignForm.subjectId);

      await teacherService.assignSubject(teacher.school_id, {
        school_id: teacher.school_id,
        academic_year_id: 'ay-2026',
        teacher_id: teacher.id,
        class_id: assignForm.classId,
        section_id: assignForm.sectionId,
        subject_id: assignForm.subjectId,
        teacher_name: `${teacher.first_name} ${teacher.last_name}`,
        class_name: cls?.name,
        section_name: sec?.name,
        subject_name: sub?.name,
        room_number: sec?.room_number,
      });

      success('Subject assignment created successfully');
      setIsAssignModalOpen(false);
      setAssignForm({ classId: '', sectionId: '', subjectId: '' });
      loadProfile();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to assign subject');
    }
  };

  const handleRemoveAssignment = async (asgId: string) => {
    if (!teacher) return;
    if (!confirmDeleteTwice('this teaching assignment')) return;
    try {
      await teacherService.removeAssignment(teacher.school_id, teacher.id, asgId);
      success('Teaching assignment removed successfully');
      loadProfile();
    } catch {
      toastError('Failed to remove assignment');
    }
  };

  if (isLoading || !teacher) {
    return (
      <div className="p-6 space-y-6">
        <CardSkeleton />
      </div>
    );
  }

  // Payment totals
  const totalPaidThisYear = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter((p) => p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 text-left w-full">
      {/* Back Link */}
      <Link
        href="/admin/teachers"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Teacher Directory
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 w-full overflow-hidden">
        <div className="flex items-center gap-4 min-w-0">
          {/* Avatar */}
          <div className="relative group shrink-0">
            {teacher.photo_url ? (
              <img
                src={teacher.photo_url}
                alt={`${teacher.first_name} ${teacher.last_name}`}
                className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-lg sm:text-xl md:text-2xl font-bold shadow-2xs">
                {teacher.first_name?.[0] || 'T'}
                {teacher.last_name?.[0] || ''}
              </div>
            )}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="absolute -bottom-1 -right-1 p-1 sm:p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 shadow-xs transition-colors"
              title="Change Photo"
            >
              <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          {/* Full Name & Role */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                {teacher.first_name} {teacher.last_name}
              </h1>
              <StatusBadge status={teacher.status} />
            </div>
            <p className="text-sm font-semibold text-slate-500 capitalize mt-0.5">
              Faculty / Teaching Staff
            </p>
          </div>
        </div>

        {/* Quick Actions (Grid on Mobile, Row on Desktop) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAdjustmentModalOpen(true)}
            leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
            className="w-full sm:w-auto justify-center text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Record Salary Adjustment
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAssignCoverageModalOpen(true)}
            leftIcon={<UserCheck className="w-3.5 h-3.5 text-indigo-600" />}
            className="w-full sm:w-auto justify-center text-xs font-semibold"
          >
            Assign Coverage
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            className="w-full sm:w-auto justify-center text-xs font-semibold"
          >
            Edit Teacher
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSalaryModalOpen(true)}
            className="w-full sm:w-auto justify-center text-xs font-semibold"
            leftIcon={<TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Update Base Salary
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAssignModalOpen(true)}
            className="w-full sm:w-auto justify-center text-xs font-semibold col-span-2 sm:col-span-1"
            leftIcon={<BookOpen className="w-3.5 h-3.5 text-indigo-600" />}
          >
            Assign Subject
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'attendance', label: 'Attendance' },
          { id: 'leaves', label: 'Leaves' },
          { id: 'classes', label: 'Classes & Subjects' },
          { id: 'schedule', label: 'Weekly Schedule' },
          { id: 'payments', label: 'Payments' },
          { id: 'adjustments', label: `Salary Adjustments (${adjustments.length})` },
          { id: 'coverage', label: `Temporary Coverage (${temporaryAssignments.length})` },
          { id: 'salary_history', label: 'Salary Revisions' },
          { id: 'account', label: 'Account Access' },
          { id: 'history', label: 'Audit History' },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as any)}
      />

      {activeTab === 'attendance' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="mb-4 text-sm font-bold">Teacher Attendance History</h3>
          {teacherAttendance.length === 0 ? <p className="text-xs text-slate-500">No attendance has been recorded.</p> : <div className="divide-y">{teacherAttendance.map((row) => <div key={row.id} className="flex items-center justify-between py-3 text-xs"><div><strong>{formatDate(row.attendance_date)}</strong><p className="text-slate-500">{row.remarks || 'No remarks'} · Marked by {row.marked_by_name || 'School admin'}</p></div><span className="font-bold uppercase">{row.status}</span></div>)}</div>}
        </div>
      )}

      {activeTab === 'leaves' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="mb-4 text-sm font-bold">Teacher Leave History</h3>
          {teacherLeaves.length === 0 ? <p className="text-xs text-slate-500">No leave requests.</p> : <div className="divide-y">{teacherLeaves.map((leave) => <div key={leave.id} className="py-3 text-xs"><div className="flex justify-between"><strong>{formatDate(leave.start_date)} – {formatDate(leave.end_date)}</strong><span className="font-bold uppercase">{leave.status}</span></div><p>{leave.reason}</p>{leave.status === 'approved' && <p className="text-emerald-700">Return joining date: {formatDate(leave.return_date)}</p>}{leave.admin_notes && <p className="text-slate-500">Admin note: {leave.admin_notes}</p>}</div>)}</div>}
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> Faculty Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Full Name</span>
                <span className="font-semibold text-slate-800">{teacher.first_name} {teacher.last_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Employee ID</span>
                <span className="font-mono font-semibold text-slate-800">{teacher.employee_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Joining Date</span>
                <span className="font-semibold text-slate-800">{formatDate(teacher.joining_date)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Current Salary</span>
                <span className="font-semibold text-emerald-700">{formatCurrency(teacher.monthly_salary || 35000)} / month</span>
              </div>
              <div>
                <span className="text-slate-400 block">Email Address</span>
                <span className="font-semibold text-slate-800">{teacher.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Contact Phone</span>
                <span className="font-semibold text-slate-800 font-mono">{teacher.phone}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Teaching Summary
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block">Assigned Classes</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {Array.from(
                    new Map(
                      (teacher.assignments || []).map((asg) => [
                        `${asg.class_id || asg.class_name}_${asg.section_id || asg.section_name}_${asg.subject_id || asg.subject_name}`,
                        asg,
                      ])
                    ).values()
                  ).map((asg) => (
                    <span key={asg.id} className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                      {asg.class_name}{asg.section_name ? ` (${asg.section_name})` : ''} • {asg.subject_name}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-slate-400 block">Login Method</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold mt-1">
                  <ShieldCheck className="w-4 h-4" /> Google Sign-In with approved email
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLASSES & SUBJECTS */}
      {activeTab === 'classes' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Teaching Assignments</h4>
            </div>
            <Button size="sm" variant="primary" onClick={() => setIsAssignModalOpen(true)} leftIcon={<BookOpen className="w-3.5 h-3.5" />}>
              + Add Assignment
            </Button>
          </div>

          {(teacher.assignments || []).length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-xs">
              No active teaching assignments found. Click "+ Add Assignment" to assign a class and subject.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(teacher.assignments || []).map((asg) => (
                <div
                  key={asg.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {asg.class_name || '—'}{asg.section_name ? ` (${asg.section_name})` : ''}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {asg.room_number ? `Room ${asg.room_number}` : 'Room 204'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-indigo-700 mt-1">
                      {asg.subject_name || 'Mathematics'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Academic Year: 2026-27</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveAssignment(asg.id)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Weekly Lecture Timetable</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Class & Section</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {timetable.map((tt) => (
                  <tr key={tt.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                      {tt.start_time} - {tt.end_time}
                    </td>
                    <td className="py-2.5 px-3 font-semibold">{tt.class_name} {tt.section_name}</td>
                    <td className="py-2.5 px-3 text-indigo-700 font-semibold">{tt.subject_name}</td>
                    <td className="py-2.5 px-3 font-mono">{tt.room}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENTS */}
      {activeTab === 'payments' && (() => {
        const baseSal = teacher.monthly_salary || 35000;
        const reimbTotal = adjustments
          .filter((a) => a.adjustment_type === 'reimbursement')
          .reduce((sum, a) => sum + Number(a.amount || 0), 0);
        const deducTotal = adjustments
          .filter((a) => a.adjustment_type === 'deduction')
          .reduce((sum, a) => sum + Number(a.amount || 0), 0);
        const netSal = Math.max(0, baseSal + reimbTotal - deducTotal);

        return (
          <div className="space-y-6">
            {/* 4-Card Compensation Overview (Base, Reimbursements, Deductions, Final Net) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 block">Monthly Base Salary</span>
                <span className="text-xl font-bold text-slate-900 mt-1 block font-mono">
                  {formatCurrency(baseSal)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Fixed contracted base</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
                <span className="text-[11px] font-semibold text-emerald-700 block">Total Reimbursements (+)</span>
                <span className="text-xl font-bold text-emerald-800 mt-1 block font-mono">
                  +{formatCurrency(reimbTotal)}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">Proxy duties & coverage allowances</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs">
                <span className="text-[11px] font-semibold text-rose-700 block">Total Deductions (-)</span>
                <span className="text-xl font-bold text-rose-800 mt-1 block font-mono">
                  -{formatCurrency(deducTotal)}
                </span>
                <span className="text-[10px] text-rose-600 block mt-0.5">Unpaid leave & absence penalties</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 shadow-2xs">
                <span className="text-[11px] font-semibold text-indigo-700 block">Calculated Net Payable</span>
                <span className="text-xl font-bold text-indigo-950 mt-1 block font-mono">
                  {formatCurrency(netSal)}
                </span>
                <span className="text-[10px] text-indigo-600 block mt-0.5">Base + Reimbursements - Deductions</span>
              </div>
            </div>

            {/* Quick Action Button for Salary Adjustment */}
            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Calculator className="w-4 h-4 text-indigo-600" />
                <span>
                  Adjustments affect the final payable salary dynamically without overwriting the base salary.
                </span>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsAdjustmentModalOpen(true)}
                leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                Record Salary Adjustment
              </Button>
            </div>

            {/* Compensation Disbursements History Table */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Disbursement Statements</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">Billing Month</th>
                      <th className="py-2.5 px-3">Base Salary</th>
                      <th className="py-2.5 px-3">Reimbursements</th>
                      <th className="py-2.5 px-3">Deductions</th>
                      <th className="py-2.5 px-3">Net Payable</th>
                      <th className="py-2.5 px-3">Payment Date</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {payments.map((p) => {
                      const empReimb = adjustments
                        .filter(
                          (a) =>
                            a.adjustment_type === 'reimbursement' &&
                            (a.billing_month || a.effective_date.slice(0, 7)) === p.billing_month
                        )
                        .reduce((sum, a) => sum + Number(a.amount || 0), 0);
                      const empDeduc = adjustments
                        .filter(
                          (a) =>
                            a.adjustment_type === 'deduction' &&
                            (a.billing_month || a.effective_date.slice(0, 7)) === p.billing_month
                        )
                        .reduce((sum, a) => sum + Number(a.amount || 0), 0);
                      const itemBase = p.base_salary || teacher.monthly_salary || 35000;
                      const itemNet = Math.max(0, itemBase + empReimb - empDeduc);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-mono font-semibold">{p.billing_month}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{formatCurrency(itemBase)}</td>
                          <td className="py-2.5 px-3 font-mono text-emerald-700 font-semibold">
                            {empReimb > 0 ? `+${formatCurrency(empReimb)}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-rose-700 font-semibold">
                            {empDeduc > 0 ? `-${formatCurrency(empDeduc)}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 font-mono">
                            {formatCurrency(itemNet)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {p.payment_date ? formatDate(p.payment_date) : 'Pending'}
                          </td>
                          <td className="py-2.5 px-3 uppercase text-slate-600">{p.payment_method || 'Bank'}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {p.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB: SALARY ADJUSTMENTS (Reimbursements & Deductions) */}
      {activeTab === 'adjustments' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Salary Adjustments (Reimbursements & Deductions)</h4>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsAdjustmentModalOpen(true)}
              leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              Record Salary Adjustment
            </Button>
          </div>

          {adjustments.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl space-y-3">
              <Calculator className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">No salary adjustments recorded for this teacher.</p>
              <Button size="sm" variant="outline" onClick={() => setIsAdjustmentModalOpen(true)}>
                + Record First Adjustment
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Effective Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Linked Duty / Assignment</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Recorded By</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {adjustments.map((adj) => (
                    <tr key={adj.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-mono">{formatDate(adj.effective_date)}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            adj.adjustment_type === 'reimbursement'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {adj.adjustment_type === 'reimbursement' ? (
                            <PlusCircle className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <MinusCircle className="w-3 h-3 text-rose-600" />
                          )}
                          <span className="capitalize">{adj.adjustment_type}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {adj.reason}
                        {adj.notes && <p className="text-[11px] text-slate-400 font-normal">{adj.notes}</p>}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {adj.temporary_assignment_label || adj.temporary_assignment_id ? (
                          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium text-[11px]">
                            {adj.temporary_assignment_label || `Ref: ${adj.temporary_assignment_id}`}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">Standalone</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold font-mono">
                        <span
                          className={adj.adjustment_type === 'reimbursement' ? 'text-emerald-700' : 'text-rose-700'}
                        >
                          {adj.adjustment_type === 'reimbursement' ? '+' : '-'}
                          {formatCurrency(adj.amount)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">{adj.created_by_name || 'Admin'}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteAdjustment(adj.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete adjustment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: TEMPORARY COVERAGE (Work Replacement History) */}
      {activeTab === 'coverage' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Temporary Work Coverage History</h4>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsAssignCoverageModalOpen(true)}
              leftIcon={<UserCheck className="w-3.5 h-3.5" />}
              className="text-xs font-semibold"
            >
              + Assign Temporary Coverage
            </Button>
          </div>

          {temporaryAssignments.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl space-y-3">
              <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">No temporary work coverage assignments recorded.</p>
              <Button size="sm" variant="outline" onClick={() => setIsAssignCoverageModalOpen(true)}>
                + Create Coverage Assignment
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {temporaryAssignments.map((asg) => {
                const isReplacement = asg.replacement_employee_id === teacher.id;
                return (
                  <div
                    key={asg.id}
                    className={`p-4 rounded-xl border space-y-3 text-xs ${
                      isReplacement
                        ? 'border-indigo-200 bg-indigo-50/20'
                        : 'border-slate-200 bg-slate-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                          isReplacement
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isReplacement ? '⭐ Acting Replacement' : 'Leave Coverage'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          asg.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : asg.status === 'completed'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {asg.status}
                      </span>
                    </div>

                    <div>
                      <strong className="block text-slate-900 text-sm">{asg.duty_details}</strong>
                      <p className="text-slate-500 mt-0.5">
                        {isReplacement ? (
                          <>
                            Covering for absent colleague: <strong className="text-slate-800">{asg.absent_employee_name}</strong> ({asg.absent_employee_role})
                          </>
                        ) : (
                          <>
                            Covered by colleague: <strong className="text-slate-800">{asg.replacement_employee_name}</strong> ({asg.replacement_employee_role})
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-700">
                        🗓️ {formatDate(asg.start_date)} to {formatDate(asg.end_date)}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{asg.assignment_type.replace(/_/g, ' ')}</span>
                    </div>

                    {asg.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-white/60 p-2 rounded border border-slate-100">
                        &ldquo;{asg.notes}&rdquo;
                      </p>
                    )}

                    {asg.is_emergency_override && (
                      <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[10px] flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span>
                          <strong>Emergency Override:</strong> {asg.override_reason || 'Admin authorized'}
                        </span>
                      </div>
                    )}

                    {/* Action Row */}
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {asg.status === 'active' && (
                          <button
                            onClick={() => handleUpdateAssignmentStatus(asg.id, 'completed')}
                            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setIsAdjustmentModalOpen(true);
                        }}
                        leftIcon={<IndianRupee className="w-3 h-3 text-emerald-600" />}
                        className="text-[10px]"
                      >
                        Record Adjustment
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SALARY HISTORY (Timeline of past increments) */}
      {activeTab === 'salary_history' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Historical Salary Revisions</h4>
            </div>
            <Button size="sm" variant="primary" onClick={() => setIsSalaryModalOpen(true)}>
              + Increment / Revise Salary
            </Button>
          </div>

          <div className="relative border-l-2 border-indigo-200 ml-4 space-y-6 py-2">
            {salaryHistory.map((hist, idx) => (
              <div key={hist.id} className="relative pl-6">
                <div className="absolute -left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white shadow-2xs" />
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(hist.amount)} / month
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      Effective: {formatDate(hist.effective_from)} {hist.effective_to ? `– ${formatDate(hist.effective_to)}` : '(Current)'}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">Reason: <strong>{hist.reason || 'Appraisal increment'}</strong></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: ACCOUNT ACCESS */}
      {activeTab === 'account' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Faculty Access</h4>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3 max-w-md">
            <div>
              <span className="text-slate-400 block">Authorized Google / Institutional Email</span>
              <strong className="font-mono text-slate-900 text-sm">{teacher.email}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Employee ID</span>
              <strong className="font-mono text-slate-900 text-sm">{teacher.employee_number}</strong>
            </div>
            <p className="text-[11px] text-slate-500">Employee ID is an internal identifier. Portal authentication uses the approved Google account.</p>
          </div>
        </div>
      )}

      {/* TAB 7: AUDIT HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Audit Trail of Updates</h4>
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex justify-between">
                <div>
                  <strong className="block text-slate-800 capitalize">{log.event_type.replace('_', ' ')}</strong>
                  <span className="text-slate-500">Performed by: {log.user_name || 'Administrator'}</span>
                </div>
                <span className="text-[11px] text-slate-400">{formatDate(log.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EDIT TEACHER MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Teacher Profile: ${teacher.first_name} ${teacher.last_name}`}
      >
        <form onSubmit={handleSaveTeacherEdits} className="space-y-4 text-xs text-left max-h-[75vh] overflow-y-auto pr-1">
            <PhotoUpload
              label="Teacher Photo"
              currentPhotoUrl={editForm.photoUrl}
              onPhotoChange={(url) => setEditForm((prev) => ({ ...prev, photoUrl: url || '' }))}
            />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Employee ID *</label>
              <input
                type="text"
                required
                readOnly
                value={editForm.employeeNumber}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-100 text-xs font-mono"
              />
            </div>
            <div>
              <DateInput
                label="Joining Date"
                value={editForm.joiningDate}
                onChange={(e) => setEditForm({ ...editForm, joiningDate: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <GoogleEmailInput
                label="Teacher Google Email (For Sign-In)"
                required
                value={editForm.email}
                onChange={(val) => setEditForm({ ...editForm, email: val })}
                targetSchoolId={teacher.school_id}
                targetRole="teacher"
                excludeEmail={teacher.email}
                excludeUserId={teacher.id}
                onValidationChange={(_, available, checking) => {
                  setIsTeacherEmailAvailable(available);
                  setIsTeacherEmailChecking(checking);
                }}
                placeholder="teacher.name@gmail.com"
                id="teacher-profile-edit-email-input"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isTeacherEmailChecking || isTeacherEmailAvailable === false}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* UPDATE SALARY MODAL */}
      <Modal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        title="Update Faculty Monthly Salary"
      >
        <form onSubmit={handleUpdateSalarySubmit} className="space-y-4 text-xs text-left">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              <strong>Note:</strong> Updating salary creates a new historical record effective from the selected date. Past payment disbursements remain unchanged.
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Monthly Salary (₹) *</label>
            <input
              type="number"
              required
              min={1000}
              value={salaryForm.newSalary}
              onChange={(e) => setSalaryForm({ ...salaryForm, newSalary: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold"
            />
          </div>

          <div>
            <DateInput
              label="Effective From Date"
              required
              value={salaryForm.effectiveFrom}
              onChange={(e) => setSalaryForm({ ...salaryForm, effectiveFrom: e.target.value })}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason for Revision</label>
            <input
              type="text"
              value={salaryForm.reason}
              onChange={(e) => setSalaryForm({ ...salaryForm, reason: e.target.value })}
              placeholder="e.g. Annual Increment, Department Lead Allowance"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsSalaryModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Update Salary
            </Button>
          </div>
        </form>
      </Modal>

      {/* ASSIGN SUBJECT MODAL */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Class & Subject to Teacher"
      >
        <form onSubmit={handleAssignSubjectSubmit} className="space-y-4 text-xs text-left">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Class *</label>
            <select
              required
              value={assignForm.classId}
              onChange={(e) => setAssignForm({ ...assignForm, classId: e.target.value, sectionId: '' })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Section (Optional)</label>
            <select
              value={assignForm.sectionId}
              onChange={(e) => setAssignForm({ ...assignForm, sectionId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
            >
              <option value="">Whole class / All sections</option>
              {sections.filter((s) => s.class_id === assignForm.classId).map((s) => (
                <option key={s.id} value={s.id}>Section {s.name} (Room {s.room_number || '204'})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Subject *</label>
            <select
              required
              value={assignForm.subjectId}
              onChange={(e) => setAssignForm({ ...assignForm, subjectId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
            >
              <option value="">Select Subject</option>
              {subjects.map((sb) => (
                <option key={sb.id} value={sb.id}>{sb.name} ({sb.code})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* RECORD SALARY ADJUSTMENT MODAL */}
      <SalaryAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        onSuccess={() => loadProfile()}
        employee={{
          id: teacher.id,
          name: `${teacher.first_name} ${teacher.last_name}`,
          role: 'teacher',
          employeeNumber: teacher.employee_number,
          baseSalary: teacher.monthly_salary || 35000,
          department: 'Academics',
        }}
      />

      {/* CREATE TEMPORARY COVERAGE MODAL */}
      <TemporaryAssignmentModal
        isOpen={isAssignCoverageModalOpen}
        onClose={() => setIsAssignCoverageModalOpen(false)}
        onSuccess={() => loadProfile()}
        preselectedAbsentMember={{
          id: teacher.id,
          name: `${teacher.first_name} ${teacher.last_name}`,
          role: 'teacher',
          employeeNumber: teacher.employee_number,
        }}
      />

    </div>
  );
}
