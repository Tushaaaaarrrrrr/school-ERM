'use client';

// ============================================================================
// Teacher Attendance Entry Screen & Class Leave Approval Drawer
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import {
  teacherService,
  studentService,
  attendanceService,
  holidayService,
  leaveService,
} from '@/lib/services/api';
import {
  TeacherAssignment,
  Student,
  AttendanceStatus,
  SchoolHoliday,
  StudentLeave,
  LeaveType,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils/formatters';
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Save,
  CheckCheck,
  Palmtree,
  ShieldAlert,
  UserCheck,
  Plus,
  FileText,
  AlertCircle,
  CalendarX2,
  Lock,
  Unlock,
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';

export default function TeacherAttendancePage() {
  const { currentUser, currentSchool, currentYear } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const yearId = currentYear?.id || 'ay-2026';
  const { success, error: toastError } = useToast();

  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [selectedAsgId, setSelectedAsgId] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: AttendanceStatus; remarks: string; isOnLeave: boolean; leaveReason?: string }>
  >({});
  const [dayStatus, setDayStatus] = useState<{
    isOpen: boolean;
    reasonType: 'regular' | 'holiday' | 'weekly_off' | 'emergency';
    title: string;
    description: string;
    holiday?: SchoolHoliday;
  }>({
    isOpen: true,
    reasonType: 'regular',
    title: 'School Open',
    description: '',
  });
  const [isExtraClassOverride, setIsExtraClassOverride] = useState(false);
  const [pendingLeaves, setPendingLeaves] = useState<StudentLeave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Leave Requests Drawer / Modal State
  const [isLeavesModalOpen, setIsLeavesModalOpen] = useState(false);
  const [activeRejectLeave, setActiveRejectLeave] = useState<StudentLeave | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Direct Grant Leave Modal State
  const [isDirectGrantOpen, setIsDirectGrantOpen] = useState(false);
  const [directLeaveStudentId, setDirectLeaveStudentId] = useState('');
  const [directLeaveType, setDirectLeaveType] = useState<LeaveType>('partial_day');
  const [directLeaveStartTime, setDirectLeaveStartTime] = useState('11:00');
  const [directLeaveEndTime, setDirectLeaveEndTime] = useState('14:30');
  const [directLeaveReason, setDirectLeaveReason] = useState('Illness / Sent home early');
  const [isGrantingLeave, setIsGrantingLeave] = useState(false);

  // Load Teacher's Assigned Classes
  useEffect(() => {
    async function loadAssignments() {
      setIsLoading(true);
      try {
        const teacher = await teacherService.getTeacherForUser(currentUser, schoolId);
        const list = teacher ? await teacherService.getAssignments(schoolId, teacher.id) : [];
        setAssignments(list);
        if (list.length > 0) {
          setSelectedAsgId(list[0].id);
        }
      } catch {
        toastError('Failed to load assignments');
      } finally {
        setIsLoading(false);
      }
    }
    loadAssignments();
  }, [schoolId, currentUser]);

  // Load Students, Existing Attendance, Holidays & Approved Leaves for the Selected Date
  const loadAttendanceSheet = async () => {
    if (!selectedAsgId) return;

    setIsLoading(true);
    try {
      const asg = assignments.find((a) => a.id === selectedAsgId);
      if (!asg) return;

      // Check if date is open or holiday/weekly off
      const status = await holidayService.checkDayStatus(schoolId, attendanceDate);
      setDayStatus(status);
      if (status.isOpen) {
        setIsExtraClassOverride(false);
      }

      const [classList, existingAtt, leaves, allClassLeaves] = await Promise.all([
        studentService.getStudents(schoolId, { classId: asg.class_id, sectionId: asg.section_id }),
        attendanceService.getAttendance(schoolId, {
          classId: asg.class_id,
          sectionId: asg.section_id,
          date: attendanceDate,
        }),
        leaveService.getLeaves(schoolId, { activeOnDate: attendanceDate }),
        leaveService.getLeaves(schoolId, { status: 'pending' }),
      ]);

      setStudents(classList);
      if (classList.length > 0 && !directLeaveStudentId) {
        setDirectLeaveStudentId(classList[0].id);
      }

      // Filter pending leaves for students belonging to this class
      const classStudentIds = classList.map((s) => s.id);
      setPendingLeaves(allClassLeaves.filter((l) => classStudentIds.includes(l.student_id)));

      // Build status map with automatic approved leave detection
      const map: Record<string, { status: AttendanceStatus; remarks: string; isOnLeave: boolean; leaveReason?: string }> = {};

      classList.forEach((st) => {
        const recorded = existingAtt.find((a) => a.student_id === st.id);
        const approvedLeave = leaves.find((l) => l.student_id === st.id && l.status === 'approved');

        if (approvedLeave) {
          map[st.id] = {
            status: 'leave',
            remarks: `Approved Leave: ${approvedLeave.reason}`,
            isOnLeave: true,
            leaveReason: approvedLeave.reason,
          };
        } else if (recorded) {
          map[st.id] = {
            status: recorded.status,
            remarks: recorded.remarks || '',
            isOnLeave: false,
          };
        } else {
          // Default to present
          map[st.id] = {
            status: 'present',
            remarks: '',
            isOnLeave: false,
          };
        }
      });

      setAttendanceMap(map);
    } catch {
      toastError('Failed to load attendance sheet');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceSheet();
  }, [selectedAsgId, attendanceDate, schoolId]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setAttendanceMap((prev) => {
      const next = { ...prev };
      students.forEach((st) => {
        if (!next[st.id]?.isOnLeave) {
          next[st.id] = {
            ...next[st.id],
            status,
          };
        }
      });
      return next;
    });
  };

  const handleSaveAttendance = async () => {
    const asg = assignments.find((a) => a.id === selectedAsgId);
    if (!asg) return;

    setIsSaving(true);
    try {
      const records = students.map((st) => ({
        student_id: st.id,
        status: attendanceMap[st.id]?.status || 'present',
        remarks: attendanceMap[st.id]?.remarks || '',
      }));

      await attendanceService.saveClassAttendance(
        schoolId,
        yearId,
        asg.class_id,
        asg.section_id,
        attendanceDate,
        records,
        currentUser?.id || asg.teacher_id,
        `${currentUser?.name || asg.teacher_name || 'Class Teacher'} (Teacher)`
      );

      success('Attendance saved and synchronized successfully!');
    } catch {
      toastError('Failed to save attendance');
    } finally {
      setIsSaving(false);
    }
  };

  // Leave approval & rejection
  const handleApproveLeave = async (leaveId: string) => {
    try {
      await leaveService.reviewLeave(leaveId, 'approved', undefined, currentUser?.id, currentUser?.name);
      success('Leave request approved');
      loadAttendanceSheet();
    } catch {
      toastError('Error approving leave');
    }
  };

  const handleRejectLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRejectLeave || !rejectionReason.trim()) return;

    try {
      await leaveService.reviewLeave(
        activeRejectLeave.id,
        'rejected',
        rejectionReason.trim(),
        currentUser?.id,
        currentUser?.name
      );
      success('Leave request rejected with notification sent to parents');
      setActiveRejectLeave(null);
      setRejectionReason('');
      loadAttendanceSheet();
    } catch {
      toastError('Error rejecting leave');
    }
  };

  // Direct grant leave (sick child)
  const handleGrantDirectLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directLeaveStudentId) return;

    const targetStudent = students.find((s) => s.id === directLeaveStudentId);
    const asg = assignments.find((a) => a.id === selectedAsgId);

    setIsGrantingLeave(true);
    try {
      await leaveService.grantDirectLeave({
        school_id: schoolId,
        student_id: directLeaveStudentId,
        leave_type: directLeaveType,
        start_date: attendanceDate,
        end_date: attendanceDate,
        partial_start_time: directLeaveType === 'partial_day' ? directLeaveStartTime : undefined,
        partial_end_time: directLeaveType === 'partial_day' ? directLeaveEndTime : undefined,
        reason: directLeaveReason,
        granterId: currentUser?.id || asg?.teacher_id || '',
        granterName: currentUser?.name || 'Class Teacher',
        granterRole: 'teacher',
        student_name: targetStudent ? `${targetStudent.first_name} ${targetStudent.last_name}` : undefined,
      });

      success('Direct leave granted and parent notified immediately');
      setIsDirectGrantOpen(false);
      loadAttendanceSheet();
    } catch {
      toastError('Error granting direct leave');
    } finally {
      setIsGrantingLeave(false);
    }
  };

  const totalCount = students.length;
  const presentCount = Object.values(attendanceMap).filter((s) => s.status === 'present').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s.status === 'absent').length;
  const leaveCount = Object.values(attendanceMap).filter((s) => s.status === 'leave').length;

  return (
    <div className="space-y-6 text-left w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-indigo-600" /> Class Attendance & Roster
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Leave Requests Drawer Button */}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FileText className="w-4 h-4 text-indigo-600" />}
            onClick={() => setIsLeavesModalOpen(true)}
            className="relative"
          >
            <span>Leave Requests</span>
            {pendingLeaves.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                {pendingLeaves.length}
              </span>
            )}
          </Button>

          {/* Grant Sick Leave Button */}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Plus className="w-4 h-4 text-amber-600" />}
            onClick={() => setIsDirectGrantOpen(true)}
          >
            Grant Leave
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={isExtraClassOverride ? <Unlock className="w-4 h-4 text-amber-300" /> : <Save className="w-4 h-4" />}
            onClick={handleSaveAttendance}
            isLoading={isSaving}
            disabled={isLoading || (!dayStatus.isOpen && !isExtraClassOverride)}
          >
            {isExtraClassOverride ? 'Save Extra-Class Attendance' : 'Save Attendance'}
          </Button>
        </div>
      </div>

      {/* Control Bar: Class Switcher & Date Picker */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Section Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Class:</span>
            <select
              value={selectedAsgId}
              onChange={(e) => setSelectedAsgId(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:ring-indigo-500"
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.class_name} ({a.section_name}) • {a.subject_name || 'Class Teacher'}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Date:</span>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              onClick={(e) => {
                try {
                  (e.currentTarget as any).showPicker?.();
                } catch {}
              }}
              className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold text-slate-500">
            Total: <strong className="text-slate-900">{totalCount}</strong>
          </span>
          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
            Present: <strong>{presentCount}</strong>
          </span>
          <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
            Absent: <strong>{absentCount}</strong>
          </span>
          <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
            Leave: <strong>{leaveCount}</strong>
          </span>
        </div>
      </div>

      {/* Closed Day / Holiday Alert Banner */}
      {!dayStatus.isOpen && !isExtraClassOverride && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs ${
            dayStatus.reasonType === 'holiday'
              ? 'bg-amber-50/90 border-amber-300 text-amber-950'
              : 'bg-slate-100 border-slate-300 text-slate-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {dayStatus.reasonType === 'holiday' ? (
              <Palmtree className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <CalendarX2 className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
            )}
            <div>
              <strong className="font-bold text-sm block">{dayStatus.title}</strong>
              <span className="text-slate-600">
                {dayStatus.description || 'School is closed on this date. Attendance marking is locked to preserve records.'}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                * Closed days do not count towards student absence statistics.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Unlock className="w-3.5 h-3.5 text-indigo-600" />}
            onClick={() => setIsExtraClassOverride(true)}
            className="shrink-0 bg-white hover:bg-slate-50"
            title="Unlock roll call for special classes, sports camps, or weekend remedial sessions"
          >
            Extra-Class Override
          </Button>
        </div>
      )}

      {/* Extra-Class Override Active Alert */}
      {!dayStatus.isOpen && isExtraClassOverride && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <Unlock className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <strong className="font-bold text-sm block">Special / Extra-Class Attendance Active</strong>
              <span className="text-indigo-700">
                You have overridden the closed schedule for {dayStatus.title}. You can now record roll call.
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Lock className="w-3.5 h-3.5" />}
            onClick={() => setIsExtraClassOverride(false)}
            className="shrink-0 bg-white"
          >
            Relock Day
          </Button>
        </div>
      )}

      {/* Quick Mark All Row */}
      {(dayStatus.isOpen || isExtraClassOverride) && students.length > 0 && (
        <div className="flex items-center justify-between px-1 text-xs">
          <span className="text-slate-400 font-semibold">Quick Actions:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleMarkAll('present')}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark All Present
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => handleMarkAll('absent')}
              className="text-xs font-bold text-rose-700 hover:underline"
            >
              Mark All Absent
            </button>
          </div>
        </div>
      )}

      {/* Touch-Friendly Student Roster List */}
      {isLoading ? (
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <TableSkeleton rows={5} />
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
          No students enrolled in this section.
        </div>
      ) : (
        <div className="space-y-2.5">
          {students.map((st) => {
            const state = attendanceMap[st.id] || { status: 'present', remarks: '', isOnLeave: false };
            const isLocked = !dayStatus.isOpen && !isExtraClassOverride;

            return (
              <div
                key={st.id}
                className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
              >
                {/* Student Info */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                    {st.current_enrollment?.roll_number || '—'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {st.first_name} {st.last_name}
                      </span>
                      {state.isOnLeave && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                          On Approved Leave ({state.leaveReason || 'Leave'})
                        </span>
                      )}
                      {st.emergency_info?.visible_to_teachers && st.emergency_info?.allergies_alert && (
                        <span
                          className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded cursor-help"
                          title={st.emergency_info.allergies_alert}
                        >
                          Alert: {st.emergency_info.allergies_alert}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Reg: {st.registration_number}
                    </span>
                  </div>
                </div>

                {/* Touch-Friendly Status Toggles */}
                <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    disabled={isLocked || state.isOnLeave}
                    onClick={() => handleStatusChange(st.id, 'present')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      state.status === 'present'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                    } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Present</span>
                  </button>

                  <button
                    type="button"
                    disabled={isLocked || state.isOnLeave}
                    onClick={() => handleStatusChange(st.id, 'absent')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      state.status === 'absent'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                    } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Absent</span>
                  </button>

                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleStatusChange(st.id, 'leave')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      state.status === 'leave'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                    } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Leave</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PENDING LEAVE REQUESTS MODAL */}
      {isLeavesModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsLeavesModalOpen(false)}
          title="Class Leave Requests"
          description="Review student and parent leave applications"
        >
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1 text-xs">
            {pendingLeaves.length === 0 ? (
              <p className="py-8 text-center text-slate-400">No pending leave requests for this class.</p>
            ) : (
              pendingLeaves.map((l) => (
                <div key={l.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{l.student_name || 'Student'}</h4>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Requested by: <strong>{l.requested_by_type?.toUpperCase()}</strong> ({l.requested_by_name || 'Parent'})
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      PENDING APPROVAL
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <strong>Dates:</strong> {formatDate(l.start_date)}
                      {l.end_date !== l.start_date && ` to ${formatDate(l.end_date)}`} (
                      {l.leave_type.replace('_', ' ')})
                    </div>
                    <div className="mt-0.5">
                      <strong>Reason:</strong> {l.reason}
                    </div>
                    {l.notes && <div className="mt-0.5 text-slate-500 italic">Notes: &ldquo;{l.notes}&rdquo;</div>}
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setActiveRejectLeave(l)}
                      className="text-rose-700 border-rose-200 hover:bg-rose-50"
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => handleApproveLeave(l.id)}
                    >
                      Approve Leave
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

      {/* REJECT LEAVE MODAL WITH MANDATORY REASON */}
      {activeRejectLeave && (
        <Modal
          isOpen={true}
          onClose={() => setActiveRejectLeave(null)}
          title={`Reject Leave: ${activeRejectLeave.student_name}`}
          description="Provide a mandatory reason that will be communicated to the parent"
        >
          <form onSubmit={handleRejectLeave} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Rejection Reason *</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Crucial midterm revision test scheduled on this date..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveRejectLeave(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" size="sm">
                Confirm Rejection
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* DIRECT GRANT SICK LEAVE MODAL */}
      {isDirectGrantOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsDirectGrantOpen(false)}
          title="Grant Direct Leave (Sick Child)"
          description="Mark student on approved leave today and notify parents immediately"
        >
          <form onSubmit={handleGrantDirectLeave} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Student *</label>
              <select
                value={directLeaveStudentId}
                onChange={(e) => setDirectLeaveStudentId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-bold"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} (Roll #{s.current_enrollment?.roll_number || '—'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Leave Type *</label>
                <select
                  value={directLeaveType}
                  onChange={(e) => setDirectLeaveType(e.target.value as LeaveType)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  <option value="partial_day">Partial Day (Few Hours)</option>
                  <option value="full_day">Full Day</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason *</label>
                <input
                  type="text"
                  required
                  value={directLeaveReason}
                  onChange={(e) => setDirectLeaveReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
                />
              </div>
            </div>

            {directLeaveType === 'partial_day' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Leaving Time</label>
                  <input
                    type="time"
                    value={directLeaveStartTime}
                    onChange={(e) => setDirectLeaveStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Until</label>
                  <input
                    type="time"
                    value={directLeaveEndTime}
                    onChange={(e) => setDirectLeaveEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDirectGrantOpen(false)}
                disabled={isGrantingLeave}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isGrantingLeave}>
                Grant Leave & Notify Parent
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
