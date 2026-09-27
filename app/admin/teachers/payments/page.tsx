'use client';

// ============================================================================
// School Admin Teacher Payments & Monthly Salary Management
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { teacherService, teacherPaymentService } from '@/lib/services/api';
import { Teacher, TeacherPayment, PaymentMethod } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { IndianRupee, Plus, Receipt, CheckCircle2, Clock, Filter, ArrowUpRight } from 'lucide-react';
import { CardSkeleton, TableSkeleton } from '@/components/ui/skeleton';

export default function AdminTeacherPaymentsPage() {
  const { currentSchool, currentUser } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const { success, error: toastError } = useToast();

  const [billingMonth, setBillingMonth] = useState('2026-08');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [payments, setPayments] = useState<TeacherPayment[]>([]);
  const [summary, setSummary] = useState<{ totalPayable: number; totalPaid: number; totalPending: number }>({
    totalPayable: 0,
    totalPaid: 0,
    totalPending: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Record Payment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
    teacherId: string;
    amount: string;
    paymentDate: string;
    paymentMethod: PaymentMethod;
    referenceNumber: string;
    notes: string;
  }>({
    teacherId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank',
    referenceNumber: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPaymentsData = async () => {
    setIsLoading(true);
    try {
      const [tList, pList, sum] = await Promise.all([
        teacherService.getTeachers(schoolId),
        teacherPaymentService.getPayments(schoolId, { billingMonth }),
        teacherPaymentService.getPaymentSummary(schoolId, billingMonth),
      ]);

      setTeachers(tList);
      setPayments(pList);
      setSummary(sum);

      if (tList.length > 0 && !formData.teacherId) {
        setFormData((prev) => ({
          ...prev,
          teacherId: tList[0].id,
          amount: String(tList[0].monthly_salary || 25000),
        }));
      }
    } catch {
      toastError('Failed to load teacher payments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentsData();
  }, [schoolId, billingMonth]);

  const handleTeacherSelect = (tId: string) => {
    const t = teachers.find((tch) => tch.id === tId);
    setFormData((prev) => ({
      ...prev,
      teacherId: tId,
      amount: String(t?.monthly_salary || 25000),
    }));
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teacherId || Number(formData.amount) <= 0) return;

    const teacher = teachers.find((t) => t.id === formData.teacherId);
    if (!teacher) return;

    setIsSubmitting(true);
    try {
      await teacherPaymentService.recordPayment({
        school_id: schoolId,
        teacher_id: formData.teacherId,
        billing_month: billingMonth,
        amount: Number(formData.amount),
        status: 'paid',
        payment_date: formData.paymentDate,
        payment_method: formData.paymentMethod,
        reference_number: formData.referenceNumber || undefined,
        notes: formData.notes || undefined,
        recorded_by: currentUser?.id,
        teacher_name: `${teacher.first_name} ${teacher.last_name}`,
        employee_number: teacher.employee_number,
        monthly_salary: teacher.monthly_salary,
      });

      success(`Salary payment of ${formatCurrency(Number(formData.amount))} recorded for ${teacher.first_name}!`);
      setIsModalOpen(false);
      loadPaymentsData();
    } catch {
      toastError('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Teacher Payments & Salaries</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage monthly faculty salaries, record payouts, and track payment receipts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Record Payment
          </Button>
        </div>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Monthly Payable
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(summary.totalPayable)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">All active teaching faculty</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Disbursed (Paid)
          </span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {formatCurrency(summary.totalPaid)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Credited this month</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pending Balance
          </span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {formatCurrency(summary.totalPending)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Awaiting disbursement</p>
        </div>
      </div>

      {/* Roster & Payments Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Faculty Salary List for August 2026
          </h3>
        </div>

        {isLoading ? (
          <div className="p-5">
            <TableSkeleton rows={4} cols={5} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Teacher</th>
                  <th className="px-5 py-3">Employee ID</th>
                  <th className="px-5 py-3">Monthly Salary</th>
                  <th className="px-5 py-3">Paid to Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Payment Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {teachers.map((t) => {
                  const payment = payments.find((p) => p.teacher_id === t.id);
                  const isPaid = payment?.status === 'paid';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {t.first_name} {t.last_name}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-500">{t.employee_number}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {formatCurrency(t.monthly_salary || 25000)}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-emerald-600">
                        {isPaid ? formatCurrency(payment.amount) : '₹0'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isPaid ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono capitalize text-slate-500">
                        {isPaid ? payment.payment_method : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Teacher Salary Payment"
        description="Log a salary disbursement to faculty account"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-left">
          <Select
            label="Select Teacher"
            required
            value={formData.teacherId}
            onChange={(e) => handleTeacherSelect(e.target.value)}
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.first_name} {t.last_name} ({t.employee_number} - {formatCurrency(t.monthly_salary || 25000)}/mo)
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Disbursement Amount (₹)"
              type="number"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              min={1}
            />
            <Input
              label="Payment Date"
              type="date"
              required
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Payment Method"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
            >
              <option value="bank">Bank Transfer (NEFT/IMPS)</option>
              <option value="upi">UPI / Online</option>
              <option value="cheque">Cheque</option>
              <option value="cash">Cash</option>
            </Select>
            <Input
              label="Reference / Transaction ID"
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              placeholder="e.g. NEFT-994821"
            />
          </div>

          <Input
            label="Notes / Comments"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g. August Monthly Salary credited"
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Record Salary Payout
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
