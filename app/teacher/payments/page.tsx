'use client';

// ============================================================================
// Teacher Personal Salary & Payment Statement
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { payrollService, teacherService } from '@/lib/services/api';
import { EmployeePayment, Teacher } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { IndianRupee, Receipt, CheckCircle2, Clock } from 'lucide-react';
import { TableSkeleton, CardSkeleton } from '@/components/ui/skeleton';

export default function TeacherPaymentsPage() {
  const { currentUser, currentSchool } = useAuth();
  const schoolId = currentSchool?.id || currentUser?.school_id || '';

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [payments, setPayments] = useState<EmployeePayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    async function loadSalaryInfo() {
      setIsLoading(true);
      setLoadError('');
      try {
        const resolvedTeacher = await teacherService.getTeacherForUser(currentUser, schoolId);
        const teacherId = resolvedTeacher?.id || '';
        if (!schoolId || !teacherId) throw new Error('Your teacher profile could not be resolved.');
        const tch = resolvedTeacher;
        const empPayments = await payrollService.getEmployeePayments(schoolId, { employeeType: 'teacher' });
        const combined = empPayments.filter((p) => p.employee_id === teacherId);

        setTeacher(tch);
        setPayments(combined);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Could not load salary records.');
      } finally {
        setIsLoading(false);
      }
    }

    loadSalaryInfo();
  }, [schoolId, currentUser]);

  return (
    <div className="space-y-6 text-left w-full">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Salary & Payment Receipts</h1>
      </div>

      {/* Salary Overview Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Monthly Base Salary
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {teacher ? formatCurrency(teacher.monthly_salary ?? teacher.salary ?? 0) : '—'}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Faculty ID: <strong className="text-slate-700 font-mono">{teacher?.employee_number}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Salary payment history</span>
        </div>
      </div>

      {/* Statement History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Payment Statements History ({payments.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-5">
            <TableSkeleton rows={3} cols={4} />
          </div>
        ) : loadError ? <p role="alert" className="p-5 text-rose-600">{loadError}</p> : payments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No salary disbursement records found.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments.map((p) => (
              <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Salary Statement ({p.billing_month})
                    </h4>
                    <p className="text-xs text-slate-500">
                      Payment date: {p.payment_date ? formatDate(p.payment_date) : 'Not recorded'} • Mode:{' '}
                      <span className="capitalize font-mono">{p.payment_method || 'Not recorded'}</span>
                      {p.reference_number && ` (Ref: ${p.reference_number})`}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className={`text-base font-bold ${p.status === 'paid' ? 'text-emerald-600' : 'text-amber-700'}`}>
                    {formatCurrency(p.amount)}
                  </span>
                  <span className={`block text-[10px] font-bold uppercase ${p.status === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
