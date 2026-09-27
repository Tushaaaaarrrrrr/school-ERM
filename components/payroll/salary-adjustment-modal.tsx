'use client';

// ============================================================================
// Modal: Record Employee Salary Adjustment (Reimbursement or Deduction)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/context/auth-context';
import { salaryAdjustmentService, temporaryAssignmentService, teacherService, staffService } from '@/lib/services/api';
import {
  SalaryAdjustmentType,
  TemporaryAssignment,
  EmployeeSalaryAdjustment,
} from '@/lib/types';
import { formatCurrency } from '@/lib/utils/formatters';
import {
  IndianRupee,
  PlusCircle,
  MinusCircle,
  Calendar,
  Link2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Calculator,
} from 'lucide-react';

export interface SalaryAdjustmentEmployee {
  id: string;
  name: string;
  role: string;
  employeeNumber?: string;
  baseSalary?: number;
  department?: string;
}

interface SalaryAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (adjustment: EmployeeSalaryAdjustment) => void;
  employee?: SalaryAdjustmentEmployee;
  initialType?: SalaryAdjustmentType;
  initialAssignmentId?: string;
  defaultBillingMonth?: string;
}

export function SalaryAdjustmentModal({
  isOpen,
  onClose,
  onSuccess,
  employee,
  initialType = 'reimbursement',
  initialAssignmentId,
  defaultBillingMonth,
}: SalaryAdjustmentModalProps) {
  const { currentSchool, currentUser } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const { success, error: toastError } = useToast();

  const [employeeList, setEmployeeList] = useState<SalaryAdjustmentEmployee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employee?.id || '');

  const [adjustmentType, setAdjustmentType] = useState<SalaryAdjustmentType>(initialType);
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState(
    defaultBillingMonth ? `${defaultBillingMonth}-01` : new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(initialAssignmentId || '');
  const [assignments, setAssignments] = useState<TemporaryAssignment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load employee list if employee prop is not provided
  useEffect(() => {
    if (isOpen && schoolId && !employee) {
      Promise.all([
        teacherService.getTeachers(schoolId, { status: 'active' }),
        staffService.getStaff(schoolId, { status: 'active' }),
      ]).then(([teachers, staff]) => {
        const unified: SalaryAdjustmentEmployee[] = [
          ...teachers.map((t) => ({
            id: t.id,
            name: `${t.first_name} ${t.last_name}`,
            role: 'teacher',
            employeeNumber: t.employee_number,
            baseSalary: t.monthly_salary || 35000,
            department: 'Academics',
          })),
          ...staff.map((s) => ({
            id: s.id,
            name: `${s.first_name} ${s.last_name}`,
            role: s.staff_type === 'driver' ? 'driver' : 'staff',
            employeeNumber: s.employee_number,
            baseSalary: s.salary || 20000,
            department: s.department || s.staff_type,
          })),
        ];
        setEmployeeList(unified);
        if (unified.length > 0 && !selectedEmployeeId) {
          setSelectedEmployeeId(unified[0].id);
        }
      }).catch(() => {});
    }
  }, [isOpen, schoolId, employee]);

  const activeEmployee = employee || employeeList.find((e) => e.id === selectedEmployeeId) || employeeList[0];

  useEffect(() => {
    if (isOpen && schoolId && activeEmployee) {
      // Fetch relevant temporary assignments for this employee
      temporaryAssignmentService
        .getAssignments(schoolId)
        .then((list) => {
          // Filter assignments where this employee was absent or replacement
          const relevant = list.filter(
            (a) => a.replacement_employee_id === activeEmployee.id || a.absent_employee_id === activeEmployee.id
          );
          setAssignments(relevant.length > 0 ? relevant : list.slice(0, 10));
        })
        .catch(() => {});
    }
  }, [isOpen, schoolId, activeEmployee?.id]);

  useEffect(() => {
    setAdjustmentType(initialType);
    if (initialAssignmentId) setSelectedAssignmentId(initialAssignmentId);
    if (employee?.id) setSelectedEmployeeId(employee.id);
  }, [initialType, initialAssignmentId, employee?.id]);

  const numAmount = parseFloat(amount) || 0;
  const baseSalary = activeEmployee?.baseSalary || 0;
  const netEstimatedSalary =
    adjustmentType === 'reimbursement'
      ? baseSalary + numAmount
      : Math.max(0, baseSalary - numAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmployee) {
      toastError('Please select a valid employee for the salary adjustment');
      return;
    }
    if (!reason.trim()) {
      toastError('Please enter a clear reason for the salary adjustment');
      return;
    }
    if (!amount || numAmount <= 0) {
      toastError('Please enter a valid amount greater than ₹0');
      return;
    }

    setIsSubmitting(true);
    try {
      const linkedAssignment = assignments.find((a) => a.id === selectedAssignmentId);
      const assignmentLabel = linkedAssignment
        ? `${linkedAssignment.duty_details} (${linkedAssignment.start_date} to ${linkedAssignment.end_date})`
        : undefined;

      const created = await salaryAdjustmentService.createAdjustment(
        schoolId,
        {
          employee_id: activeEmployee.id,
          employee_name: activeEmployee.name,
          employee_role: activeEmployee.role,
          adjustment_type: adjustmentType,
          reason: reason.trim(),
          amount: numAmount,
          effective_date: effectiveDate,
          billing_month: effectiveDate.slice(0, 7),
          temporary_assignment_id: selectedAssignmentId || null,
          temporary_assignment_label: assignmentLabel || null,
          notes: notes.trim() || null,
        },
        currentUser || undefined
      );

      success(
        `${adjustmentType === 'reimbursement' ? 'Reimbursement' : 'Deduction'} of ${formatCurrency(numAmount)} recorded for ${activeEmployee.name}`
      );
      if (onSuccess) onSuccess(created);
      onClose();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to record salary adjustment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Salary Adjustment"
      description={
        activeEmployee
          ? `Record manual reimbursement or deduction for ${activeEmployee.name} (${activeEmployee.employeeNumber || activeEmployee.role})`
          : 'Record manual reimbursement or deduction for a school employee'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-left">
        {/* Employee Selector (if not preselected) or Banner (if preselected) */}
        {!employee ? (
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Employee <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
            >
              {employeeList.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employeeNumber || emp.role}) - Base: {formatCurrency(emp.baseSalary || 0)}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">Target Employee</span>
              <strong className="text-slate-900 text-sm">{activeEmployee?.name}</strong>
              <span className="text-slate-500 block text-[11px] capitalize">
                {activeEmployee?.role} {activeEmployee?.department ? `• ${activeEmployee.department}` : ''}
              </span>
            </div>
            {baseSalary > 0 && (
              <div className="text-left sm:text-right">
                <span className="text-[11px] text-slate-500 font-semibold block">Current Base Salary</span>
                <strong className="text-slate-900 text-sm font-mono">{formatCurrency(baseSalary)}/mo</strong>
                <span className="text-[10px] text-emerald-700 block font-semibold">Base stays unchanged</span>
              </div>
            )}
          </div>
        )}

        {/* Adjustment Type Selector (Reimbursement vs Deduction) */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">
            Adjustment Type <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Reimbursement Option */}
            <button
              type="button"
              onClick={() => setAdjustmentType('reimbursement')}
              className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all text-left cursor-pointer ${
                adjustmentType === 'reimbursement'
                  ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500 text-emerald-950'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <PlusCircle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  adjustmentType === 'reimbursement' ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <div>
                <strong className="block text-xs font-bold">Reimbursement (+)</strong>
                <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                  Extra payment for proxy duties, overtime route coverage, or expenses
                </span>
              </div>
            </button>

            {/* Deduction Option */}
            <button
              type="button"
              onClick={() => setAdjustmentType('deduction')}
              className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all text-left cursor-pointer ${
                adjustmentType === 'deduction'
                  ? 'border-rose-500 bg-rose-50/70 ring-1 ring-rose-500 text-rose-950'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <MinusCircle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  adjustmentType === 'deduction' ? 'text-rose-600' : 'text-slate-400'
                }`}
              />
              <div>
                <strong className="block text-xs font-bold">Deduction (-)</strong>
                <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                  Unpaid absence deduction, leave penalty, or salary holdback
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Reason for Adjustment <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder={
              adjustmentType === 'reimbursement'
                ? 'e.g. Proxy teaching allowance for Class 8A (3 days)'
                : 'e.g. Unpaid absence penalty / leave without pay'
            }
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Amount & Effective Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">₹</span>
              <input
                type="number"
                min="1"
                step="any"
                required
                placeholder="e.g. 1500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Effective Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Optional Link to Temporary Assignment */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Link to Temporary Assignment (Optional)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Reference leave coverage work</span>
          </label>
          <select
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
          >
            <option value="">-- None (Standalone Adjustment) --</option>
            {assignments.map((asg) => (
              <option key={asg.id} value={asg.id}>
                {asg.replacement_employee_name === activeEmployee?.name ? 'Covered by: ' : 'Covered for: '}
                {asg.replacement_employee_name === activeEmployee?.name ? asg.absent_employee_name : asg.replacement_employee_name} • {asg.duty_details} ({asg.start_date})
              </option>
            ))}
          </select>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Administrative Notes (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Additional context or approval remarks..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Real-Time Calculation Preview Card */}
        {numAmount > 0 && (
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              adjustmentType === 'reimbursement'
                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/50 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 shrink-0 text-slate-500" />
              <div>
                <span className="text-[11px] font-semibold text-slate-600">Net Payable Impact:</span>
                <p className="font-mono text-xs">
                  {formatCurrency(baseSalary)} {adjustmentType === 'reimbursement' ? '+' : '-'} {formatCurrency(numAmount)} = <strong>{formatCurrency(netEstimatedSalary)}</strong>
                </p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-md font-bold font-mono text-xs ${
                adjustmentType === 'reimbursement'
                  ? 'bg-emerald-200 text-emerald-900'
                  : 'bg-rose-200 text-rose-900'
              }`}
            >
              {adjustmentType === 'reimbursement' ? `+${formatCurrency(numAmount)}` : `-${formatCurrency(numAmount)}`}
            </span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Save Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
