'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { teacherService, teacherWorkforceService } from '@/lib/services/api';
import type { LeaveType, Teacher, TeacherAttendance, TeacherLeave } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils/formatters';

export default function MyTeacherLeavePage() {
  const { currentSchool, currentUser } = useAuth();
  const schoolId = currentSchool?.id || '';
  const teacherId = currentUser?.teacher_id;
  const { success, error } = useToast();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [leaves, setLeaves] = useState<TeacherLeave[]>([]);
  const [attendance, setAttendance] = useState<TeacherAttendance[]>([]);
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ leaveType: 'full_day' as LeaveType, startDate: today, endDate: today, returnDate: today, reason: '' });

  const load = async () => {
    if (!schoolId || !teacherId) return;
    const [profile, leaveList, history] = await Promise.all([teacherService.getTeacherById(teacherId), teacherWorkforceService.getLeaves(schoolId, { teacherId }), teacherWorkforceService.getAttendance(schoolId, { teacherId })]);
    setTeacher(profile); setLeaves(leaveList); setAttendance(history);
  };
  useEffect(() => { load().catch(() => error('Failed to load your attendance and leaves')); }, [schoolId, teacherId]);

  if (!teacherId) return <div className="rounded-xl border border-amber-200 bg-amber-50 p-6"><h1 className="font-bold text-amber-950">Teacher profile setup is incomplete</h1><p className="mt-1 text-sm text-amber-800">Your school administrator must finish linking your approved account to a teacher record before you can request leave.</p></div>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher || !form.reason.trim() || form.endDate < form.startDate || form.returnDate <= form.endDate) { error('Enter valid leave dates, return date, and reason'); return; }
    await teacherWorkforceService.requestLeave({ school_id: schoolId, teacher_id: teacher.id, leave_type: form.leaveType, start_date: form.startDate, end_date: form.endDate, return_date: form.returnDate, reason: form.reason.trim(), teacher_name: `${teacher.first_name} ${teacher.last_name}`, employee_number: teacher.employee_number });
    success('Leave request submitted'); setOpen(false); load();
  };
  const present = attendance.filter((item) => item.status === 'present').length;
  const absent = attendance.filter((item) => item.status === 'absent').length;
  const active = leaves.find((item) => item.status === 'approved' && item.start_date <= today && item.end_date >= today);
  return <div className="space-y-6 w-full text-left"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">My Attendance & Leave</h1><p className="text-xs text-slate-500">View attendance, request leave, and track the decision.</p></div><Button onClick={() => setOpen(true)}>Request Leave</Button></div>
    {active && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm"><strong>Approved leave is active.</strong> Return joining date: <strong>{formatDate(active.return_date)}</strong></div>}
    <div className="grid grid-cols-3 gap-3"><div className="rounded-xl border bg-white p-4"><span className="text-xs text-slate-500">Present</span><strong className="block text-2xl">{present}</strong></div><div className="rounded-xl border bg-white p-4"><span className="text-xs text-slate-500">Absent</span><strong className="block text-2xl">{absent}</strong></div><div className="rounded-xl border bg-white p-4"><span className="text-xs text-slate-500">Pending Leave</span><strong className="block text-2xl">{leaves.filter((item) => item.status === 'pending').length}</strong></div></div>
    <div className="rounded-xl border bg-white"><h2 className="border-b p-4 font-bold">Leave history</h2>{leaves.length === 0 ? <p className="p-6 text-sm text-slate-500">No leave requests.</p> : leaves.map((leave) => <div key={leave.id} className="border-b p-4 text-sm"><div className="flex justify-between"><strong>{formatDate(leave.start_date)} – {formatDate(leave.end_date)}</strong><span className="font-bold uppercase">{leave.status}</span></div><p className="text-xs text-slate-600">{leave.reason}</p>{leave.status === 'approved' && <p className="mt-1 text-xs text-emerald-700">Return joining date: {formatDate(leave.return_date)}</p>}{leave.admin_notes && <p className="mt-1 text-xs">Admin note: {leave.admin_notes}</p>}</div>)}</div>
    <Modal isOpen={open} onClose={() => setOpen(false)} title="Request Teacher Leave" description="Your school administrator will review this request."><form onSubmit={submit} className="space-y-3"><Select label="Leave type" value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value as LeaveType })}><option value="full_day">Full day</option><option value="partial_day">Partial day</option></Select><div className="grid grid-cols-3 gap-2"><Input label="Start" type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}/><Input label="End" type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}/><Input label="Return joining date" type="date" required value={form.returnDate} onChange={(e) => setForm({ ...form, returnDate: e.target.value })}/></div><Input label="Reason" required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}/><div className="flex justify-end"><Button type="submit">Submit Request</Button></div></form></Modal>
  </div>;
}
