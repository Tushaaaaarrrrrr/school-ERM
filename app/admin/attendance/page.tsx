'use client';

// ============================================================================
// School Admin Attendance Management & Multi-Range Analytics
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { attendanceService, classService, holidayService, studentService, leaveService } from '@/lib/services/api';
import { StudentAttendance, AttendanceStatus, SchoolClass, SchoolHoliday, Student, StudentLeave } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { DateInput } from '@/components/ui/date-input';
import { useToast } from '@/components/ui/toast';
import { formatDate, formatTime } from '@/lib/utils/formatters';
import {
  CalendarCheck,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  Palmtree,
  Calendar,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Plus,
  Trash2,
  CheckCheck,
  Check,
  UserCheck,
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';

export default function AdminAttendancePage() {
  const { currentSchool, currentUser } = useAuth();
  const schoolId = currentSchool?.id || '';
  const { success, error: toastError } = useToast();

  // Mode: 'today' | 'monthly' | 'yearly'
  const [viewMode, setViewMode] = useState<'today' | 'monthly' | 'yearly'>('today');

  // Today State
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [summary, setSummary] = useState<{
    totalPresent: number;
    totalAbsent: number;
    totalLeave: number;
    totalPartial: number;
    totalStudents: number;
    attendancePercentage: number;
    byClass: { class_name: string; total: number; present: number; absent: number; leave: number }[];
  } | null>(null);

  const [records, setRecords] = useState<StudentAttendance[]>([]);
  const [allRecords, setAllRecords] = useState<StudentAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Monthly State
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Yearly State
  const currentCalendarYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(`${currentCalendarYear}-${String(currentCalendarYear + 1).slice(-2)}`);

  // Take Attendance Modal State (School Admin Action)
  const [isTakeAttendanceModalOpen, setIsTakeAttendanceModalOpen] = useState(false);
  const [takeClassId, setTakeClassId] = useState<string>('');
  const [takeDate, setTakeDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [takeStudents, setTakeStudents] = useState<Student[]>([]);
  const [takeAttendanceMap, setTakeAttendanceMap] = useState<
    Record<string, { status: AttendanceStatus; remarks: string; isOnLeave: boolean; leaveReason?: string }>
  >({});
  const [isLoadingTakeStudents, setIsLoadingTakeStudents] = useState(false);
  const [isSavingTakeAttendance, setIsSavingTakeAttendance] = useState(false);

  // Holidays Modal State
  const [isHolidaysModalOpen, setIsHolidaysModalOpen] = useState(false);
  const [holidays, setHolidays] = useState<SchoolHoliday[]>([]);
  const [newHoliday, setNewHoliday] = useState({ name: '', startDate: '', endDate: '', description: '' });

  // Correction Modal State
  const [selectedRecord, setSelectedRecord] = useState<StudentAttendance | null>(null);
  const [correctionStatus, setCorrectionStatus] = useState<AttendanceStatus>('present');
  const [correctionRemarks, setCorrectionRemarks] = useState('');
  const [isSavingCorrection, setIsSavingCorrection] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sum, clsList, attList, completeAttList, holList] = await Promise.all([
        attendanceService.getTodayAttendanceSummary(schoolId, selectedDate),
        classService.getClasses(schoolId),
        attendanceService.getAttendance(schoolId, {
          date: selectedDate,
          classId: selectedClassId === 'all' ? undefined : selectedClassId,
        }),
        attendanceService.getAttendance(schoolId),
        holidayService.getHolidays(schoolId),
      ]);

      setSummary(sum);
      setClasses(clsList);
      setRecords(attList);
      setAllRecords(completeAttList);
      setHolidays(holList);
    } catch {
      toastError('Failed to load attendance records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolId, selectedDate, selectedClassId]);

  const monthlyAnalytics = useMemo(() => {
    const monthRecords = allRecords.filter((record) => record.attendance_date.startsWith(selectedMonth));
    const markedDates = new Set(monthRecords.map((record) => record.attendance_date));
    const present = monthRecords.filter((record) => record.status === 'present').length;
    const rate = monthRecords.length > 0 ? (present / monthRecords.length) * 100 : null;
    const averagePresent = markedDates.size > 0 ? present / markedDates.size : null;
    const classRows = classes.map((schoolClass) => {
      const classRecords = monthRecords.filter((record) => record.class_id === schoolClass.id);
      const classPresent = classRecords.filter((record) => record.status === 'present').length;
      return { id: schoolClass.id, name: schoolClass.name, teacher: schoolClass.class_teacher_name, rate: classRecords.length > 0 ? (classPresent / classRecords.length) * 100 : null };
    }).filter((row) => row.rate !== null).sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0));
    return { rate, workingDays: markedDates.size, averagePresent, classRows, hasData: monthRecords.length > 0 };
  }, [allRecords, classes, selectedMonth]);

  const yearlyAnalytics = useMemo(() => {
    const startYear = Number(selectedYear.split('-')[0]);
    const yearRecords = Number.isFinite(startYear) ? allRecords.filter((record) => record.attendance_date >= `${startYear}-04-01` && record.attendance_date <= `${startYear + 1}-03-31`) : [];
    const monthGroups = new Map<string, StudentAttendance[]>();
    yearRecords.forEach((record) => {
      const key = record.attendance_date.slice(0, 7);
      monthGroups.set(key, [...(monthGroups.get(key) || []), record]);
    });
    const months = [...monthGroups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, items]) => ({
      key,
      label: new Date(`${key}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short' }),
      rate: (items.filter((record) => record.status === 'present').length / items.length) * 100,
    }));
    const studentGroups = new Map<string, StudentAttendance[]>();
    yearRecords.forEach((record) => studentGroups.set(record.student_id, [...(studentGroups.get(record.student_id) || []), record]));
    const absentStudents = [...studentGroups.entries()].map(([studentId, items]) => {
      const first = items[0];
      return {
        studentId,
        name: first.student_name || 'Unnamed student',
        className: first.class_name || 'Class not recorded',
        absentDays: items.filter((record) => record.status === 'absent').length,
        rate: (items.filter((record) => record.status === 'present').length / items.length) * 100,
      };
    }).filter((student) => student.absentDays > 0).sort((a, b) => b.absentDays - a.absentDays);
    return { months, absentStudents, hasData: yearRecords.length > 0 };
  }, [allRecords, selectedYear]);

  const loadTakeStudents = async (classId: string, date: string) => {
    if (!classId) return;
    setIsLoadingTakeStudents(true);
    try {
      const [stdList, existingAtt, leaves] = await Promise.all([
        studentService.getStudents(schoolId, { classId }),
        attendanceService.getAttendance(schoolId, { classId, date }),
        leaveService.getLeaves(schoolId, { activeOnDate: date }),
      ]);

      setTakeStudents(stdList);

      const map: Record<string, { status: AttendanceStatus; remarks: string; isOnLeave: boolean; leaveReason?: string }> = {};
      stdList.forEach((st) => {
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
          map[st.id] = {
            status: 'present',
            remarks: '',
            isOnLeave: false,
          };
        }
      });

      setTakeAttendanceMap(map);
    } catch {
      toastError('Failed to load class students for attendance');
    } finally {
      setIsLoadingTakeStudents(false);
    }
  };

  const handleOpenTakeAttendance = (targetClassId?: string) => {
    const cId = targetClassId || (selectedClassId !== 'all' ? selectedClassId : classes[0]?.id || '');
    setTakeClassId(cId);
    setTakeDate(selectedDate);
    setIsTakeAttendanceModalOpen(true);
    if (cId) {
      loadTakeStudents(cId, selectedDate);
    }
  };

  const handleTakeStatusChange = (studentId: string, status: AttendanceStatus) => {
    setTakeAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleTakeMarkAll = (status: AttendanceStatus) => {
    setTakeAttendanceMap((prev) => {
      const next = { ...prev };
      takeStudents.forEach((st) => {
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

  const handleSaveTakeAttendance = async () => {
    if (!takeClassId || takeStudents.length === 0) {
      toastError('No students to submit attendance for');
      return;
    }

    setIsSavingTakeAttendance(true);
    try {
      const selectedClass = classes.find((c) => c.id === takeClassId);
      const sectionId = selectedClass?.sections?.[0]?.id || 'sec-default';

      const attendanceRecords = takeStudents.map((st) => ({
        student_id: st.id,
        status: takeAttendanceMap[st.id]?.status || 'present',
        remarks: takeAttendanceMap[st.id]?.remarks || '',
      }));

      const adminSubmitterName = `${currentUser?.name || 'School Administrator'} (Admin)`;

      await attendanceService.saveClassAttendance(
        schoolId,
        'ay-2026',
        takeClassId,
        sectionId,
        takeDate,
        attendanceRecords,
        currentUser?.id || 'usr-admin-01',
        adminSubmitterName
      );

      success(`Attendance submitted for ${selectedClass?.name || 'Class'} (${formatDate(takeDate)})`);
      setIsTakeAttendanceModalOpen(false);
      loadData();
    } catch {
      toastError('Failed to submit attendance');
    } finally {
      setIsSavingTakeAttendance(false);
    }
  };

  const takeStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    Object.values(takeAttendanceMap).forEach((val) => {
      if (val.status === 'present') present++;
      else if (val.status === 'absent') absent++;
      else if (val.status === 'leave') leave++;
    });
    return { present, absent, leave };
  }, [takeAttendanceMap]);

  const handleCorrectAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    setIsSavingCorrection(true);
    try {
      await attendanceService.correctAttendance(
        selectedRecord.id,
        correctionStatus,
        correctionRemarks.trim() || 'Corrected by School Admin',
        currentUser?.id || 'admin',
        `${currentUser?.name || 'School Administrator'} (Admin)`
      );

      success('Attendance record corrected and audited');
      setSelectedRecord(null);
      loadData();
    } catch {
      toastError('Failed to correct attendance');
    } finally {
      setIsSavingCorrection(false);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoliday.name || !newHoliday.startDate) return;

    try {
      await holidayService.createHoliday({
        school_id: schoolId,
        academic_year_id: 'ay-2026',
        name: newHoliday.name.trim(),
        start_date: newHoliday.startDate,
        end_date: newHoliday.endDate || newHoliday.startDate,
        description: newHoliday.description.trim() || undefined,
      });

      success('Holiday created successfully');
      setNewHoliday({ name: '', startDate: '', endDate: '', description: '' });
      const updatedHols = await holidayService.getHolidays(schoolId);
      setHolidays(updatedHols);
    } catch {
      toastError('Failed to add holiday');
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await holidayService.deleteHoliday(id);
      success('Holiday removed');
      const updatedHols = await holidayService.getHolidays(schoolId);
      setHolidays(updatedHols);
    } catch {
      toastError('Failed to delete holiday');
    }
  };

  return (
    <div className="space-y-6 text-left w-full">
      {/* Header with Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-6 h-6 text-indigo-600" /> Attendance Management
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Holidays Button */}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Palmtree className="w-4 h-4 text-emerald-600" />}
            onClick={() => setIsHolidaysModalOpen(true)}
          >
            Holidays ({holidays.length})
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<CalendarCheck className="w-4 h-4" />}
            onClick={() => handleOpenTakeAttendance()}
          >
            Take Attendance
          </Button>
        </div>
      </div>

      {/* Navigation View Modes */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
        {[
          { id: 'today', label: 'Today', icon: Clock },
          { id: 'monthly', label: 'Monthly Analytics', icon: Calendar },
          { id: 'yearly', label: 'Academic Year Trends', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = viewMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 1. TODAY'S ATTENDANCE VIEW                                           */}
      {/* -------------------------------------------------------------------- */}
      {viewMode === 'today' && (
        <div className="space-y-6">
          {/* Controls: Date Picker & Filter */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Selected Date:</label>
              <DateInput
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-36 text-xs py-1 font-semibold bg-slate-50 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">Filter by Class:</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white shadow-2xs"
              >
                <option value="all">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block">Total Enrolled</span>
              <span className="text-xl font-bold text-slate-900 mt-1">{summary?.totalStudents || 0}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
              <span className="text-[11px] font-semibold text-emerald-700 block">Present</span>
              <span className="text-xl font-bold text-emerald-800 mt-1">{summary?.totalPresent || 0}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs">
              <span className="text-[11px] font-semibold text-rose-700 block">Absent</span>
              <span className="text-xl font-bold text-rose-800 mt-1">{summary?.totalAbsent || 0}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs">
              <span className="text-[11px] font-semibold text-indigo-700 block">Attendance Rate</span>
              <span className="text-xl font-bold text-indigo-800 mt-1">
                {(summary?.attendancePercentage || 0).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Class-by-Class Attendance Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Class Attendance Overview (Today)
              </span>
              <span className="text-xs text-slate-400 font-semibold">{classes.length} Classes</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {classes.map((cls) => {
                const clsStats = summary?.byClass.find((bc) => bc.class_name === cls.name);
                const hasTaken = (clsStats?.present || 0) + (clsStats?.absent || 0) + (clsStats?.leave || 0) > 0;
                const classAttRecords = records.filter((r) => r.class_id === cls.id);
                const markedByName = classAttRecords.find((r) => r.marked_by_name)?.marked_by_name;

                return (
                  <div
                    key={cls.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900">{cls.name}</h3>
                        {hasTaken ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            Attendance Taken
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                            Not Taken
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 bg-emerald-50 rounded-xl">
                          <span className="text-[10px] text-emerald-700 font-semibold block">Present</span>
                          <span className="text-sm font-bold text-emerald-800">{clsStats?.present || 0}</span>
                        </div>
                        <div className="p-2 bg-rose-50 rounded-xl">
                          <span className="text-[10px] text-rose-700 font-semibold block">Absent</span>
                          <span className="text-sm font-bold text-rose-800">{clsStats?.absent || 0}</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl">
                          <span className="text-[10px] text-slate-500 font-semibold block">Leave</span>
                          <span className="text-sm font-bold text-slate-700">{clsStats?.leave || 0}</span>
                        </div>
                      </div>

                      {hasTaken && (
                        <div className="text-[11px] bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Submitted by:</span>
                          <span className="font-bold text-indigo-700">{markedByName || 'School Administrator (Admin)'}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Room: {cls.default_room_number || 'Not assigned'}</span>
                        <span className="font-semibold text-slate-700">Teacher: {cls.class_teacher_name || 'Not assigned'}</span>
                      </div>
                    </div>

                    <Button
                      variant={hasTaken ? "outline" : "primary"}
                      size="xs"
                      className="w-full text-xs font-semibold mt-2"
                      onClick={() => handleOpenTakeAttendance(cls.id)}
                    >
                      {hasTaken ? "Edit / Take Attendance" : "Take Attendance"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Student Detailed Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Detailed Roll Call Records ({records.length})
              </h3>
              <span className="text-xs text-slate-400 font-medium">{formatDate(selectedDate)}</span>
            </div>

            {isLoading ? (
              <TableSkeleton rows={5} cols={6} />
            ) : records.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Users className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                <h3 className="text-sm font-semibold text-slate-700">No attendance marked for this selection</h3>
                <p className="text-xs text-slate-400 mt-1">Select another date or take roll call for today.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Marked At</th>
                      <th className="py-3 px-4">Submitted By</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {records.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <Link href={`/admin/students/${r.student_id}`} className="hover:text-indigo-600">
                            {r.student_name || 'Unnamed student'}
                          </Link>
                          <span className="text-[11px] font-mono text-slate-400 block">{r.registration_number || 'Not assigned'}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{r.class_name || 'Not recorded'}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.status === 'present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.status === 'absent'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {r.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {r.marked_at ? formatTime(r.marked_at.split('T')[1]?.slice(0, 5)) : 'Not recorded'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                            {r.marked_by_name || 'School Administrator (Admin)'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedRecord(r);
                              setCorrectionStatus(r.status);
                              setCorrectionRemarks(r.remarks || '');
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                            title="Correct Attendance"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 2. MONTHLY ATTENDANCE ANALYTICS                                      */}
      {/* -------------------------------------------------------------------- */}
      {viewMode === 'monthly' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Attendance Report</h3>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">Month:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white shadow-2xs"
              />
            </div>
          </div>

          {/* Monthly KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 block">Average Attendance</span>
              <span className="text-2xl font-extrabold text-indigo-600 mt-1 block">{monthlyAnalytics.rate === null ? 'No data' : `${monthlyAnalytics.rate.toFixed(1)}%`}</span>
              <span className="text-[11px] text-slate-500 font-semibold mt-1 block">Calculated from recorded attendance</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 block">Total Working Days</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{monthlyAnalytics.workingDays} Days</span>
              <span className="text-[11px] text-slate-500 font-semibold mt-1 block">Days with submitted roll calls</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 block">Average Present Students</span>
              <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">{monthlyAnalytics.averagePresent === null ? 'No data' : `${monthlyAnalytics.averagePresent.toFixed(1)} / Day`}</span>
              <span className="text-[11px] text-slate-500 font-semibold mt-1 block">Across all active classrooms</span>
            </div>
          </div>

          {/* Class Attendance Rankings */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Class Attendance Rankings ({selectedMonth})</h3>

            <div className="space-y-3">
              {!monthlyAnalytics.hasData ? <p className="py-8 text-center text-sm text-slate-500">No attendance data for this month.</p> : monthlyAnalytics.classRows.map((item) => (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">
                      {item.name} {item.teacher && <span className="text-slate-400 font-normal">({item.teacher})</span>}
                    </span>
                    <span className="font-mono font-bold text-indigo-700">{item.rate?.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${item.rate ?? 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 3. ACADEMIC YEAR TRENDS                                              */}
      {/* -------------------------------------------------------------------- */}
      {viewMode === 'yearly' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Academic Year Attendance ({selectedYear})</h3>
            </div>

            <input
              aria-label="Academic year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              placeholder="2026-27"
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white shadow-2xs"
            />
          </div>

          {/* Month by Month Bar Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Month-by-Month Attendance Trajectory</h3>

            {!yearlyAnalytics.hasData ? <p className="py-12 text-center text-sm text-slate-500">No attendance data for this academic year.</p> : <div className="grid gap-2 pt-4 items-end h-48 border-b border-slate-200" style={{ gridTemplateColumns: `repeat(${yearlyAnalytics.months.length}, minmax(0, 1fr))` }}>
              {yearlyAnalytics.months.map((m) => (
                <div key={m.key} className="flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[11px] font-mono font-bold text-indigo-700">{m.rate.toFixed(1)}%</span>
                  <div
                    className="w-full max-w-[36px] bg-indigo-600 rounded-t-lg transition-all duration-500"
                    style={{ height: `${Math.max(m.rate, 2)}%` }}
                  />
                  <span className="text-xs font-semibold text-slate-500">{m.label}</span>
                </div>
              ))}
            </div>}
          </div>

          {/* Most Absent Watchlist */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Most Absent Students (Academic Year)</h3>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {yearlyAnalytics.absentStudents.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No student absences recorded for this academic year.</p> : yearlyAnalytics.absentStudents.map((st) => (
                <div key={st.studentId} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{st.name}</span>
                    <span className="text-slate-400">{st.className}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-rose-600 font-bold block">{st.absentDays} Days Absent</span>
                    <span className="text-slate-400 font-mono text-[11px]">{st.rate.toFixed(1)}% Attendance</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HOLIDAYS MODAL */}
      <Modal
        isOpen={isHolidaysModalOpen}
        onClose={() => setIsHolidaysModalOpen(false)}
        title="School Holidays Calendar"
        description="Declared school holidays and break periods"
      >
        <div className="space-y-4 text-xs text-left max-h-[70vh] overflow-y-auto pr-1">
          {/* Add Holiday Form */}
          <form onSubmit={handleAddHoliday} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900">Add New Holiday</h4>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Holiday Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Independence Day, Diwali Break"
                value={newHoliday.name}
                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <DateInput
                  label="Start Date"
                  required
                  value={newHoliday.startDate}
                  onChange={(e) => setNewHoliday({ ...newHoliday, startDate: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div>
                <DateInput
                  label="End Date"
                  value={newHoliday.endDate}
                  onChange={(e) => setNewHoliday({ ...newHoliday, endDate: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="sm" variant="primary">
                Add Holiday
              </Button>
            </div>
          </form>

          {/* Existing Holidays List */}
          <div className="space-y-2">
            <span className="font-bold text-slate-700 block">Declared Holidays</span>
            {holidays.length === 0 ? (
              <p className="text-slate-400 py-2">No holidays recorded yet.</p>
            ) : (
              holidays.map((hol) => (
                <div
                  key={hol.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                >
                  <div>
                    <h5 className="font-bold text-slate-900">{hol.name}</h5>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {formatDate(hol.start_date)} {hol.end_date && hol.end_date !== hol.start_date ? `— ${formatDate(hol.end_date)}` : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteHoliday(hol.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    title="Delete Holiday"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* CORRECTION MODAL */}
      {selectedRecord && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedRecord(null)}
          title={`Correct Attendance: ${selectedRecord.student_name || 'Student'}`}
          description={`Date: ${formatDate(selectedRecord.attendance_date)}`}
        >
          <form onSubmit={handleCorrectAttendance} className="space-y-4 text-xs text-left">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status *</label>
              <select
                value={correctionStatus}
                onChange={(e) => setCorrectionStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
              >
                <option value="present">Present in Class</option>
                <option value="absent">Absent</option>
                <option value="leave">Approved Leave</option>
                <option value="partial">Half Day / Partial</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Correction Remarks / Reason *</label>
              <input
                type="text"
                required
                placeholder="e.g. Corrected marked in error by teacher"
                value={correctionRemarks}
                onChange={(e) => setCorrectionRemarks(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedRecord(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSavingCorrection}>
                Save Correction
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* TAKE ATTENDANCE MODAL FOR SCHOOL ADMIN */}
      {isTakeAttendanceModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsTakeAttendanceModalOpen(false)}
          title="Take Student Attendance"
          description="Record or update class roll call as School Administrator"
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs text-left">
            {/* Header Controls */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Class *</label>
                <select
                  value={takeClassId}
                  onChange={(e) => {
                    setTakeClassId(e.target.value);
                    loadTakeStudents(e.target.value, takeDate);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-bold"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <DateInput
                  label="Attendance Date"
                  required
                  value={takeDate}
                  onChange={(e) => {
                    setTakeDate(e.target.value);
                    if (takeClassId) loadTakeStudents(takeClassId, e.target.value);
                  }}
                  className="text-xs font-medium"
                />
              </div>
            </div>

            {/* Quick Actions & Live Stats */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600">Quick Actions:</span>
                <button
                  type="button"
                  onClick={() => handleTakeMarkAll('present')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleTakeMarkAll('absent')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  Mark All Absent
                </button>
              </div>

              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  P: {takeStats.present}
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                  A: {takeStats.absent}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                  L: {takeStats.leave}
                </span>
              </div>
            </div>

            {/* Student Roster */}
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {isLoadingTakeStudents ? (
                <TableSkeleton rows={4} cols={3} />
              ) : takeStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">No students enrolled in this class.</p>
                  <p className="text-[11px] text-slate-400">Enroll students to start taking attendance.</p>
                </div>
              ) : (
                takeStudents.map((st) => {
                  const state = takeAttendanceMap[st.id] || { status: 'present', remarks: '', isOnLeave: false };
                  return (
                    <div
                      key={st.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                          {st.first_name?.[0] || 'S'}
                        </div>
                        <div className="truncate">
                          <h5 className="font-bold text-slate-900 text-xs truncate">
                            {st.first_name} {st.last_name}
                          </h5>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Roll #{st.current_enrollment?.roll_number || '1'} • {st.registration_number}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleTakeStatusChange(st.id, 'present')}
                          disabled={state.isOnLeave}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            state.status === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          } ${state.isOnLeave ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTakeStatusChange(st.id, 'absent')}
                          disabled={state.isOnLeave}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            state.status === 'absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          } ${state.isOnLeave ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          Absent
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTakeStatusChange(st.id, 'leave')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            state.status === 'leave'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Leave
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Submission Attribution Notice & Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 font-medium">
                Submission recorded as: <strong className="text-slate-800">{currentUser?.name || 'School Administrator'} (Admin)</strong>
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTakeAttendanceModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isSavingTakeAttendance}
                  disabled={takeStudents.length === 0}
                  onClick={handleSaveTakeAttendance}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Submit Attendance
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
