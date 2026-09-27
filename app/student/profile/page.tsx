'use client';

// ============================================================================
// Student Profile & Personal Attendance View
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { studentService, attendanceService, leaveService } from '@/lib/services/api';
import { Student, StudentAttendance, StudentLeave } from '@/lib/types';
import { formatDate } from '@/lib/utils/formatters';
import { Phone, Mail, MapPin, CalendarCheck, Clock, CheckCircle2, XCircle, Users } from 'lucide-react';
import { CardSkeleton, TableSkeleton } from '@/components/ui/skeleton';
import { UserPasswordCard } from '@/components/auth/user-password-modal';

export default function StudentProfilePage() {
  const { currentUser, currentSchool } = useAuth();
  const studentId = currentUser?.student_id || 'std-001';
  const schoolId = currentSchool?.id || 'sch-001';

  const [student, setStudent] = useState<Student | null>(null);
  const [siblings, setSiblings] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [activeLeave, setActiveLeave] = useState<StudentLeave | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStudent() {
      setIsLoading(true);
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const [s, attList, activeLv, sibList] = await Promise.all([
          studentService.getStudentById(studentId),
          attendanceService.getAttendance(schoolId, { studentId }),
          leaveService.getActiveLeaveForStudent(studentId, todayStr),
          studentService.getStudentSiblings(studentId, schoolId).catch(() => []),
        ]);
        setStudent(s);
        setAttendance(attList);
        setActiveLeave(activeLv || s?.active_leave || null);
        setSiblings(sibList || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStudent();
  }, [schoolId, studentId]);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const presentDays = attendance.filter((a) => a.status === 'present').length;
  const absentDays = attendance.filter((a) => a.status === 'absent').length;
  const leaveDays = attendance.filter((a) => a.status === 'leave').length;
  const totalWorkingDays = Math.max(1, presentDays + absentDays);
  const attendanceRate = Math.round((presentDays / totalWorkingDays) * 100);

  return (
    <div className="space-y-6 text-left max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Student Profile</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Personal identification, parent contact details, and attendance record
        </p>
      </div>

      {/* Active Leave Banner */}
      {activeLeave && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <strong className="font-bold text-sm block">ON APPROVED LEAVE</strong>
            <span>
              {formatDate(activeLeave.start_date)} to {formatDate(activeLeave.end_date)} — {activeLeave.reason}
            </span>
          </div>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        {/* Header Avatar & Basic */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold">
            {student?.first_name?.[0] || 'R'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {student?.first_name} {student?.last_name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="font-mono text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                Login ID / Reg: {student?.registration_number}
              </span>
              <span>•</span>
              <span>{student?.current_enrollment?.class_name} ({student?.current_enrollment?.section_name})</span>
              <span>•</span>
              <span className="font-bold text-slate-700">Roll: {student?.current_enrollment?.roll_number}</span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-4">
            <h3 className="font-bold uppercase tracking-wider text-slate-400">
              Personal Information
            </h3>
            <div className="space-y-2.5">
              <div>
                <span className="text-slate-400">Date of Birth:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{formatDate(student?.date_of_birth)}</p>
              </div>
              <div>
                <span className="text-slate-400">Gender:</span>
                <p className="font-semibold text-slate-900 capitalize mt-0.5">{student?.gender || '—'}</p>
              </div>
              <div>
                <span className="text-slate-400">Date of Admission:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{formatDate(student?.joining_date)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold uppercase tracking-wider text-slate-400">
              Parent / Guardian Details
            </h3>
            <div className="space-y-2.5">
              <div>
                <span className="text-slate-400">Guardian Name:</span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {student?.guardian?.guardian_name || student?.guardian?.father_name || '—'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Phone:</span>
                <span className="font-semibold font-mono text-slate-900">{student?.guardian?.primary_phone}</span>
              </div>
              {student?.guardian?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400">Email:</span>
                  <span className="text-slate-900">{student.guardian.email}</span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400">Address:</span>
                  <p className="text-slate-700 mt-0.5">{student?.guardian?.address || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sibling Card (if any) */}
        {siblings.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <h3 className="font-bold uppercase tracking-wider text-slate-400 text-xs mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              My Siblings Studying Here ({siblings.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {siblings.map((sib) => (
                <div key={sib.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                    {sib.photo_url ? (
                      <img src={sib.photo_url} alt={sib.first_name} className="w-full h-full object-cover" />
                    ) : (
                      sib.first_name?.[0] || 'S'
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">
                      {sib.first_name} {sib.last_name}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {sib.current_enrollment?.class_name || 'Class'} {sib.current_enrollment?.section_name ? `(${sib.current_enrollment.section_name})` : ''} • Roll: {sib.current_enrollment?.roll_number || '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attendance Analytics & History Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Attendance Compliance</h3>
          </div>
          <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100">
            {attendanceRate}% Present
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-400">Present</span>
            <p className="font-bold text-emerald-600 text-base mt-0.5">{presentDays}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-400">Absent</span>
            <p className="font-bold text-rose-600 text-base mt-0.5">{absentDays}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-400">Approved Leave</span>
            <p className="font-bold text-amber-600 text-base mt-0.5">{leaveDays}</p>
          </div>
        </div>

        {attendance.length > 0 && (
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Recent Roll-Call Records
            </h4>
            <div className="divide-y divide-slate-100 text-xs">
              {attendance.slice(0, 5).map((a) => (
                <div key={a.id} className="py-2 flex items-center justify-between">
                  <span className="font-medium text-slate-700">{formatDate(a.attendance_date)}</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      a.status === 'present'
                        ? 'bg-emerald-100 text-emerald-800'
                        : a.status === 'absent'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Account Password & Direct Login Security */}
      <UserPasswordCard />
    </div>
  );
}
