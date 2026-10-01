'use client';

// ============================================================================
// Teacher Personal Salary & Payment Statement
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { teacherPaymentService, teacherService } from '@/lib/services/api';
import { TeacherPayment, Teacher } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { IndianRupee, Receipt, CheckCircle2, Clock } from 'lucide-react';
import { TableSkeleton, CardSkeleton } from '@/components/ui/skeleton';

export default function TeacherPaymentsPage() {
  const { currentUser, currentSchool } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [payments, setPayments] = useState<TeacherPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSalaryInfo() {
      setIsLoading(true);
      try {
        const resolvedTeacher = await teacherService.getTeacherForUser(currentUser, schoolId);
        const teacherId = resolvedTeacher?.id || '';
        const [tch, pList] = await Promise.all([
          Promise.resolve(resolvedTeacher),
          teacherPaymentService.getPayments(schoolId, { teacherId }),
        ]);

        setTeacher(tch);
        setPayments(pList);
      } catch (err) {
        console.error(err);
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
        <p className="text-xs text-slate-500 mt-0.5">
          View your salary disbursement history and payment transaction statements
        </p>
      </div>

      {/* Salary Overview Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Monthly Base Salary
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(teacher?.monthly_salary || 35000)}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Faculty ID: <strong className="text-slate-700 font-mono">{teacher?.employee_number}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Active Direct Bank Deposit</span>
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
        ) : payments.length === 0 ? (
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
                      Credited: {formatDate(p.payment_date)} • Mode:{' '}
                      <span className="capitalize font-mono">{p.payment_method}</span>
                      {p.reference_number && ` (Ref: ${p.reference_number})`}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-base font-bold text-emerald-600">
                    +{formatCurrency(p.amount)}
                  </span>
                  <span className="block text-[10px] font-bold text-emerald-700 uppercase">
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
