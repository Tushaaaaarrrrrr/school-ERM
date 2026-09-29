'use client';

// ============================================================================
// Staff Member Portal Dashboard (Permission-Based Access)
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { feeService, studentService, noticeService } from '@/lib/services/api';
import { StudentFeeInvoice, Student, Notice } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { InvoiceStatusBadge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import {
  Briefcase,
  IndianRupee,
  Users,
  Bell,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { CardSkeleton } from '@/components/ui/skeleton';
import { SchoolStatusBoard } from '@/components/school/school-status-board';

export default function StaffDashboardPage() {
  const { currentUser, currentSchool } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';

  const permissions = currentUser?.permissions || [];
  const hasFeeAccess = permissions.includes('view_fees') || permissions.includes('record_student_payment');
  const hasStudentAccess = permissions.includes('view_students');
  const hasNoticeAccess = permissions.includes('view_notices');

  const [invoices, setInvoices] = useState<StudentFeeInvoice[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const promises = [];
        if (hasFeeAccess) promises.push(feeService.getInvoices(schoolId));
        else promises.push(Promise.resolve([]));

        if (hasStudentAccess) promises.push(studentService.getStudents(schoolId));
        else promises.push(Promise.resolve([]));

        if (hasNoticeAccess) promises.push(noticeService.getNotices(schoolId));
        else promises.push(Promise.resolve([]));

        const [invs, stList, nList] = await Promise.all(promises);
        setInvoices((invs as StudentFeeInvoice[]).slice(0, 5));
        setStudents((stList as Student[]).slice(0, 5));
        setNotices((nList as Notice[]).slice(0, 3));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [schoolId, hasFeeAccess, hasStudentAccess, hasNoticeAccess]);

  return (
    <div className="space-y-6 text-left w-full">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Briefcase className="w-4 h-4" />
            <span>Staff Portal</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            Welcome, {currentUser?.name || 'Staff Member'} 👋
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            {currentSchool?.name} • Staff Account ID: <span className="font-mono">{currentUser?.login_id || 'STF-01'}</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{permissions.length} Active Module Permissions</span>
        </div>
      </div>

      {/* Live School Operational Status Board */}
      <SchoolStatusBoard />

      {/* Permissions Grid */}
      {permissions.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 space-y-3">
          <Lock className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No ERP Portal Permissions Assigned</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Your staff account is active. If your role requires access to Student or Fee management, please ask your School Administrator to update your permissions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fee Management Module (If permitted) */}
          {hasFeeAccess && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">Student Fee Collection</h3>
                </div>
                <Link href="/admin/fees" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                  Fee Center →
                </Link>
              </div>

              <div className="p-4 flex-1">
                {isLoading ? (
                  <CardSkeleton />
                ) : invoices.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No fee invoices.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                        <div>
                          <span className="text-xs font-bold text-slate-900">{inv.student_name}</span>
                          <p className="text-[11px] text-slate-500">
                            {inv.billing_month} • {formatCurrency(inv.final_amount)}
                          </p>
                        </div>
                        <InvoiceStatusBadge status={inv.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Student Directory Module (If permitted) */}
          {hasStudentAccess && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Student Admissions & Directory</h3>
                </div>
                <Link href="/admin/students" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                  Browse All →
                </Link>
              </div>

              <div className="p-4 flex-1">
                {isLoading ? (
                  <CardSkeleton />
                ) : students.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No students found.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {students.map((st) => (
                      <div key={st.id} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                        <div>
                          <span className="text-xs font-bold text-slate-900">
                            {st.first_name} {st.last_name}
                          </span>
                          <p className="text-[11px] text-slate-500">
                            {st.current_enrollment?.class_name} ({st.current_enrollment?.section_name}) • Reg: {st.registration_number}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          Roll {st.current_enrollment?.roll_number || '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* School Notices Module */}
          {hasNoticeAccess && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden lg:col-span-2">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">School Notices & Announcements</h3>
                </div>
              </div>

              <div className="p-4">
                {notices.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">No active announcements.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {notices.map((n) => (
                      <div key={n.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                        <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                        <p className="text-[11px] text-slate-600 line-clamp-2">{n.message}</p>
                        <span className="text-[10px] text-slate-400 block pt-0.5">{formatDate(n.starts_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
