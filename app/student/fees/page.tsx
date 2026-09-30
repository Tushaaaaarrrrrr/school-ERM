'use client';

// ============================================================================
// Student Portal: Official Fee Statements & 1/4 A4 Printable Receipts
// Read-only access for students to view and download their fee receipts
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { feeService, chargeService, receiptService } from '@/lib/services/api';
import { StudentFeeInvoice, StudentCharge, PaymentReceipt } from '@/lib/types';
import { InvoiceStatusBadge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { FeeReceipt } from '@/components/receipt/fee-receipt';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { IndianRupee, FileText, Receipt, Printer, Tag, CheckCircle2, Shield } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';

export default function StudentFeesPage() {
  const { currentUser, currentSchool } = useAuth();
  const studentId = currentUser?.id || currentUser?.student_id || 'std-001';
  const schoolId = currentSchool?.id || 'sch-001';

  const [invoices, setInvoices] = useState<StudentFeeInvoice[]>([]);
  const [charges, setCharges] = useState<StudentCharge[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<StudentFeeInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStudentFeeData() {
      setIsLoading(true);
      try {
        const [invList, chgList, rcpList] = await Promise.all([
          feeService.getInvoices(schoolId, { studentId }),
          chargeService.getStudentCharges(schoolId, { studentId }),
          receiptService.getReceipts(schoolId, { studentId }),
        ]);
        setInvoices(invList);
        setCharges(chgList);
        setReceipts(rcpList);
      } catch (err) {
        console.error('Failed to load student fees', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStudentFeeData();
  }, [schoolId, studentId]);

  const pendingTuition = invoices.reduce((sum, i) => sum + (i.remaining_amount || 0), 0);
  const pendingCharges = charges
    .filter((c) => c.status === 'pending' || c.status === 'partial')
    .reduce((sum, c) => sum + c.remaining_amount, 0);
  const totalBalanceDue = pendingTuition + pendingCharges;

  return (
    <div className="space-y-6 text-left w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <IndianRupee className="w-6 h-6 text-indigo-600" /> Fee Statements & Official Receipts
        </h1>
      </div>

      {isLoading ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <TableSkeleton rows={4} cols={5} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Balance Overview Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                  Current Outstanding Balance
                </span>
                <h2 className="text-2xl font-extrabold text-slate-950 mt-1">
                  {formatCurrency(totalBalanceDue)}
                </h2>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  totalBalanceDue === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {totalBalanceDue === 0 ? 'Fees Fully Paid' : 'Payment Due'}
              </span>
            </div>
          </div>

          {/* Section 1: Official Payment Receipts (Printable 1/4 A4) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" /> Official Fee Receipts (1/4 A4)
              </h3>
              <span className="text-xs font-semibold text-slate-400">{receipts.length} Issued</span>
            </div>

            {receipts.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No payment receipts issued yet. Receipts will appear here once payment is collected by the school counter.
              </div>
            ) : (
              <div className="space-y-3">
                {receipts.map((rcp) => (
                  <div
                    key={rcp.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      rcp.is_reversed ? 'bg-rose-50/20 border-rose-200' : 'bg-slate-50/50 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold font-mono text-slate-900">{rcp.receipt_number}</h4>
                          {rcp.is_reversed ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              VOID / REVERSED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              PAID
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Paid on {formatDate(rcp.payment_date)} via <span className="capitalize font-semibold">{rcp.payment_method}</span>
                          {rcp.received_by_name_snapshot && <span> • Received by {rcp.received_by_name_snapshot}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-left sm:text-right">
                        <span className="text-base font-extrabold text-slate-900 block">
                          {formatCurrency(rcp.amount_paid)}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Balance: {formatCurrency(rcp.balance_after_payment)}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={<Printer className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedReceipt(rcp)}
                      >
                        Download / Print
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Monthly Tuition Invoices */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" /> Monthly Tuition Statements
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Billing Cycle</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-right">Total Amount</th>
                    <th className="py-2.5 px-3 text-right">Paid</th>
                    <th className="py-2.5 px-3 text-right">Remaining</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {inv.billing_month} Tuition Fee
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{formatDate(inv.due_date)}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{formatCurrency(inv.final_amount)}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">{formatCurrency(inv.paid_amount)}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-800">{formatCurrency(inv.remaining_amount || 0)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <InvoiceStatusBadge status={inv.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Extra Student Charges */}
          {charges.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" /> Extra Charges & Fines
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">Particulars</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-right">Paid</th>
                      <th className="py-2.5 px-3 text-right">Balance</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {charges.map((chg) => (
                      <tr key={chg.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {chg.charge_name}
                          {chg.description && <span className="block text-[10px] text-slate-400 font-normal">{chg.description}</span>}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{formatDate(chg.charge_date)}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{formatCurrency(chg.amount)}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">{formatCurrency(chg.paid_amount)}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-800">{formatCurrency(chg.remaining_amount)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              chg.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : chg.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : chg.status === 'waived'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {chg.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 1/4 A4 FEE RECEIPT PREVIEW & PRINT MODAL */}
      {selectedReceipt && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReceipt(null)}
          title="Official School Fee Receipt"
          description={`Receipt No: ${selectedReceipt.receipt_number}`}
          maxWidth="lg"
        >
          <div className="flex justify-center">
            <FeeReceipt
              receipt={selectedReceipt}
              onClose={() => setSelectedReceipt(null)}
              showActions={true}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
