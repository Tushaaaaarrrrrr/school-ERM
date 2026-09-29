'use client';

// ============================================================================
// Unified School Employee Payroll & Compensation Management
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { payrollService, teacherService, staffService } from '@/lib/services/api';
import { EmployeePayment, Teacher, Staff } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { SearchFilterBar } from '@/components/ui/search-filter-bar';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import {
  Receipt,
  IndianRupee,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  CreditCard,
  Building,
  Users,
  Briefcase,
  GraduationCap,
  PlusCircle,
  Calculator,
} from 'lucide-react';
import { FeatureGuard } from '@/components/layout/feature-guard';
import { CardSkeleton, TableSkeleton } from '@/components/ui/skeleton';
import { SalaryAdjustmentModal } from '@/components/payroll/salary-adjustment-modal';

export default function AdminPayrollPage() {
  const { currentSchool } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const { success, error: toastError } = useToast();

  const [billingMonth, setBillingMonth] = useState('2026-08');
  const [payments, setPayments] = useState<EmployeePayment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [summary, setSummary] = useState({
    totalStaff: 0,
    totalTeachers: 0,
    totalPayrollAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBulkDisbursing, setIsBulkDisbursing] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'teacher' | 'staff'>('all');
  const [search, setSearch] = useState('');

  // Disburse Modal
  const [selectedPayment, setSelectedPayment] = useState<EmployeePayment | null>(null);
  const [disburseForm, setDisburseForm] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank' as EmployeePayment['payment_method'],
    referenceNumber: `NEFT-${Math.floor(100000 + Math.random() * 900000)}`,
  });

  // Salary Adjustment Modal
  const [selectedEmployeeForAdjustment, setSelectedEmployeeForAdjustment] = useState<{
    id: string;
    name: string;
    role: string;
    employeeNumber?: string;
    baseSalary?: number;
    department?: string;
  } | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  const loadPayroll = async () => {
    setIsLoading(true);
    try {
      const [pmts, smy, tList, sList] = await Promise.all([
        payrollService.getEmployeePayments(schoolId, { month: billingMonth }),
        payrollService.getPayrollSummary(schoolId, billingMonth),
        teacherService.getTeachers(schoolId, { status: 'active' }),
        staffService.getStaff(schoolId, { status: 'active' }),
      ]);

      setTeachers(tList);
      setStaffList(sList);

      // If no payments exist yet for this billing month and active employees exist, auto-generate!
      if (pmts.length === 0 && (tList.length > 0 || sList.length > 0)) {
        const generated = await payrollService.generateMonthlyPayroll(
          schoolId,
          billingMonth,
          tList,
          sList
        );
        const updatedSummary = await payrollService.getPayrollSummary(schoolId, billingMonth);
        setPayments(generated);
        setSummary(updatedSummary);
      } else {
        setPayments(pmts);
        setSummary(smy);
      }
    } catch {
      toastError('Failed to load payroll records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayroll();
  }, [schoolId, billingMonth]);

  const handleGeneratePayroll = async () => {
    setIsGenerating(true);
    try {
      const generated = await payrollService.generateMonthlyPayroll(
        schoolId,
        billingMonth,
        teachers,
        staffList
      );
      const updatedSummary = await payrollService.getPayrollSummary(schoolId, billingMonth);
      setPayments(generated);
      setSummary(updatedSummary);
      success(`Payroll generated for ${billingMonth}!`);
    } catch {
      toastError('Failed to generate monthly payroll');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBulkDisburseAll = async () => {
    setIsBulkDisbursing(true);
    try {
      await payrollService.bulkDisburse(schoolId, billingMonth, 'bank');
      success(`All pending salaries disbursed for ${billingMonth}!`);
      loadPayroll();
    } catch {
      toastError('Failed to disburse payments');
    } finally {
      setIsBulkDisbursing(false);
    }
  };

  const handleDisbursePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;

    try {
      await payrollService.updatePaymentStatus(selectedPayment.id, 'paid', {
        payment_date: disburseForm.paymentDate,
        payment_method: disburseForm.paymentMethod,
        reference_number: disburseForm.referenceNumber,
      });

      success(`Payment disbursed for ${selectedPayment.employee_name}`);
      setSelectedPayment(null);
      loadPayroll();
    } catch {
      toastError('Failed to disburse payment');
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.employee_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.employee_number || '').toLowerCase().includes(search.toLowerCase()) ||
      p.department?.toLowerCase().includes(search.toLowerCase()) ||
      p.designation?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || p.employee_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <FeatureGuard feature="payroll">
      <div className="space-y-6 text-left w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-indigo-600" /> Employee Compensation & Payroll
          </h1>
        </div>

        {/* Month Picker & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent border-0 focus:outline-none cursor-pointer"
            >
              <option value="2026-08">August 2026</option>
              <option value="2026-07">July 2026</option>
              <option value="2026-06">June 2026</option>
              <option value="2026-05">May 2026</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-10">October 2026</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedEmployeeForAdjustment(null);
              setIsAdjustmentModalOpen(true);
            }}
            className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs font-semibold"
            leftIcon={<PlusCircle className="w-3.5 h-3.5 text-emerald-600" />}
          >
            + Record Salary Adjustment
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleGeneratePayroll}
            isLoading={isGenerating}
            leftIcon={<Users className="w-3.5 h-3.5 text-indigo-600" />}
          >
            ⚡ Sync / Generate Payroll
          </Button>

          {summary.pendingAmount > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleBulkDisburseAll}
              isLoading={isBulkDisbursing}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Disburse All ({formatCurrency(summary.pendingAmount)})
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 block">Faculty On Payroll</span>
          <span className="text-xl font-bold text-slate-900 mt-1">{summary.totalTeachers}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 block">Staff On Payroll</span>
          <span className="text-xl font-bold text-slate-900 mt-1">{summary.totalStaff}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs">
          <span className="text-[11px] font-semibold text-indigo-700 block">Total Payroll (₹)</span>
          <span className="text-xl font-bold text-indigo-800 mt-1">{formatCurrency(summary.totalPayrollAmount)}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 block">Disbursed (Paid)</span>
          <span className="text-xl font-bold text-emerald-800 mt-1">{formatCurrency(summary.paidAmount)}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-700 block">Pending Payout</span>
          <span className="text-xl font-bold text-amber-800 mt-1">{formatCurrency(summary.pendingAmount)}</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          {[
            { id: 'all', label: `All Employees (${payments.length})` },
            { id: 'teacher', label: `Teachers (${payments.filter((p) => p.employee_type === 'teacher').length})` },
            { id: 'staff', label: `Staff & Support (${payments.filter((p) => p.employee_type === 'staff').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                typeFilter === tab.id ? 'bg-white shadow-2xs text-indigo-700 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee by name, ID or role..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs shadow-2xs bg-white"
          />
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} cols={8} />
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12 text-slate-500 space-y-3">
            <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-1" />
            <h3 className="text-sm font-semibold text-slate-700">No payroll entries for this month</h3>
            <p className="text-xs text-slate-400">Generate the monthly salary roster from your registered staff & teachers.</p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleGeneratePayroll}
              isLoading={isGenerating}
              leftIcon={<Users className="w-4 h-4" />}
            >
              ⚡ Generate {billingMonth} Payroll
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">Employee</th>
                  <th className="py-3 px-3">Designation & Dept</th>
                  <th className="py-3 px-3">Base Salary</th>
                  <th className="py-3 px-3">Reimbursements (+)</th>
                  <th className="py-3 px-3">Deductions (-)</th>
                  <th className="py-3 px-3">Net Payable</th>
                  <th className="py-3 px-3">Payment Date</th>
                  <th className="py-3 px-3">Mode & Ref No</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPayments.map((pmt) => {
                  const baseSal = pmt.base_salary || pmt.amount;
                  const reimbVal = pmt.total_reimbursements || 0;
                  const deducVal = pmt.total_deductions || 0;

                  return (
                    <tr key={pmt.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <Link
                          href={pmt.employee_type === 'teacher' ? `/admin/teachers/${pmt.employee_id}` : `/admin/staff/${pmt.employee_id}`}
                          className="font-semibold text-slate-900 hover:text-indigo-600 block"
                        >
                          {pmt.employee_name}
                        </Link>
                        <span className="text-[11px] font-mono text-slate-400">{pmt.employee_number}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800 capitalize block">
                          {pmt.designation || (pmt.employee_type === 'teacher' ? 'Faculty' : 'Staff')}
                        </span>
                        <span className="text-[11px] text-slate-400">{pmt.department || 'Academics'}</span>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600">
                        {formatCurrency(baseSal)}
                      </td>

                      <td className="py-3 px-3 font-mono font-semibold">
                        {reimbVal > 0 ? (
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            +{formatCurrency(reimbVal)}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-normal">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono font-semibold">
                        {deducVal > 0 ? (
                          <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                            -{formatCurrency(deducVal)}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-normal">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-bold text-slate-900 font-mono">
                        {formatCurrency(pmt.amount)}
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        {pmt.payment_date ? formatDate(pmt.payment_date) : <span className="text-amber-600 font-semibold">Pending</span>}
                      </td>

                      <td className="py-3 px-3 space-y-0.5">
                        <span className="block font-semibold uppercase text-slate-700">{pmt.payment_method?.replace('_', ' ') || '—'}</span>
                        <span className="block font-mono text-[11px] text-slate-400">{pmt.reference_number || '—'}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            pmt.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {pmt.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => {
                              setSelectedEmployeeForAdjustment({
                                id: pmt.employee_id,
                                name: pmt.employee_name,
                                role: pmt.employee_type,
                                employeeNumber: pmt.employee_number,
                                baseSalary: baseSal,
                                department: pmt.department,
                              });
                              setIsAdjustmentModalOpen(true);
                            }}
                            leftIcon={<IndianRupee className="w-3 h-3 text-emerald-600" />}
                            className="text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                            title="Record Reimbursement or Deduction"
                          >
                            ± Adjust
                          </Button>

                          {pmt.status !== 'paid' ? (
                            <Button
                              size="xs"
                              variant="primary"
                              onClick={() => {
                                setSelectedPayment(pmt);
                                setDisburseForm({
                                  paymentDate: new Date().toISOString().split('T')[0],
                                  paymentMethod: 'bank',
                                  referenceNumber: `NEFT-${Math.floor(100000 + Math.random() * 900000)}`,
                                });
                              }}
                            >
                              Disburse
                            </Button>
                          ) : (
                            <span className="text-[11px] font-semibold text-emerald-600 flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Paid
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DISBURSE PAYMENT MODAL */}
      {selectedPayment && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPayment(null)}
          title={`Disburse Monthly Salary: ${selectedPayment.employee_name}`}
          description={`Amount: ${formatCurrency(selectedPayment.amount)} for Billing Month ${selectedPayment.billing_month}`}
        >
          <form onSubmit={handleDisbursePaymentSubmit} className="space-y-4 text-xs text-left">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Disbursement Date *</label>
              <input
                type="date"
                required
                value={disburseForm.paymentDate}
                onChange={(e) => setDisburseForm({ ...disburseForm, paymentDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method *</label>
              <select
                value={disburseForm.paymentMethod}
                onChange={(e) => setDisburseForm({ ...disburseForm, paymentMethod: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
              >
                <option value="bank">Direct Bank Transfer / NEFT / RTGS</option>
                <option value="upi">UPI Transfer</option>
                <option value="cheque">Account Payee Cheque</option>
                <option value="cash">Cash Disbursement</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transaction / Reference Number *</label>
              <input
                type="text"
                required
                value={disburseForm.referenceNumber}
                onChange={(e) => setDisburseForm({ ...disburseForm, referenceNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedPayment(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Confirm Disbursement
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* RECORD SALARY ADJUSTMENT MODAL */}
      <SalaryAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => {
          setIsAdjustmentModalOpen(false);
          setSelectedEmployeeForAdjustment(null);
        }}
        onSuccess={() => loadPayroll()}
        employee={selectedEmployeeForAdjustment || undefined}
        defaultBillingMonth={billingMonth}
      />
      </div>
    </FeatureGuard>
  );
}
