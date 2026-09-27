'use client';

// ============================================================================
// Comprehensive Campus Workforce Attendance & Leave Management
// Covers both Teachers & Faculty + Staff & Support Personnel
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import {
  teacherService,
  teacherWorkforceService,
  staffService,
  staffWorkforceService,
} from '@/lib/services/api';
import type {
  AttendanceStatus,
  LeaveType,
  Teacher,
  Staff,
  TeacherLeave,
  StaffLeave,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils/formatters';
import {
  CalendarCheck,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Search,
  CheckCheck,
  Palmtree,
  GraduationCap,
  Briefcase,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Filter,
  UserCheck,
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';
import { TemporaryAssignmentModal } from '@/components/payroll/temporary-assignment-modal';

interface UnifiedMember {
  id: string;
  type: 'teacher' | 'staff';
  firstName: string;
  lastName: string;
  employeeNumber: string;
  designation: string;
  department?: string;
  photoUrl?: string;
  status: string;
}

interface MemberAttendanceState {
  status: AttendanceStatus;
  remarks: string;
  isOnLeave: boolean;
  leaveReason?: string;
  leaveId?: string;
}

export default function TeacherAndStaffAttendancePage() {
  const { currentSchool, currentUser } = useAuth();
  const schoolId = currentSchool?.id || '';
  const { success, error: toastError } = useToast();

  // Date State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Tab & Filters
  const [activeCategory, setActiveCategory] = useState<'all' | 'teachers' | 'staff'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [teacherLeaves, setTeacherLeaves] = useState<TeacherLeave[]>([]);
  const [staffLeaves, setStaffLeaves] = useState<StaffLeave[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, MemberAttendanceState>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Temporary Coverage Modal State
  const [selectedAbsentMemberForCoverage, setSelectedAbsentMemberForCoverage] = useState<{
    id: string;
    name: string;
    role: string;
    employeeNumber?: string;
  } | null>(null);
  const [isCoverageModalOpen, setIsCoverageModalOpen] = useState(false);

  // Review Modal State
  const [reviewingLeave, setReviewingLeave] = useState<{
    leave: TeacherLeave | StaffLeave;
    type: 'teacher' | 'staff';
  } | null>(null);
  const [reviewForm, setReviewForm] = useState({
    startDate: '',
    endDate: '',
    returnDate: '',
    notes: '',
  });

  // Grant Leave Modal State
  const [isGrantLeaveModalOpen, setIsGrantLeaveModalOpen] = useState(false);
  const [grantCategory, setGrantCategory] = useState<'teacher' | 'staff'>('teacher');
  const [grantMemberId, setGrantMemberId] = useState('');
  const [grantSearchQuery, setGrantSearchQuery] = useState('');
  const [grantFilterCategory, setGrantFilterCategory] = useState<'all' | 'teacher' | 'staff'>('all');
  const [grantForm, setGrantForm] = useState({
    leaveType: 'full_day' as LeaveType,
    startDate: selectedDate,
    endDate: selectedDate,
    returnDate: '',
    reason: '',
    notes: '',
  });

  const nextDate = (val: string) => {
    try {
      const d = new Date(`${val}T12:00:00`);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    } catch {
      return val;
    }
  };

  const loadData = async () => {
    if (!schoolId) return;
    setIsLoading(true);
    try {
      const [
        tList,
        sList,
        tAttendance,
        sAttendance,
        tLeaves,
        sLeaves,
      ] = await Promise.all([
        teacherService.getTeachers(schoolId, { status: 'active' }),
        staffService.getStaff(schoolId, { status: 'active' }),
        teacherWorkforceService.getAttendance(schoolId, { date: selectedDate }),
        staffWorkforceService.getAttendance(schoolId, { date: selectedDate }),
        teacherWorkforceService.getLeaves(schoolId),
        staffWorkforceService.getLeaves(schoolId),
      ]);

      setTeachers(tList);
      setStaffList(sList);
      setTeacherLeaves(tLeaves);
      setStaffLeaves(sLeaves);

      const nextMap: Record<string, MemberAttendanceState> = {};

      // Initialize teachers
      tList.forEach((t) => {
        const saved = tAttendance.find((item) => item.teacher_id === t.id);
        const approvedLeave = tLeaves.find(
          (item) =>
            item.teacher_id === t.id &&
            item.status === 'approved' &&
            item.start_date <= selectedDate &&
            item.end_date >= selectedDate
        );

        if (approvedLeave) {
          nextMap[`teacher_${t.id}`] = {
            status: 'leave',
            remarks: saved?.remarks || `Approved Leave: ${approvedLeave.reason}`,
            isOnLeave: true,
            leaveReason: approvedLeave.reason,
            leaveId: approvedLeave.id,
          };
        } else {
          nextMap[`teacher_${t.id}`] = {
            status: saved?.status || 'present',
            remarks: saved?.remarks || '',
            isOnLeave: false,
          };
        }
      });

      // Initialize staff
      sList.forEach((s) => {
        const saved = sAttendance.find((item) => item.staff_id === s.id);
        const approvedLeave = sLeaves.find(
          (item) =>
            item.staff_id === s.id &&
            item.status === 'approved' &&
            item.start_date <= selectedDate &&
            item.end_date >= selectedDate
        );

        if (approvedLeave) {
          nextMap[`staff_${s.id}`] = {
            status: 'leave',
            remarks: saved?.remarks || `Approved Leave: ${approvedLeave.reason}`,
            isOnLeave: true,
            leaveReason: approvedLeave.reason,
            leaveId: approvedLeave.id,
          };
        } else {
          nextMap[`staff_${s.id}`] = {
            status: saved?.status || 'present',
            remarks: saved?.remarks || '',
            isOnLeave: false,
          };
        }
      });

      setAttendanceMap(nextMap);
    } catch {
      toastError('Failed to load attendance records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolId, selectedDate]);

  // Combine unified list of members
  const unifiedMembers: UnifiedMember[] = useMemo(() => {
    const list: UnifiedMember[] = [];

    if (activeCategory === 'all' || activeCategory === 'teachers') {
      teachers.forEach((t) => {
        list.push({
          id: `teacher_${t.id}`,
          type: 'teacher',
          firstName: t.first_name,
          lastName: t.last_name,
          employeeNumber: t.employee_number || 'TCH',
          designation: 'Teacher / Faculty',
          photoUrl: t.photo_url,
          status: t.status,
        });
      });
    }

    if (activeCategory === 'all' || activeCategory === 'staff') {
      staffList.forEach((s) => {
        list.push({
          id: `staff_${s.id}`,
          type: 'staff',
          firstName: s.first_name,
          lastName: s.last_name,
          employeeNumber: s.employee_number || 'STF',
          designation: s.custom_staff_type || s.staff_type.replace('_', ' '),
          department: s.department || 'General Administration',
          photoUrl: s.photo_url,
          status: s.status,
        });
      });
    }

    return list.filter((m) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q) ||
        m.employeeNumber.toLowerCase().includes(q) ||
        m.designation.toLowerCase().includes(q)
      );
    });
  }, [teachers, staffList, activeCategory, searchQuery]);

  // Attendance metrics summary
  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    const total = Object.keys(attendanceMap).length;

    Object.values(attendanceMap).forEach((val) => {
      if (val.status === 'present') present++;
      else if (val.status === 'absent') absent++;
      else if (val.status === 'leave') leave++;
    });

    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, leave, percentage };
  }, [attendanceMap]);

  // Candidates for Grant Leave Modal with Search & Category filtering
  const grantCandidateList = useMemo(() => {
    const list: Array<{
      id: string;
      rawId: string;
      type: 'teacher' | 'staff';
      name: string;
      empId: string;
      designation: string;
      department?: string;
      photoUrl?: string;
    }> = [];

    if (grantFilterCategory === 'all' || grantFilterCategory === 'teacher') {
      teachers.forEach((t) => {
        list.push({
          id: `teacher_${t.id}`,
          rawId: t.id,
          type: 'teacher',
          name: `${t.first_name} ${t.last_name}`,
          empId: t.employee_number || 'TCH',
          designation: 'Teacher / Faculty',
          photoUrl: t.photo_url,
        });
      });
    }

    if (grantFilterCategory === 'all' || grantFilterCategory === 'staff') {
      staffList.forEach((s) => {
        list.push({
          id: `staff_${s.id}`,
          rawId: s.id,
          type: 'staff',
          name: `${s.first_name} ${s.last_name}`,
          empId: s.employee_number || 'STF',
          designation: s.custom_staff_type || s.staff_type.replace('_', ' '),
          department: s.department || 'Staff & Support',
          photoUrl: s.photo_url,
        });
      });
    }

    if (!grantSearchQuery.trim()) return list;
    const q = grantSearchQuery.toLowerCase();
    return list.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.empId.toLowerCase().includes(q) ||
        item.designation.toLowerCase().includes(q) ||
        (item.department && item.department.toLowerCase().includes(q))
    );
  }, [teachers, staffList, grantFilterCategory, grantSearchQuery]);

  const selectedCandidate = useMemo(() => {
    if (!grantMemberId) return null;
    if (grantCategory === 'teacher') {
      const t = teachers.find((item) => item.id === grantMemberId);
      if (!t) return null;
      return {
        id: `teacher_${t.id}`,
        rawId: t.id,
        type: 'teacher' as const,
        name: `${t.first_name} ${t.last_name}`,
        empId: t.employee_number || 'TCH',
        designation: 'Teacher / Faculty',
        photoUrl: t.photo_url,
      };
    } else {
      const s = staffList.find((item) => item.id === grantMemberId);
      if (!s) return null;
      return {
        id: `staff_${s.id}`,
        rawId: s.id,
        type: 'staff' as const,
        name: `${s.first_name} ${s.last_name}`,
        empId: s.employee_number || 'STF',
        designation: s.custom_staff_type || s.staff_type.replace('_', ' '),
        department: s.department || 'Staff & Support',
        photoUrl: s.photo_url,
      };
    }
  }, [grantMemberId, grantCategory, teachers, staffList]);

  // Handle single status change
  const handleStatusChange = (key: string, newStatus: AttendanceStatus) => {
    setAttendanceMap((prev) => {
      if (prev[key]?.isOnLeave) return prev; // Cannot override locked approved leave
      return {
        ...prev,
        [key]: {
          ...prev[key],
          status: newStatus,
        },
      };
    });
  };

  // Handle remarks change
  const handleRemarksChange = (key: string, remarks: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        remarks,
      },
    }));
  };

  // Mark all available as Present (keeps on-leave unchanged)
  const handleMarkAllPresent = () => {
    setAttendanceMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (!next[k].isOnLeave) {
          next[k] = { ...next[k], status: 'present' };
        }
      });
      return next;
    });
    success('All available teachers & staff marked as Present');
  };

  // Save Attendance to Backend
  const handleSaveAttendance = async () => {
    if (!schoolId) return;
    setIsSaving(true);
    try {
      const teacherRecords = teachers.map((t) => {
        const state = attendanceMap[`teacher_${t.id}`] || { status: 'present', remarks: '' };
        return {
          teacher: t,
          status: state.status,
          remarks: state.remarks,
        };
      });

      const staffRecords = staffList.map((s) => {
        const state = attendanceMap[`staff_${s.id}`] || { status: 'present', remarks: '' };
        return {
          staff: s,
          status: state.status,
          remarks: state.remarks,
        };
      });

      await Promise.all([
        teacherWorkforceService.saveAttendance(schoolId, selectedDate, teacherRecords, currentUser || undefined),
        staffWorkforceService.saveAttendance(schoolId, selectedDate, staffRecords, currentUser || undefined),
      ]);

      success(`Attendance for ${formatDate(selectedDate)} saved successfully!`);
      loadData();
    } catch {
      toastError('Failed to save attendance');
    } finally {
      setIsSaving(false);
    }
  };

  // Grant Leave Submit
  const handleGrantLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantMemberId) {
      toastError('Please select an employee or teacher');
      return;
    }
    if (grantForm.endDate < grantForm.startDate) {
      toastError('End date cannot be earlier than start date');
      return;
    }

    try {
      const calculatedReturnDate = grantForm.returnDate || nextDate(grantForm.endDate);

      if (grantCategory === 'teacher') {
        const t = teachers.find((item) => item.id === grantMemberId);
        if (!t) return;

        const created = await teacherWorkforceService.requestLeave({
          school_id: schoolId,
          teacher_id: t.id,
          leave_type: grantForm.leaveType,
          start_date: grantForm.startDate,
          end_date: grantForm.endDate,
          return_date: calculatedReturnDate,
          reason: grantForm.reason.trim(),
          admin_notes: grantForm.notes.trim() || 'Granted directly by School Administration',
          teacher_name: `${t.first_name} ${t.last_name}`,
          employee_number: t.employee_number,
        });

        await teacherWorkforceService.reviewLeave(
          created.id,
          {
            status: 'approved',
            admin_notes: grantForm.notes.trim() || 'Approved directly by Administrator',
          },
          currentUser || undefined
        );

        success(`Approved leave granted for Teacher ${t.first_name} ${t.last_name}`);
      } else {
        const s = staffList.find((item) => item.id === grantMemberId);
        if (!s) return;

        const created = await staffWorkforceService.requestLeave({
          school_id: schoolId,
          staff_id: s.id,
          leave_type: grantForm.leaveType,
          start_date: grantForm.startDate,
          end_date: grantForm.endDate,
          return_date: calculatedReturnDate,
          reason: grantForm.reason.trim(),
          admin_notes: grantForm.notes.trim() || 'Granted directly by School Administration',
          staff_name: `${s.first_name} ${s.last_name}`,
          staff_type: s.staff_type,
          employee_number: s.employee_number,
        });

        await staffWorkforceService.reviewLeave(
          created.id,
          {
            status: 'approved',
            admin_notes: grantForm.notes.trim() || 'Approved directly by Administrator',
          },
          currentUser || undefined
        );

        success(`Approved leave granted for Staff ${s.first_name} ${s.last_name}`);
      }

      setIsGrantLeaveModalOpen(false);
      loadData();
    } catch {
      toastError('Failed to grant leave request');
    }
  };

  // Open Review Leave
  const handleOpenReview = (leave: TeacherLeave | StaffLeave, type: 'teacher' | 'staff') => {
    setReviewingLeave({ leave, type });
    setReviewForm({
      startDate: leave.start_date,
      endDate: leave.end_date,
      returnDate: leave.return_date,
      notes: leave.admin_notes || '',
    });
  };

  // Decide on Review
  const handleDecideReview = async (decision: 'approved' | 'rejected') => {
    if (!reviewingLeave) return;
    try {
      if (reviewingLeave.type === 'teacher') {
        await teacherWorkforceService.reviewLeave(
          reviewingLeave.leave.id,
          {
            status: decision,
            start_date: reviewForm.startDate,
            end_date: reviewForm.endDate,
            return_date: reviewForm.returnDate,
            admin_notes: reviewForm.notes,
          },
          currentUser || undefined
        );
      } else {
        await staffWorkforceService.reviewLeave(
          reviewingLeave.leave.id,
          {
            status: decision,
            start_date: reviewForm.startDate,
            end_date: reviewForm.endDate,
            return_date: reviewForm.returnDate,
            admin_notes: reviewForm.notes,
          },
          currentUser || undefined
        );
      }
      success(`Leave request ${decision}`);
      setReviewingLeave(null);
      loadData();
    } catch {
      toastError(`Failed to update leave request`);
    }
  };

  const allLeaves = useMemo(() => {
    const list: Array<(TeacherLeave | StaffLeave) & { memberType: 'teacher' | 'staff' }> = [
      ...teacherLeaves.map((l) => ({ ...l, memberType: 'teacher' as const })),
      ...staffLeaves.map((l) => ({ ...l, memberType: 'staff' as const })),
    ];
    return list.sort((a, b) => b.requested_at.localeCompare(a.requested_at));
  }, [teacherLeaves, staffLeaves]);

  return (
    <div className="space-y-6 text-left max-w-6xl pb-12">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-indigo-600" />
            Teacher & Staff Attendance
          </h1>
        </div>

        {/* Compact, Clean Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Picker Input */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Grant Leave Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setGrantSearchQuery('');
              setGrantFilterCategory('all');
              setGrantCategory('teacher');
              setGrantMemberId(teachers[0]?.id || staffList[0]?.id || '');
              setGrantForm({
                leaveType: 'full_day',
                startDate: selectedDate,
                endDate: selectedDate,
                returnDate: nextDate(selectedDate),
                reason: '',
                notes: '',
              });
              setIsGrantLeaveModalOpen(true);
            }}
            leftIcon={<Palmtree className="w-3.5 h-3.5 text-amber-600" />}
          >
            + Grant Leave
          </Button>

          {/* Assign Coverage Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedAbsentMemberForCoverage(null);
              setIsCoverageModalOpen(true);
            }}
            leftIcon={<UserCheck className="w-3.5 h-3.5 text-indigo-600" />}
            className="text-indigo-700 border-indigo-200 hover:bg-indigo-50"
          >
            + Assign Coverage
          </Button>

          {/* Save Attendance Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveAttendance}
            isLoading={isSaving}
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Save Attendance
          </Button>
        </div>
      </div>

      {/* 2. Stat Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Total Workforce</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900">{summary.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Faculty + Staff Personnel</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-700">Present Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-emerald-700">{summary.present}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">{summary.percentage}% attendance</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-rose-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-700">Absent</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-rose-700">{summary.absent}</div>
          <div className="text-[10px] text-rose-500 mt-0.5">Unexcused Absence</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-amber-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-700">Approved Leave</span>
            <Palmtree className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-amber-700">{summary.leave}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Official Sanctioned</div>
        </div>
      </div>

      {/* 3. Filter Bar & Quick Actions */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Personnel ({teachers.length + staffList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('teachers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeCategory === 'teachers'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Teachers & Faculty ({teachers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('staff')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeCategory === 'staff'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Staff & Support ({staffList.length})
          </button>
        </div>

        {/* Search & Bulk Quick Action */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ID or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-400 transition-all"
            />
          </div>

          <Button
            variant="outline"
            size="xs"
            onClick={handleMarkAllPresent}
            leftIcon={<CheckCheck className="w-3.5 h-3.5 text-emerald-600" />}
            title="Mark all active members as Present (leaves stay preserved)"
          >
            Mark All Present
          </Button>
        </div>
      </div>

      {/* 4. Roll Call Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Roll Call Roster</span>
            <span className="text-xs font-normal text-slate-500">
              ({unifiedMembers.length} records)
            </span>
          </h3>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            {formatDate(selectedDate)}
          </span>
        </div>

        {isLoading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : unifiedMembers.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700 text-xs">No personnel found for this selection</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Try clearing filters or search query</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {unifiedMembers.map((member) => {
              const state = attendanceMap[member.id] || {
                status: 'present',
                remarks: '',
                isOnLeave: false,
              };

              const linkHref =
                member.type === 'teacher'
                  ? `/admin/teachers/${member.id.replace('teacher_', '')}`
                  : `/admin/staff/${member.id.replace('staff_', '')}`;

              return (
                <div
                  key={member.id}
                  className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    state.isOnLeave
                      ? 'bg-amber-50/40 hover:bg-amber-50/60'
                      : state.status === 'absent'
                      ? 'bg-rose-50/30 hover:bg-rose-50/50'
                      : 'hover:bg-slate-50/70'
                  }`}
                >
                  {/* Member Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <Link href={linkHref} className="group shrink-0">
                      {member.photoUrl ? (
                        <img
                          src={member.photoUrl}
                          alt=""
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 group-hover:border-indigo-400 transition-colors"
                        />
                      ) : (
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${
                            member.type === 'teacher'
                              ? 'bg-indigo-100 text-indigo-700 group-hover:bg-indigo-200'
                              : 'bg-teal-100 text-teal-700 group-hover:bg-teal-200'
                          }`}
                        >
                          {member.firstName[0]}
                          {member.lastName ? member.lastName[0] : ''}
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={linkHref}
                          className="font-bold text-slate-900 text-xs hover:text-indigo-600 hover:underline truncate"
                        >
                          {member.firstName} {member.lastName}
                        </Link>

                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                            member.type === 'teacher'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-teal-50 text-teal-700 border-teal-200'
                          }`}
                        >
                          {member.designation}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        <span className="font-mono">{member.employeeNumber}</span>
                        {member.department && (
                          <>
                            <span>•</span>
                            <span>{member.department}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Attendance Marking / Leave Display */}
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    {/* Optional Quick Remarks */}
                    {!state.isOnLeave && (
                      <input
                        type="text"
                        placeholder="Remarks (optional)..."
                        value={state.remarks}
                        onChange={(e) => handleRemarksChange(member.id, e.target.value)}
                        className="hidden md:block w-36 px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:border-indigo-300"
                      />
                    )}

                    {/* IF ON APPROVED LEAVE: Auto-chosen Leave badge; HIDE P & A options */}
                    {state.isOnLeave ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-amber-100 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-xl shadow-2xs">
                          <Palmtree className="w-3.5 h-3.5 text-amber-700" />
                          <span className="text-xs font-bold">🏖️ On Approved Leave</span>
                          {state.leaveReason && (
                            <span className="text-[11px] text-amber-800 font-medium hidden sm:inline">
                              ({state.leaveReason})
                            </span>
                          )}
                        </div>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setSelectedAbsentMemberForCoverage({
                              id: member.id,
                              name: `${member.firstName} ${member.lastName}`,
                              role: member.type,
                              employeeNumber: member.employeeNumber,
                            });
                            setIsCoverageModalOpen(true);
                          }}
                          leftIcon={<UserCheck className="w-3 h-3 text-indigo-600" />}
                          className="text-[11px] font-semibold text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                        >
                          Cover
                        </Button>
                      </div>
                    ) : (
                      /* REGULAR ROLL CALL BUTTONS (P / A / L) */
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        {/* P (Present) */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(member.id, 'present')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            state.status === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          P (Present)
                        </button>

                        {/* A (Absent) */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(member.id, 'absent')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            state.status === 'absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          A (Absent)
                        </button>

                        {/* L (Leave) */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(member.id, 'leave')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            state.status === 'leave'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          L (Leave)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Leave Requests & Management Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Palmtree className="w-4 h-4 text-amber-600" />
              Teacher & Staff Leave Records ({allLeaves.length})
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Review employee submitted leave requests and official sanctions
            </p>
          </div>

          <Button
            variant="outline"
            size="xs"
            onClick={() => {
              setGrantSearchQuery('');
              setGrantFilterCategory('all');
              setGrantCategory('teacher');
              setGrantMemberId(teachers[0]?.id || staffList[0]?.id || '');
              setGrantForm({
                leaveType: 'full_day',
                startDate: selectedDate,
                endDate: selectedDate,
                returnDate: nextDate(selectedDate),
                reason: '',
                notes: '',
              });
              setIsGrantLeaveModalOpen(true);
            }}
            leftIcon={<Palmtree className="w-3.5 h-3.5 text-amber-600" />}
          >
            + Grant Leave
          </Button>
        </div>

        {allLeaves.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No leave records filed for this period.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {allLeaves.map((leave) => {
              const name =
                leave.memberType === 'teacher'
                  ? (leave as TeacherLeave).teacher_name
                  : (leave as StaffLeave).staff_name;
              const memberId =
                leave.memberType === 'teacher'
                  ? (leave as TeacherLeave).teacher_id
                  : (leave as StaffLeave).staff_id;
              const link =
                leave.memberType === 'teacher'
                  ? `/admin/teachers/${(leave as TeacherLeave).teacher_id}`
                  : `/admin/staff/${(leave as StaffLeave).staff_id}`;

              return (
                <div
                  key={leave.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={link}
                        className="font-bold text-xs text-indigo-700 hover:underline"
                      >
                        {name || 'Employee'}
                      </Link>
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {leave.memberType}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">
                        {formatDate(leave.start_date)}
                      </span>{' '}
                      to{' '}
                      <span className="font-semibold text-slate-800">
                        {formatDate(leave.end_date)}
                      </span>{' '}
                      · Expected Return:{' '}
                      <span className="font-semibold text-indigo-700">
                        {formatDate(leave.return_date)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 italic">"{leave.reason}"</p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        leave.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : leave.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {leave.status.toUpperCase()}
                    </span>

                    {leave.status === 'approved' && (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setSelectedAbsentMemberForCoverage({
                            id: memberId,
                            name: name || 'Employee',
                            role: leave.memberType,
                          });
                          setIsCoverageModalOpen(true);
                        }}
                        leftIcon={<UserCheck className="w-3 h-3 text-indigo-600" />}
                        className="text-[11px] font-semibold text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                      >
                        + Assign Coverage
                      </Button>
                    )}

                    {leave.status === 'pending' && (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleOpenReview(leave, leave.memberType)}
                      >
                        Review / Modify
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* MODAL: Grant Leave to Teacher or Staff                               */}
      {/* -------------------------------------------------------------------- */}
      {isGrantLeaveModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsGrantLeaveModalOpen(false)}
          title="Grant Employee Leave"
          description="Directly grant and approve official leave for any Teacher or Staff member"
        >
          <form onSubmit={handleGrantLeaveSubmit} className="space-y-4 text-xs text-left">
            {/* Searchable Personnel Selector */}
            <div className="space-y-2">
              <label className="block font-semibold text-slate-700">
                Select Employee / Faculty (Search by Name or Employee ID) <span className="text-rose-500">*</span>
              </label>

              {/* Filter Tabs & Search Bar */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGrantFilterCategory('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      grantFilterCategory === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({teachers.length + staffList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setGrantFilterCategory('teacher')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      grantFilterCategory === 'teacher'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Teachers ({teachers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setGrantFilterCategory('staff')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      grantFilterCategory === 'staff'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Staff & Support ({staffList.length})
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by Employee ID (e.g. TCH-814, STF-ACC-66) or name..."
                    value={grantSearchQuery}
                    onChange={(e) => setGrantSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  {grantSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setGrantSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Candidate List */}
              <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-slate-200 bg-slate-50/50 p-1.5">
                {grantCandidateList.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No teacher or staff matching "{grantSearchQuery}"
                  </div>
                ) : (
                  grantCandidateList.map((cand) => {
                    const isSelected = grantMemberId === cand.rawId && grantCategory === cand.type;
                    return (
                      <button
                        key={cand.id}
                        type="button"
                        onClick={() => {
                          setGrantMemberId(cand.rawId);
                          setGrantCategory(cand.type);
                        }}
                        className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border border-indigo-300 text-indigo-900 shadow-2xs'
                            : 'bg-white hover:bg-slate-100 border border-transparent text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {cand.photoUrl ? (
                            <img
                              src={cand.photoUrl}
                              alt=""
                              className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                            />
                          ) : (
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                                cand.type === 'teacher'
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'bg-teal-100 text-teal-700'
                              }`}
                            >
                              {cand.name[0]}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-bold text-xs truncate">{cand.name}</span>
                              <span
                                className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                                  cand.type === 'teacher'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : 'bg-teal-100 text-teal-800'
                                }`}
                              >
                                {cand.type === 'teacher' ? 'Teacher' : cand.designation}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 block">
                              ID: {cand.empId} {cand.department ? `• ${cand.department}` : ''}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-1 text-indigo-600 font-bold text-xs shrink-0 pr-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Selected</span>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Selected Personnel Banner */}
              {selectedCandidate && (
                <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between text-xs text-indigo-900">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600">Selected:</span>
                    <strong className="font-bold">{selectedCandidate.name}</strong>
                    <span className="font-mono text-[11px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-semibold">
                      {selectedCandidate.empId}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    {selectedCandidate.type === 'teacher' ? 'Teacher' : selectedCandidate.designation}
                  </span>
                </div>
              )}
            </div>

            {/* Leave Type */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Leave Type</label>
              <select
                value={grantForm.leaveType}
                onChange={(e) => setGrantForm({ ...grantForm, leaveType: e.target.value as LeaveType })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium"
              >
                <option value="full_day">Full Day Leave</option>
                <option value="partial_day">Partial / Half Day Leave</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                label="Start Date"
                type="date"
                required
                value={grantForm.startDate}
                onChange={(e) => {
                  const s = e.target.value;
                  setGrantForm({
                    ...grantForm,
                    startDate: s,
                    endDate: s > grantForm.endDate ? s : grantForm.endDate,
                    returnDate: nextDate(s > grantForm.endDate ? s : grantForm.endDate),
                  });
                }}
              />

              <Input
                label="End Date"
                type="date"
                required
                min={grantForm.startDate}
                value={grantForm.endDate}
                onChange={(e) => {
                  const end = e.target.value;
                  setGrantForm({
                    ...grantForm,
                    endDate: end,
                    returnDate: nextDate(end),
                  });
                }}
              />

              <Input
                label="Expected Return Date"
                type="date"
                required
                min={nextDate(grantForm.endDate)}
                value={grantForm.returnDate}
                onChange={(e) => setGrantForm({ ...grantForm, returnDate: e.target.value })}
              />
            </div>

            {/* Reason */}
            <Input
              label="Reason for Leave"
              required
              placeholder="e.g. Medical emergency, family function, annual vacation"
              value={grantForm.reason}
              onChange={(e) => setGrantForm({ ...grantForm, reason: e.target.value })}
            />

            {/* Admin Notes */}
            <Input
              label="Administrative Note (Optional)"
              placeholder="Approval conditions, proxy teacher assigned, or remarks"
              value={grantForm.notes}
              onChange={(e) => setGrantForm({ ...grantForm, notes: e.target.value })}
            />

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsGrantLeaveModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Grant & Approve Leave
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL: Review Pending Leave Request                                  */}
      {/* -------------------------------------------------------------------- */}
      {reviewingLeave && (
        <Modal
          isOpen={true}
          onClose={() => setReviewingLeave(null)}
          title="Review Leave Request"
          description="School administrator can modify dates and approve or reject the request"
        >
          <div className="space-y-3 text-xs text-left">
            <div className="grid grid-cols-3 gap-2">
              <Input
                label="Start Date"
                type="date"
                value={reviewForm.startDate}
                onChange={(e) => setReviewForm({ ...reviewForm, startDate: e.target.value })}
              />
              <Input
                label="End Date"
                type="date"
                value={reviewForm.endDate}
                onChange={(e) => setReviewForm({ ...reviewForm, endDate: e.target.value })}
              />
              <Input
                label="Return Date"
                type="date"
                value={reviewForm.returnDate}
                onChange={(e) => setReviewForm({ ...reviewForm, returnDate: e.target.value })}
              />
            </div>

            <Input
              label="Admin Notes"
              value={reviewForm.notes}
              onChange={(e) => setReviewForm({ ...reviewForm, notes: e.target.value })}
              placeholder="Conditions or handover instructions"
            />

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDecideReview('rejected')}
              >
                Reject Request
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDecideReview('approved')}
              >
                Approve Leave
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Temporary Coverage Assignment Modal */}
      <TemporaryAssignmentModal
        isOpen={isCoverageModalOpen}
        onClose={() => {
          setIsCoverageModalOpen(false);
          setSelectedAbsentMemberForCoverage(null);
        }}
        onSuccess={() => loadData()}
        preselectedAbsentMember={
          selectedAbsentMemberForCoverage
            ? {
                id: selectedAbsentMemberForCoverage.id,
                name: selectedAbsentMemberForCoverage.name,
                role: selectedAbsentMemberForCoverage.role,
                employeeNumber: selectedAbsentMemberForCoverage.employeeNumber,
              }
            : undefined
        }
      />
    </div>
  );
}
