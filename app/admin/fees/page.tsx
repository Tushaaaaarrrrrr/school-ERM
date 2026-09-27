'use client';

// ============================================================================
// Fees & Payments Management Module (Invoices, Receipts, Collections, Bulk Fees & Charges)
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import {
  feeService,
  classService,
  receiptService,
  collectionService,
  feeVersionService,
  bulkChargeService,
  studentService,
} from '@/lib/services/api';
import {
  StudentFeeInvoice,
  SchoolClass,
  PaymentMethod,
  PaymentReceipt,
  FeeCollectionSummary,
  FeeStructure,
  FeeStructureVersion,
  BulkChargeBatch,
  Student,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { InvoiceStatusBadge } from '@/components/ui/badge';
import { SearchFilterBar } from '@/components/ui/search-filter-bar';
import { FeeReceipt, BatchFourUpReceipts } from '@/components/receipt/fee-receipt';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { exportCollectionsToCsv } from '@/lib/utils/export';
import { FeatureGuard } from '@/components/layout/feature-guard';
import {
  IndianRupee,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  CreditCard,
  Receipt,
  Printer,
  FileText,
  RotateCcw,
  CheckSquare,
  Square,
  Users,
  Download,
  TrendingUp,
  DollarSign,
  Wallet,
  Building2,
  UserCheck,
  Calendar,
  Layers,
  Sparkles,
  History,
  XCircle,
  Tag,
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';

export default function FeesManagementPage() {
  const { currentSchool, currentUser } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const { success, error: toastError } = useToast();

  // Tab view: 'invoices' | 'receipts' | 'collections' | 'structures' | 'bulk_charges'
  const [activeView, setActiveView] = useState<'invoices' | 'receipts' | 'collections' | 'structures' | 'bulk_charges'>('invoices');

  const [invoices, setInvoices] = useState<StudentFeeInvoice[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [feeVersions, setFeeVersions] = useState<FeeStructureVersion[]>([]);
  const [bulkBatches, setBulkBatches] = useState<BulkChargeBatch[]>([]);

  const [feeSummary, setFeeSummary] = useState({
    expected: 0,
    collected: 0,
    pending: 0,
    overdue: 0,
    overdueCount: 0,
    totalInvoices: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Collections reporting state
  const [selectedPeriod, setSelectedPeriod] = useState<
    'today' | 'yesterday' | 'this_week' | 'this_month' | 'academic_year' | 'custom'
  >('today');
  const [customRange, setCustomRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [collectionSummary, setCollectionSummary] = useState<FeeCollectionSummary | null>(null);
  const [collectionTransactions, setCollectionTransactions] = useState<PaymentReceipt[]>([]);
  const [selectedMethodDrilldown, setSelectedMethodDrilldown] = useState<string>('all');
  const [selectedCashierFilter, setSelectedCashierFilter] = useState<string>('all');

  // Filters
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<StudentFeeInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Single & Batch Receipt Print Modals
  const [activeReceiptModal, setActiveReceiptModal] = useState<PaymentReceipt | null>(null);
  const [selectedReceiptIdsForBatch, setSelectedReceiptIdsForBatch] = useState<string[]>([]);
  const [isBatchPrintModalOpen, setIsBatchPrintModalOpen] = useState(false);

  // Class Fee Structure Update Modal State
  const [isUpdateFeeModalOpen, setIsUpdateFeeModalOpen] = useState(false);
  const [feeUpdateClassId, setFeeUpdateClassId] = useState('');
  const [feeUpdateStructureId, setFeeUpdateStructureId] = useState('');
  const [feeCurrentAmount, setFeeCurrentAmount] = useState<number | null>(null);
  const [feeNewAmount, setFeeNewAmount] = useState(0);
  const [feeEffectiveFrom, setFeeEffectiveFrom] = useState('2026-09-01');
  const [feeUpdateReason, setFeeUpdateReason] = useState('Annual Class Tuition Revision');
  const [isPreviewingFeeUpdate, setIsPreviewingFeeUpdate] = useState(false);
  const [isApplyingFeeUpdate, setIsApplyingFeeUpdate] = useState(false);

  // Bulk One-Time Charge Modal State
  const [isBulkChargeModalOpen, setIsBulkChargeModalOpen] = useState(false);
  const [bulkChargeName, setBulkChargeName] = useState('School Trip');
  const [bulkChargeAmount, setBulkChargeAmount] = useState<number>(100);
  const [bulkTargetType, setBulkTargetType] = useState<BulkChargeBatch['target_type']>('specific_class');
  const [bulkTargetClassId, setBulkTargetClassId] = useState('cls-08');
  const [bulkChargeDate, setBulkChargeDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkDueDate, setBulkDueDate] = useState('2026-08-30');
  const [bulkDescription, setBulkDescription] = useState('Educational excursion transport and admission fee');
  const [excludedStudentIds, setExcludedStudentIds] = useState<string[]>([]);
  const [bulkStep, setBulkStep] = useState<'form' | 'exclusions' | 'preview'>('form');
  const [isCreatingBulkCharge, setIsCreatingBulkCharge] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [invList, rcpList, clsList, fSummary, structures, versions, batches, stdList] = await Promise.all([
        feeService.getInvoices(schoolId, { billingMonth: selectedMonth }),
        receiptService.getReceipts(schoolId),
        classService.getClasses(schoolId),
        feeService.getFeeSummary(schoolId, selectedMonth),
        feeService.getFeeStructures(schoolId),
        feeVersionService.getFeeStructureVersions(schoolId),
        bulkChargeService.getBulkChargeBatches(schoolId),
        studentService.getStudents(schoolId),
      ]);

      setInvoices(invList);
      setReceipts(rcpList);
      setClasses(clsList);
      setFeeSummary(fSummary);
      setFeeStructures(structures);
      setFeeVersions(versions);
      setBulkBatches(batches);
      setAllStudents(stdList);

      const selectedStructure = structures.find((item) => item.id === feeUpdateStructureId);
      setFeeUpdateStructureId(selectedStructure?.id || '');
      setFeeCurrentAmount(selectedStructure?.amount ?? null);
      setFeeUpdateClassId((current) => clsList.some((item) => item.id === current) ? current : '');
    } catch {
      toastError('Failed to load fee records');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCollections = async () => {
    try {
      const isAccountant = currentUser?.role === 'staff' && (currentUser?.login_id?.includes('ACC') || currentUser?.name?.includes('Accountant'));
      const summary = await collectionService.getCollectionsSummary(
        schoolId,
        selectedPeriod,
        customRange,
        isAccountant ? currentUser.id : undefined,
        isAccountant ? currentUser.name : undefined
      );
      setCollectionSummary(summary);

      const txs = await collectionService.getCollectionTransactions(schoolId, {
        period: selectedPeriod,
        customRange,
        cashierId: isAccountant ? currentUser.id : selectedCashierFilter !== 'all' ? selectedCashierFilter : undefined,
        method: selectedMethodDrilldown !== 'all' ? selectedMethodDrilldown : undefined,
      });
      setCollectionTransactions(txs);
    } catch {
      toastError('Failed to load daily collection summary');
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolId, selectedMonth]);

  const [isGeneratingInvoices, setIsGeneratingInvoices] = useState(false);

  const handleGenerateInvoices = async () => {
    setIsGeneratingInvoices(true);
    try {
      const res = await feeService.generateMonthlyInvoices(schoolId, selectedMonth);
      if (res.generated > 0) {
        success(`Generated ${res.generated} student fee invoice(s) for ${selectedMonth}!`);
      } else {
        success(`Invoices for ${selectedMonth} are already up to date (${res.total} total).`);
      }
      await loadData();
    } catch {
      toastError('Failed to generate monthly fee invoices');
    } finally {
      setIsGeneratingInvoices(false);
    }
  };

  const openPaymentModal = (invoice: StudentFeeInvoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.remaining_amount || invoice.final_amount - invoice.paid_amount);
    setDiscountAmount(0);
    setDiscountReason('');
    setPaymentMethod('cash');
    setReferenceNumber('');
    setNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || paymentAmount <= 0) {
      toastError('Please enter a valid payment amount');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const result = await feeService.recordComprehensivePayment({
        schoolId,
        studentId: selectedInvoice.student_id,
        invoiceId: selectedInvoice.id,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        discountReason: discountReason || undefined,
        amountPaid: paymentAmount,
        paymentMethod,
        paymentDate,
        referenceNumber: referenceNumber || undefined,
        receivedByName: currentUser?.name || 'Accounts Office',
        receivedById: currentUser?.id || 'usr-admin-01',
        notes: notes || undefined,
      });

      success(`Payment of ${formatCurrency(paymentAmount)} recorded! Receipt ${result.receipt.receipt_number} generated.`);
      setIsPaymentModalOpen(false);
      loadData();
      setActiveReceiptModal(result.receipt);
    } catch {
      toastError('Failed to record payment transaction');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleExportCollections = () => {
    if (!collectionTransactions || collectionTransactions.length === 0) {
      toastError('No collection records to export');
      return;
    }
    exportCollectionsToCsv(collectionTransactions, collectionSummary?.period_label || selectedPeriod, currentUser?.name, schoolId);
    success('Collections CSV report downloaded successfully');
  };

  // Class Fee Structure Update
  const handleApplyFeeUpdate = async () => {
    if (!feeUpdateStructureId || !feeUpdateClassId || feeCurrentAmount === null || feeNewAmount <= 0) {
      toastError('Select a saved fee structure and class, then enter a valid new amount');
      return;
    }
    setIsApplyingFeeUpdate(true);
    try {
      const targetCls = classes.find((c) => c.id === feeUpdateClassId);
      const res = await feeVersionService.updateClassFeeStructure({
        school_id: schoolId,
        fee_structure_id: feeUpdateStructureId,
        class_id: feeUpdateClassId,
        class_name: targetCls?.name || 'Class 8',
        new_amount: feeNewAmount,
        effective_from: feeEffectiveFrom,
        reason: feeUpdateReason,
        actorId: currentUser?.id,
        actorName: currentUser?.name,
      });

      success(
        `Class fee updated to ${formatCurrency(feeNewAmount)}/mo effective from ${feeEffectiveFrom}! ${res.affectedStudentsCount} students mapped.`
      );
      setIsUpdateFeeModalOpen(false);
      setIsPreviewingFeeUpdate(false);
      loadData();
    } catch {
      toastError('Failed to update class fee structure');
    } finally {
      setIsApplyingFeeUpdate(false);
    }
  };

  // Bulk One-Time Charge
  const getEligibleStudentsForBulk = () => {
    if (bulkTargetType === 'entire_school') return allStudents;
    if (bulkTargetType === 'specific_class') return allStudents.filter((s) => s.current_enrollment?.class_id === bulkTargetClassId);
    return allStudents.filter((s) => s.current_enrollment?.class_id === bulkTargetClassId);
  };

  const handleCreateBulkCharges = async () => {
    setIsCreatingBulkCharge(true);
    try {
      const eligible = getEligibleStudentsForBulk();
      const targetStudentIds = eligible.filter((s) => !excludedStudentIds.includes(s.id)).map((s) => s.id);
      const targetCls = classes.find((c) => c.id === bulkTargetClassId);

      const res = await bulkChargeService.createBulkChargeBatch({
        school_id: schoolId,
        academic_year_id: 'ay-2026',
        name: bulkChargeName.trim(),
        amount: bulkChargeAmount,
        target_type: bulkTargetType,
        target_label: bulkTargetType === 'entire_school' ? 'Entire School' : `${targetCls?.name || 'Class 8'} (All Sections)`,
        target_class_id: bulkTargetClassId,
        charge_date: bulkChargeDate,
        due_date: bulkDueDate,
        description: bulkDescription,
        target_student_ids: targetStudentIds,
        actorId: currentUser?.id,
        actorName: currentUser?.name,
      });

      success(`Bulk charge "${bulkChargeName}" created for ${res.chargesCreated} students (Total: ${formatCurrency(bulkChargeAmount * res.chargesCreated)})!`);
      setIsBulkChargeModalOpen(false);
      setBulkStep('form');
      setExcludedStudentIds([]);
      loadData();
    } catch {
      toastError('Failed to create bulk charges');
    } finally {
      setIsCreatingBulkCharge(false);
    }
  };

  const handleCancelBulkBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to cancel this bulk charge batch? All unpaid charges will be cancelled.')) return;
    try {
      await bulkChargeService.cancelBulkChargeBatch(batchId, currentUser?.id, currentUser?.name);
      success('Bulk charge batch cancelled successfully');
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Failed to cancel bulk charge batch');
    }
  };

  // Filter Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchSearch =
      inv.student_name?.toLowerCase().includes(q) ||
      inv.registration_number?.toLowerCase().includes(q) ||
      inv.roll_number?.includes(q);

    const matchStatus = statusFilter ? inv.status === statusFilter : true;
    const matchClass = classFilter ? inv.class_name === classFilter : true;

    return matchSearch && matchStatus && matchClass;
  });

  // Filter Receipts
  const filteredReceipts = receipts.filter((rcp) => {
    const q = search.toLowerCase();
    return (
      rcp.receipt_number.toLowerCase().includes(q) ||
      rcp.student_name_snapshot.toLowerCase().includes(q) ||
      rcp.registration_number_snapshot.toLowerCase().includes(q)
    );
  });

  const selectedBatchReceipts = receipts.filter((r) => selectedReceiptIdsForBatch.includes(r.id));
  const eligibleBulkStudents = getEligibleStudentsForBulk();
  const finalIncludedCount = eligibleBulkStudents.length - excludedStudentIds.length;

  return (
    <FeatureGuard feature="fees">
      <div className="space-y-6 text-left max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <IndianRupee className="w-6 h-6 text-indigo-600" /> Student Fees & Collections
          </h1>
        </div>

        {/* View Mode Actions */}
        <div className="flex items-center gap-2">
          {activeView === 'invoices' && (
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-2xs"
              >
                <option value="2026-08">August 2026</option>
                <option value="2026-07">July 2026</option>
                <option value="2026-06">June 2026</option>
                <option value="2026-09">September 2026</option>
              </select>

              <Button
                variant="primary"
                size="sm"
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                onClick={handleGenerateInvoices}
                isLoading={isGeneratingInvoices}
              >
                Sync / Generate Invoices
              </Button>
            </div>
          )}

          {activeView === 'receipts' && selectedReceiptIdsForBatch.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={() => setIsBatchPrintModalOpen(true)}
            >
              Print 4-Up ({selectedReceiptIdsForBatch.length} Selected)
            </Button>
          )}

          {activeView === 'collections' && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleExportCollections}
            >
              Export CSV Report
            </Button>
          )}
        </div>
      </div>

      {/* View Mode Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
        {[
          { id: 'invoices', label: 'Billing Invoices', icon: FileText },
          { id: 'collections', label: 'Daily Collections & Reports', icon: TrendingUp },
          { id: 'structures', label: 'Fee Structures & History', icon: Layers },
          { id: 'bulk_charges', label: 'One-Time Bulk Charges', icon: Tag },
          { id: 'receipts', label: 'Payment Receipts (1/4 A4)', icon: Receipt },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
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

      {/* VIEW 1: BILLING INVOICES */}
      {activeView === 'invoices' && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block">Total Expected</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">{formatCurrency(feeSummary.expected)}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
              <span className="text-[11px] font-semibold text-emerald-700 block">Total Collected</span>
              <span className="text-xl font-bold text-emerald-700 mt-1 block">{formatCurrency(feeSummary.collected)}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs">
              <span className="text-[11px] font-semibold text-indigo-700 block">Pending Dues</span>
              <span className="text-xl font-bold text-indigo-800 mt-1 block">{formatCurrency(feeSummary.pending)}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs">
              <span className="text-[11px] font-semibold text-rose-700 block">Overdue Invoices</span>
              <span className="text-xl font-bold text-rose-800 mt-1 block">{formatCurrency(feeSummary.overdue)}</span>
            </div>
          </div>

          {/* Filter Bar */}
          <SearchFilterBar
            searchPlaceholder="Search student name, registration no, roll no..."
            searchQuery={search}
            onSearchChange={setSearch}
            filters={[
              {
                id: 'status',
                label: 'Status',
                options: [
                  { label: 'All Statuses', value: '' },
                  { label: 'Pending / Unpaid', value: 'pending' },
                  { label: 'Partially Paid', value: 'partial' },
                  { label: 'Fully Paid', value: 'paid' },
                  { label: 'Overdue', value: 'overdue' },
                ],
                value: statusFilter,
                onChange: setStatusFilter,
              },
            ]}
          />

          {/* Invoices Table */}
          {isLoading ? (
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <TableSkeleton rows={5} />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="bg-white p-10 text-center rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">No Invoices Found for {selectedMonth}</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Generate monthly tuition fee vouchers for all active students enrolled in this session with 1-click.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                onClick={handleGenerateInvoices}
                isLoading={isGeneratingInvoices}
              >
                Generate Invoices for {selectedMonth}
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Billing Month</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Paid</th>
                    <th className="py-3 px-4">Remaining</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/75">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {inv.student_name}
                        <span className="block text-[10px] font-mono text-slate-400 font-normal">
                          {inv.registration_number}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold">{inv.class_name} {inv.section_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{inv.billing_month}</td>
                      <td className="py-3 px-4 font-bold">{formatCurrency(inv.final_amount)}</td>
                      <td className="py-3 px-4 text-emerald-700 font-semibold">{formatCurrency(inv.paid_amount)}</td>
                      <td className="py-3 px-4 text-rose-700 font-bold">{formatCurrency(inv.remaining_amount || 0)}</td>
                      <td className="py-3 px-4">
                        <InvoiceStatusBadge status={inv.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {inv.status !== 'paid' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<IndianRupee className="w-3 h-3" />}
                            onClick={() => openPaymentModal(inv)}
                          >
                            Collect
                          </Button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-700">Cleared</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: DAILY COLLECTIONS & REPORTS */}
      {activeView === 'collections' && (
        <div className="space-y-6">
          {/* Period Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'academic_year', label: 'Academic Year' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedPeriod === p.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* KPI Collection Hero Card */}
          {collectionSummary && (
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  {collectionSummary.period_label} Total Fee Collection
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-emerald-400">
                  {formatCurrency(collectionSummary.total_collected)}
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Verified non-reversed payments ({collectionSummary.total_transactions} transactions)
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 self-start sm:self-center"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={handleExportCollections}
              >
                Export CSV
              </Button>
            </div>
          )}

          {/* Payment Method Breakdown Cards */}
          {collectionSummary && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Payment-Method Breakdown (Click to filter transactions below)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {collectionSummary.by_method.map((m) => {
                  const isSelected = selectedMethodDrilldown === m.method;
                  return (
                    <button
                      key={m.method}
                      onClick={() => setSelectedMethodDrilldown(isSelected ? 'all' : m.method)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="text-[11px] font-semibold text-slate-500 block capitalize">{m.label}</span>
                      <span className="text-lg font-bold text-slate-900 mt-1 block">{formatCurrency(m.total)}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{m.count} payments</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Itemized Transactions Drilldown Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs">Itemized Verified Receipts</h4>
              <span className="text-xs text-slate-400">{collectionTransactions.length} records</span>
            </div>

            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4">Receipt #</th>
                  <th className="py-2.5 px-4">Student</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4">Date & Time</th>
                  <th className="py-2.5 px-4">Collected By</th>
                  <th className="py-2.5 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {collectionTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/75">
                    <td className="py-2.5 px-4 font-mono font-bold text-indigo-700">{tx.receipt_number}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{tx.student_name_snapshot}</td>
                    <td className="py-2.5 px-4 font-bold text-emerald-700">{formatCurrency(tx.amount_paid)}</td>
                    <td className="py-2.5 px-4 capitalize font-semibold text-slate-600">{tx.payment_method}</td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">{formatDate(tx.payment_date)}</td>
                    <td className="py-2.5 px-4 text-slate-700">{tx.received_by_name_snapshot || 'Admin'}</td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => setActiveReceiptModal(tx)}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        Receipt (1/4 A4)
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: CLASS FEE STRUCTURES & VERSIONS */}
      {activeView === 'structures' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Class Fee Structures & Version History</h3>
              <p className="text-xs text-slate-500">
                Manage monthly tuition rates across classes. Past invoices are never overwritten.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin/fees/structures">
                <Button variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Create Fee Structure
                </Button>
              </Link>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setIsPreviewingFeeUpdate(false);
                  setIsUpdateFeeModalOpen(true);
                }}
              >
                Update Class Fee
              </Button>
            </div>
          </div>

          {feeStructures.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
              <p className="text-sm font-semibold text-slate-900">No fee structures configured yet.</p>
              <p className="text-xs mt-1">Create a fee structure before applying a class fee update.</p>
              <Link href="/admin/fees/structures" className="inline-block mt-4">
                <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Create Fee Structure
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feeStructures.map((fs) => {
              const structVersions = feeVersions.filter((v) => v.fee_structure_id === fs.id);
              return (
                <div key={fs.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{fs.name}</h4>
                      <span className="text-xs text-slate-500 capitalize">Billing: {fs.billing_frequency}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-extrabold text-slate-900">{formatCurrency(fs.amount)}</span>
                      <span className="text-[10px] text-slate-400 block font-semibold">/ month</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <span className="font-semibold text-slate-700 block mb-1">Applicable To:</span>
                    <p className="text-slate-600">Class 8 (Section 8A, Section 8B, Section 8C)</p>
                  </div>

                  {/* Version History */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <History className="w-3.5 h-3.5" /> Rate Version History
                    </span>
                    {structVersions.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No previous revisions recorded.</p>
                    ) : (
                      <div className="space-y-1.5 text-xs">
                        {structVersions.map((v) => (
                          <div key={v.id} className="flex items-center justify-between text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                            <div>
                              <span className="font-bold text-slate-900">{formatCurrency(v.amount)}</span>
                              <span className="text-[11px] text-slate-400 ml-2">
                                ({v.effective_from} {v.effective_to ? `to ${v.effective_to}` : 'onwards'})
                              </span>
                            </div>
                            <span className="text-[10px] text-indigo-700 font-semibold">{v.reason}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: ONE-TIME BULK CHARGES */}
      {activeView === 'bulk_charges' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">One-Time Bulk Charges</h3>
              <p className="text-xs text-slate-500">
                Add field trips, exam fees, or lab charges in bulk to entire classes with student exclusion options
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setBulkStep('form');
                setExcludedStudentIds([]);
                setIsBulkChargeModalOpen(true);
              }}
            >
              + Add Bulk Charge
            </Button>
          </div>

          <div className="space-y-3">
            {bulkBatches.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
                No bulk charge batches recorded. Click "+ Add Bulk Charge" to create one.
              </div>
            ) : (
              bulkBatches.map((batch) => (
                <div
                  key={batch.id}
                  className={`bg-white p-4 sm:p-5 rounded-2xl border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    batch.status === 'cancelled' ? 'border-rose-200 bg-rose-50/20 opacity-75' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{batch.name}</h4>
                      {batch.status === 'active' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          ACTIVE BATCH
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          CANCELLED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Target: <strong className="text-slate-800">{batch.target_label}</strong> • {batch.total_students} students mapped • Charged on {formatDate(batch.charge_date)}
                    </p>
                    {batch.description && <p className="text-xs text-slate-600 italic mt-0.5">&ldquo;{batch.description}&rdquo;</p>}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-base font-extrabold text-slate-900 block">{formatCurrency(batch.total_amount)}</span>
                      <span className="text-[11px] text-slate-400 font-semibold">({formatCurrency(batch.amount)} / student)</span>
                    </div>

                    {batch.status === 'active' && (
                      <Button
                        variant="outline"
                        size="xs"
                        className="text-rose-700 border-rose-200 hover:bg-rose-50"
                        onClick={() => handleCancelBulkBatch(batch.id)}
                      >
                        Cancel Batch
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 5: PAYMENT RECEIPTS (1/4 A4) */}
      {activeView === 'receipts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4">Receipt #</th>
                  <th className="py-2.5 px-4">Student</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Cashier</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredReceipts.map((rcp) => (
                  <tr key={rcp.id} className="hover:bg-slate-50/75">
                    <td className="py-2.5 px-4 font-mono font-bold text-indigo-700">{rcp.receipt_number}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{rcp.student_name_snapshot}</td>
                    <td className="py-2.5 px-4 font-bold text-emerald-700">{formatCurrency(rcp.amount_paid)}</td>
                    <td className="py-2.5 px-4 capitalize">{rcp.payment_method}</td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">{formatDate(rcp.payment_date)}</td>
                    <td className="py-2.5 px-4 text-slate-700">{rcp.received_by_name_snapshot || 'Admin'}</td>
                    <td className="py-2.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        leftIcon={<Printer className="w-3 h-3 text-slate-500" />}
                        onClick={() => setActiveReceiptModal(rcp)}
                      >
                        1/4 A4 Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* UPDATE CLASS FEE STRUCTURE MODAL */}
      {isUpdateFeeModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsUpdateFeeModalOpen(false)}
          title="Update Monthly Fee For Whole Class"
          description="Revise tuition rates for all students in a class. Past invoices remain unchanged."
        >
          {!isPreviewingFeeUpdate ? (
            <div className="space-y-4 text-xs text-left">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fee Structure *</label>
                <select
                  value={feeUpdateStructureId}
                  onChange={(e) => {
                    setFeeUpdateStructureId(e.target.value);
                    const s = feeStructures.find((st) => st.id === e.target.value);
                    if (s) setFeeCurrentAmount(s.amount);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-bold"
                >
                  <option value="">Select a saved fee structure</option>
                  {feeStructures.map((fs) => (
                    <option key={fs.id} value={fs.id}>
                      {fs.name} (Current: {formatCurrency(fs.amount)}/mo)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Apply To Class *</label>
                <select
                  value={feeUpdateClassId}
                  onChange={(e) => setFeeUpdateClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-bold"
                >
                  <option value="">Select a class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} (All Sections)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Amount</label>
                  <input
                    type="text"
                    disabled
                    value={feeCurrentAmount === null ? 'Not available' : formatCurrency(feeCurrentAmount)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-xs font-bold text-slate-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={feeNewAmount}
                    onChange={(e) => setFeeNewAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Effective From *</label>
                  <input
                    type="date"
                    required
                    value={feeEffectiveFrom}
                    onChange={(e) => setFeeEffectiveFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reason for Revision *</label>
                  <input
                    type="text"
                    required
                    value={feeUpdateReason}
                    onChange={(e) => setFeeUpdateReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsUpdateFeeModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="primary" size="sm" disabled={!feeUpdateStructureId || !feeUpdateClassId || feeCurrentAmount === null || feeNewAmount <= 0} onClick={() => setIsPreviewingFeeUpdate(true)}>
                  Preview Changes →
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs text-left">
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
                <h4 className="font-bold text-indigo-950 text-sm">Fee Update Preview</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block">Class:</span>
                    <strong className="text-slate-900">{classes.find((c) => c.id === feeUpdateClassId)?.name || 'Class 8'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Students Affected:</span>
                    <strong className="text-indigo-700">{allStudents.filter((s) => s.current_enrollment?.class_id === feeUpdateClassId).length || 84}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Old Monthly Fee:</span>
                    <strong className="text-slate-500 line-through">{formatCurrency(feeCurrentAmount)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">New Monthly Fee:</span>
                    <strong className="text-emerald-700 text-sm">{formatCurrency(feeNewAmount)}</strong>
                  </div>
                </div>
                <div className="pt-2 border-t border-indigo-100 text-[11px] text-slate-500">
                  Effective: <strong>{feeEffectiveFrom}</strong> • Historical invoices before this date will remain unchanged.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsPreviewingFeeUpdate(false)}>
                  ← Back to Edit
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isApplyingFeeUpdate}
                  onClick={handleApplyFeeUpdate}
                >
                  Apply Fee Update
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ONE-TIME BULK CHARGE MODAL */}
      {isBulkChargeModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsBulkChargeModalOpen(false)}
          title="Add One-Time Bulk Charge"
          description="Assign excursion, event, or lab fee to multiple students simultaneously"
        >
          {bulkStep === 'form' && (
            <div className="space-y-4 text-xs text-left">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Charge Name *"
                  required
                  value={bulkChargeName}
                  onChange={(e) => setBulkChargeName(e.target.value)}
                  placeholder="e.g. School Trip"
                />
                <Input
                  label="Amount Per Student (₹) *"
                  type="number"
                  required
                  value={bulkChargeAmount.toString()}
                  onChange={(e) => setBulkChargeAmount(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Group *</label>
                  <select
                    value={bulkTargetType}
                    onChange={(e) => setBulkTargetType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-bold"
                  >
                    <option value="specific_class">Specific Class (All Sections)</option>
                    <option value="entire_school">Entire School</option>
                  </select>
                </div>

                {bulkTargetType === 'specific_class' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Select Class *</label>
                    <select
                      value={bulkTargetClassId}
                      onChange={(e) => setBulkTargetClassId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-bold"
                    >
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Charge Date *"
                  type="date"
                  required
                  value={bulkChargeDate}
                  onChange={(e) => setBulkChargeDate(e.target.value)}
                />
                <Input
                  label="Due Date (Optional)"
                  type="date"
                  value={bulkDueDate}
                  onChange={(e) => setBulkDueDate(e.target.value)}
                />
              </div>

              <Input
                label="Description / Purpose"
                value={bulkDescription}
                onChange={(e) => setBulkDescription(e.target.value)}
                placeholder="Optional notes for parents and students"
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsBulkChargeModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="primary" size="sm" onClick={() => setBulkStep('exclusions')}>
                  Next: Student Exclusions ({eligibleBulkStudents.length}) →
                </Button>
              </div>
            </div>
          )}

          {bulkStep === 'exclusions' && (
            <div className="space-y-4 text-xs text-left">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">
                  {finalIncludedCount} of {eligibleBulkStudents.length} Students Selected
                </span>
                <span className="text-slate-400">Uncheck students who are not attending</span>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-1">
                {eligibleBulkStudents.map((std) => {
                  const isExcluded = excludedStudentIds.includes(std.id);
                  return (
                    <div
                      key={std.id}
                      className="p-2.5 flex items-center justify-between hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {std.first_name} {std.last_name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-normal">
                          (Roll #{std.current_enrollment?.roll_number || '—'})
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (isExcluded) {
                            setExcludedStudentIds(excludedStudentIds.filter((id) => id !== std.id));
                          } else {
                            setExcludedStudentIds([...excludedStudentIds, std.id]);
                          }
                        }}
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          isExcluded ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isExcluded ? '✕ Excluded' : '✓ Included'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setBulkStep('form')}>
                  ← Back
                </Button>
                <Button type="button" variant="primary" size="sm" onClick={() => setBulkStep('preview')}>
                  Preview & Confirm ({finalIncludedCount}) →
                </Button>
              </div>
            </div>
          )}

          {bulkStep === 'preview' && (
            <div className="space-y-4 text-xs text-left">
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
                <h4 className="font-bold text-indigo-950 text-sm">Bulk Charge Confirmation</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block">Charge Name:</span>
                    <strong className="text-slate-900">{bulkChargeName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Amount Per Student:</span>
                    <strong className="text-emerald-700">{formatCurrency(bulkChargeAmount)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Target Students:</span>
                    <strong className="text-indigo-700">{finalIncludedCount} students</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Total Billing Created:</span>
                    <strong className="text-slate-900 text-sm">{formatCurrency(bulkChargeAmount * finalIncludedCount)}</strong>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setBulkStep('exclusions')}>
                  ← Back to Exclusions
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isCreatingBulkCharge}
                  onClick={handleCreateBulkCharges}
                >
                  Create Charges
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* COLLECT FEE MODAL */}
      {isPaymentModalOpen && selectedInvoice && (
        <Modal
          isOpen={true}
          onClose={() => setIsPaymentModalOpen(false)}
          title={`Collect Fee: ${selectedInvoice.student_name}`}
          description={`Invoice #${selectedInvoice.id} • ${selectedInvoice.billing_month}`}
        >
          <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs text-left">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[11px]">Remaining Due</span>
                <span className="text-base font-bold text-rose-700">
                  {formatCurrency(selectedInvoice.remaining_amount || selectedInvoice.final_amount - selectedInvoice.paid_amount)}
                </span>
              </div>
              <span className="text-xs font-mono bg-white px-2 py-1 rounded border text-slate-700 font-bold">
                {selectedInvoice.class_name} ({selectedInvoice.section_name})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount to Collect (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-bold capitalize"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="card">Debit / Credit Card</option>
                  <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ref / Transaction #</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-98765432"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPaymentModalOpen(false)}
                disabled={isSubmittingPayment}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingPayment}>
                Confirm & Generate Receipt
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* SINGLE 1/4 A4 FEE RECEIPT MODAL */}
      {activeReceiptModal && (
        <Modal
          isOpen={true}
          onClose={() => setActiveReceiptModal(null)}
          title="Official School Fee Receipt"
          description={`Receipt ${activeReceiptModal.receipt_number} • 1/4 A4 Print Size`}
          maxWidth="lg"
        >
          <div className="flex justify-center">
            <FeeReceipt
              receipt={activeReceiptModal}
              onClose={() => setActiveReceiptModal(null)}
              showActions={true}
            />
          </div>
        </Modal>
      )}

      {/* 4-UP BATCH PRINT MODAL */}
      {isBatchPrintModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsBatchPrintModalOpen(false)}
          title="Batch Print Fee Receipts (4-Up per A4 Sheet)"
          description="Print up to 4 receipts neatly arranged on a single A4 page"
        >
          <div className="p-1 max-h-[80vh] overflow-y-auto">
            <BatchFourUpReceipts
              receipts={selectedBatchReceipts}
              onClose={() => setIsBatchPrintModalOpen(false)}
            />
          </div>
        </Modal>
      )}
      </div>
    </FeatureGuard>
  );
}
