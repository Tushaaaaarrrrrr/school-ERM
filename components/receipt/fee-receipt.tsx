'use client';

// ============================================================================
// School Fee Receipt Component & Direct Print/PDF Engine
// ============================================================================

import React, { useRef } from 'react';
import { PaymentReceipt, School } from '@/lib/types';
import { useAuth } from '@/lib/context/auth-context';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/button';
import { Printer, Download, X, AlertTriangle, ShieldCheck } from 'lucide-react';

interface FeeReceiptProps {
  receipt: PaymentReceipt;
  onClose?: () => void;
  showActions?: boolean;
}

/**
 * Generates standalone clean HTML for a single fee receipt
 */
export function generateSingleReceiptHtml(
  receipt: PaymentReceipt,
  school?: Partial<School> | null
): string {
  const schoolName =
    (receipt.school_name_snapshot && receipt.school_name_snapshot !== 'School ERP')
      ? receipt.school_name_snapshot
      : (school?.name || 'JDPS');
  const schoolCode = receipt.school_code_snapshot || school?.code || 'JDPS0123Q';
  const schoolAddress = receipt.school_address_snapshot || school?.address || 'Patna, Bihar - 800001';
  const schoolPhone = receipt.school_phone_snapshot || school?.phone || '+91 98765 43210';
  const schoolEmail = receipt.school_email_snapshot || school?.email || 'admin@school.edu.in';
  const schoolLogo = receipt.school_logo_url_snapshot || school?.logo_url;

  const itemsHtml = (receipt.items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding: 6px 0; color: #1e293b; border-bottom: 1px solid #f1f5f9; ${item.amount < 0 ? 'color: #047857; font-weight: 600;' : ''}">${item.description}</td>
        <td style="padding: 6px 0; text-align: right; font-family: monospace; font-weight: 700; border-bottom: 1px solid #f1f5f9; ${item.amount < 0 ? 'color: #047857;' : 'color: #0f172a;'}">${item.amount < 0 ? `- ${formatCurrency(Math.abs(item.amount))}` : formatCurrency(item.amount)}</td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Fee_Receipt_${receipt.receipt_number}_${(receipt.student_name_snapshot || 'Student').replace(/\\s+/g, '_')}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #ffffff;
      color: #0f172a;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .receipt-container {
      width: 100%;
      max-width: 480px;
      border: 1.5px solid #475569;
      border-radius: 6px;
      padding: 18px 22px;
      background: #ffffff;
      position: relative;
      font-size: 12px;
      line-height: 1.45;
    }
    .brand-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    .brand-badge {
      font-family: monospace;
      font-weight: 700;
      text-transform: uppercase;
      background: #f1f5f9;
      color: #64748b;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }
    .school-header {
      text-align: center;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .school-logo {
      max-height: 40px;
      max-width: 40px;
      margin: 0 auto 4px auto;
      display: block;
    }
    .school-name {
      font-size: 16px;
      font-weight: 900;
      text-transform: uppercase;
      color: #020617;
      letter-spacing: -0.01em;
      margin-bottom: 2px;
    }
    .school-address {
      font-size: 11px;
      color: #475569;
      margin-bottom: 2px;
    }
    .school-contact {
      font-size: 10px;
      color: #475569;
      font-family: monospace;
    }
    .meta-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px dashed #94a3b8;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .meta-title {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
      letter-spacing: 0.05em;
    }
    .receipt-number {
      font-size: 11px;
      font-family: monospace;
      color: #475569;
      margin-top: 2px;
    }
    .receipt-number strong {
      color: #0f172a;
    }
    .meta-date {
      text-align: right;
      font-size: 11px;
    }
    .meta-date strong {
      display: block;
      color: #0f172a;
    }
    .meta-date span {
      font-size: 10px;
      font-family: monospace;
      color: #64748b;
    }
    .student-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 14px;
      border-bottom: 1px dashed #94a3b8;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .info-item .lbl {
      font-size: 9px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
      display: block;
      margin-bottom: 1px;
    }
    .info-item .val {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }
    .info-item .mono {
      font-family: monospace;
    }
    .particulars-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      border-bottom: 1.5px solid #cbd5e1;
    }
    .particulars-table th {
      text-align: left;
      font-size: 9px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
      padding-bottom: 5px;
      border-bottom: 1px solid #e2e8f0;
    }
    .particulars-table th.amt {
      text-align: right;
    }
    .totals-section {
      border-bottom: 1px dashed #94a3b8;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .tot-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      padding: 2.5px 0;
      color: #334155;
    }
    .tot-row .mono {
      font-family: monospace;
    }
    .tot-row.grand {
      font-size: 13px;
      font-weight: 800;
      color: #020617;
      border-top: 1px solid #e2e8f0;
      padding-top: 5px;
      margin-top: 3px;
    }
    .tot-row.paid {
      font-size: 12px;
      font-weight: 700;
      color: #047857;
    }
    .tot-row.balance {
      font-size: 12px;
      font-weight: 700;
      color: ${receipt.balance_after_payment > 0 ? '#b91c1c' : '#334155'};
    }
    .payment-meta {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 10px;
      margin-bottom: 16px;
    }
    .payment-meta strong {
      color: #0f172a;
    }
    .sign-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      align-items: flex-end;
      text-align: center;
      font-size: 10px;
      margin-bottom: 14px;
    }
    .sign-line {
      width: 120px;
      border-bottom: 1px solid #64748b;
      margin: 0 auto 5px auto;
    }
    .stamp-box {
      width: 90px;
      height: 42px;
      border: 1px dashed #94a3b8;
      border-radius: 4px;
      margin: 0 auto 5px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      color: #94a3b8;
      font-weight: 700;
    }
    .sign-lbl {
      font-weight: 700;
      color: #334155;
    }
    .footer-text {
      text-align: center;
      font-size: 9px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 6px;
    }
    .void-watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-25deg);
      border: 4px solid #e11d48;
      color: #e11d48;
      font-size: 32px;
      font-weight: 900;
      text-transform: uppercase;
      padding: 8px 24px;
      letter-spacing: 4px;
      opacity: 0.25;
      pointer-events: none;
    }
    @media print {
      body {
        padding: 0;
        margin: 0;
        display: block;
      }
      .receipt-container {
        max-width: 100%;
        width: 100%;
        margin: 0 auto;
        border: 1.5px solid #475569;
        page-break-inside: avoid;
      }
      @page {
        size: auto;
        margin: 10mm;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    ${receipt.is_reversed ? '<div class="void-watermark">VOID / REVERSED</div>' : ''}
    
    <div class="brand-top-row">
      <span class="brand-badge">School ERP</span>
      <span>Official Copy</span>
    </div>

    <div class="school-header">
      ${schoolLogo ? `<img src="${schoolLogo}" alt="Logo" class="school-logo" />` : ''}
      <h1 class="school-name">${schoolName}</h1>
      <p class="school-address">${schoolAddress}</p>
      <p class="school-contact">
        <span>Ph: <strong>${schoolPhone}</strong></span>
        <span> • </span>
        <span>Email: <strong>${schoolEmail}</strong></span>
      </p>
    </div>

    <div class="meta-bar">
      <div>
        <div class="meta-title">Fee Receipt</div>
        <div class="receipt-number">No: <strong>${receipt.receipt_number}</strong></div>
      </div>
      <div class="meta-date">
        <strong>${formatDate(receipt.payment_date)}</strong>
        <span>${receipt.payment_time || '10:30 AM'}</span>
      </div>
    </div>

    <div class="student-info">
      <div class="info-item">
        <span class="lbl">Student Name</span>
        <span class="val">${receipt.student_name_snapshot}</span>
      </div>
      <div class="info-item">
        <span class="lbl">Reg Number</span>
        <span class="val mono">${receipt.registration_number_snapshot}</span>
      </div>
      <div class="info-item">
        <span class="lbl">Class & Roll</span>
        <span class="val">${receipt.class_snapshot} ${receipt.section_snapshot ? `(${receipt.section_snapshot})` : ''} • Roll ${receipt.roll_number_snapshot}</span>
      </div>
      <div class="info-item">
        <span class="lbl">Academic Session</span>
        <span class="val">${receipt.academic_year_snapshot || '2026-27'}</span>
      </div>
    </div>

    <table class="particulars-table">
      <thead>
        <tr>
          <th>Particulars</th>
          <th class="amt">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="totals-section">
      ${
        receipt.discount > 0
          ? `
        <div class="tot-row">
          <span>Subtotal:</span>
          <span class="mono">${formatCurrency(receipt.subtotal)}</span>
        </div>
        <div class="tot-row" style="color: #047857; font-weight: 600;">
          <span>Discount Applied:</span>
          <span class="mono">- ${formatCurrency(receipt.discount)}</span>
        </div>
      `
          : ''
      }
      <div class="tot-row grand">
        <span>TOTAL DUE:</span>
        <span class="mono">${formatCurrency(receipt.total_amount)}</span>
      </div>
      <div class="tot-row paid">
        <span>Amount Paid:</span>
        <span class="mono">${formatCurrency(receipt.amount_paid)}</span>
      </div>
      <div class="tot-row balance">
        <span>Balance Due:</span>
        <span class="mono">${formatCurrency(receipt.balance_after_payment)}</span>
      </div>
    </div>

    <div class="payment-meta">
      <div>
        <span>Payment Mode: </span>
        <strong style="text-transform: capitalize;">${receipt.payment_method}</strong>
        ${receipt.reference_number ? `<span style="font-family: monospace; font-size: 10px; display: block; color: #64748b;">Ref: ${receipt.reference_number}</span>` : ''}
      </div>
      <div style="text-align: right;">
        <span>Received By: </span>
        <strong>${receipt.received_by_name_snapshot || 'Accountant'}</strong>
      </div>
    </div>

    <div class="sign-section">
      <div>
        <div class="sign-line"></div>
        <span class="sign-lbl">Authorized Signature</span>
      </div>
      <div>
        <div class="stamp-box">[ School Seal ]</div>
        <span class="sign-lbl">School Stamp</span>
      </div>
    </div>

    <div class="footer-text">
      Thank you. Computer-generated official fee receipt • Powered by School ERP
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Triggers direct isolated print using a hidden iframe
 */
export function printReceiptDirectly(receipt: PaymentReceipt, school?: Partial<School> | null) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(generateSingleReceiptHtml(receipt, school));
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 2000);
  }, 250);
}

/**
 * Downloads receipt as PDF via browser print-to-pdf / file trigger
 */
export function downloadReceiptAsPdf(receipt: PaymentReceipt, school?: Partial<School> | null) {
  printReceiptDirectly(receipt, school);
}

/**
 * Generates standalone clean HTML for batch 4-up receipts
 */
export function generateBatchReceiptsHtml(
  receipts: PaymentReceipt[],
  school?: Partial<School> | null
): string {
  const cardsHtml = receipts.slice(0, 4).map((r) => {
    const schoolName =
      (r.school_name_snapshot && r.school_name_snapshot !== 'School ERP')
        ? r.school_name_snapshot
        : (school?.name || 'JDPS');
    const schoolAddress = r.school_address_snapshot || school?.address || 'Patna, Bihar';

    const items = (r.items || [])
      .map(
        (item) => `
        <div style="display: flex; justify-content: space-between; font-size: 10px; padding: 2px 0;">
          <span style="color: #334155; ${item.amount < 0 ? 'color: #047857; font-weight: 600;' : ''}">${item.description}</span>
          <span style="font-family: monospace; font-weight: 700; ${item.amount < 0 ? 'color: #047857;' : ''}">${item.amount < 0 ? `- ${formatCurrency(Math.abs(item.amount))}` : formatCurrency(item.amount)}</span>
        </div>
      `
      )
      .join('');

    return `
      <div style="border: 1px solid #64748b; border-radius: 4px; padding: 12px; background: white; font-size: 10.5px; position: relative;">
        ${r.is_reversed ? '<div style="position: absolute; top: 40%; left: 30%; transform: rotate(-20deg); border: 2px solid #e11d48; color: #e11d48; font-size: 18px; font-weight: 800; padding: 2px 10px; opacity: 0.3;">VOID</div>' : ''}
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 8px; color: #94a3b8; margin-bottom: 2px;">
          <span style="font-family: monospace; background: #f1f5f9; padding: 1px 4px; border-radius: 3px;">School ERP</span>
          <span>Official Copy</span>
        </div>
        <div style="text-align: center; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 6px;">
          <strong style="font-size: 13px; font-weight: 900; text-transform: uppercase; display: block; color: #020617;">${schoolName}</strong>
          <span style="font-size: 9px; color: #64748b;">${schoolAddress}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; margin-bottom: 6px; font-size: 10px;">
          <span>No: <strong style="font-family: monospace;">${r.receipt_number}</strong></span>
          <span><strong>${formatDate(r.payment_date)}</strong></span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 6px; margin-bottom: 6px; font-size: 10px;">
          <div><span style="color: #64748b; font-size: 8px; display: block; text-transform: uppercase;">Student</span><strong>${r.student_name_snapshot}</strong></div>
          <div><span style="color: #64748b; font-size: 8px; display: block; text-transform: uppercase;">Class & Roll</span><span>${r.class_snapshot} • Roll ${r.roll_number_snapshot}</span></div>
        </div>
        <div style="border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px;">
          ${items}
        </div>
        <div style="border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; margin-bottom: 6px; font-size: 10px;">
          <div style="display: flex; justify-content: space-between;"><span>Total Due:</span><strong style="font-family: monospace;">${formatCurrency(r.total_amount)}</strong></div>
          <div style="display: flex; justify-content: space-between; color: #047857; font-weight: 700;"><span>Paid:</span><span style="font-family: monospace;">${formatCurrency(r.amount_paid)}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>Balance:</span><span style="font-family: monospace; ${r.balance_after_payment > 0 ? 'color: #b91c1c; font-weight: 700;' : ''}">${formatCurrency(r.balance_after_payment)}</span></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 9px; color: #64748b; margin-bottom: 8px;">
          <span>Mode: <strong style="color: #0f172a; text-transform: capitalize;">${r.payment_method}</strong></span>
          <span>By: <strong style="color: #0f172a;">${r.received_by_name_snapshot || 'Accountant'}</strong></span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: flex-end; text-align: center; font-size: 8px;">
          <div><div style="width: 70px; border-bottom: 1px solid #94a3b8; margin: 0 auto 2px auto;"></div><span>Signature</span></div>
          <div><div style="width: 50px; height: 22px; border: 1px dashed #cbd5e1; margin: 0 auto 2px auto; display: flex; align-items: center; justify-content: center; color: #94a3b8;">Seal</div><span>Stamp</span></div>
        </div>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Batch_Receipts_4-Up</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 10mm;
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .grid-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8mm;
      max-width: 190mm;
      margin: 0 auto;
    }
    @media print {
      body { padding: 0; margin: 0; }
      @page { size: A4 portrait; margin: 8mm; }
    }
  </style>
</head>
<body>
  <div class="grid-container">
    ${cardsHtml}
  </div>
</body>
</html>
  `;
}

export function printBatchReceiptsDirectly(
  receipts: PaymentReceipt[],
  school?: Partial<School> | null
) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(generateBatchReceiptsHtml(receipts, school));
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 2000);
  }, 250);
}

export function FeeReceipt({ receipt, onClose, showActions = true }: FeeReceiptProps) {
  const { currentSchool } = useAuth();
  const receiptRef = useRef<HTMLDivElement>(null);

  const schoolName =
    (receipt.school_name_snapshot && receipt.school_name_snapshot !== 'School ERP')
      ? receipt.school_name_snapshot
      : (currentSchool?.name || 'JDPS');
  const schoolAddress = receipt.school_address_snapshot || currentSchool?.address || 'Patna, Bihar - 800001';
  const schoolPhone = receipt.school_phone_snapshot || currentSchool?.phone || '+91 98765 43210';
  const schoolEmail = receipt.school_email_snapshot || currentSchool?.email || 'admin@school.edu.in';
  const schoolLogo = receipt.school_logo_url_snapshot || currentSchool?.logo_url;

  const handlePrint = () => {
    printReceiptDirectly(receipt, currentSchool);
  };

  const handleDownloadPdf = () => {
    downloadReceiptAsPdf(receipt, currentSchool);
  };

  return (
    <div className="flex flex-col items-center max-w-full w-full">
      {/* Top Action Bar */}
      {showActions && (
        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Receipt:</span>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white text-indigo-700 border border-indigo-200 shadow-2xs">
              {receipt.receipt_number}
            </span>
            {receipt.is_reversed && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300">
                VOID / REVERSED
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-4 h-4 text-slate-600" />}
              onClick={handleDownloadPdf}
              className="bg-white hover:bg-slate-50 shadow-2xs font-semibold text-xs"
            >
              Download PDF
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
              className="shadow-xs font-semibold text-xs"
            >
              Print Receipt
            </Button>

            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-slate-700 ml-1">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* PHYSICAL RECEIPT CONTAINER (Interactive On-Screen Preview)         */}
      {/* ------------------------------------------------------------------ */}
      <div
        ref={receiptRef}
        id="printable-fee-receipt"
        className={`fee-receipt-card relative bg-white text-slate-900 border border-slate-300 shadow-md rounded-md p-4 sm:p-5 w-full max-w-[480px] text-left font-sans text-xs select-text overflow-hidden ${
          receipt.is_reversed ? 'bg-rose-50/10' : ''
        }`}
      >
        {/* VOID WATERMARK IF REVERSED */}
        {receipt.is_reversed && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none opacity-25 rotate-[-25deg]">
            <div className="border-4 border-rose-700 text-rose-700 text-3xl sm:text-4xl font-extrabold uppercase px-6 py-2 tracking-widest text-center">
              VOID / REVERSED
            </div>
          </div>
        )}

        {/* Small brand watermark tag on side */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1.5 mb-1 border-b border-slate-100">
          <span className="font-mono text-[9px] uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold">
            School ERP
          </span>
          <span className="text-[10px] font-medium text-slate-400">Official Student Copy</span>
        </div>

        {/* 1. SCHOOL HEADER */}
        <div className="text-center space-y-1 pb-2.5 border-b border-slate-300">
          {schoolLogo ? (
            <div className="w-10 h-10 mx-auto mb-1 flex items-center justify-center">
              <img
                src={schoolLogo}
                alt={schoolName}
                className="max-h-9 max-w-9 object-contain"
              />
            </div>
          ) : null}

          <h2 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight leading-tight">
            {schoolName}
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-x-2 text-[11px] text-slate-600 font-medium leading-tight">
            <span>{schoolAddress}</span>
            <span>•</span>
            <span className="font-mono text-slate-700">Code: <strong>{receipt.school_code_snapshot || currentSchool?.code || 'JDPS0123Q'}</strong></span>
          </div>

          <p className="text-[10.5px] text-slate-600 font-medium flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 pt-0.5">
            <span>Ph: <strong className="font-mono text-slate-900">{schoolPhone}</strong></span>
            <span>•</span>
            <span>Email: <strong className="font-mono text-slate-900">{schoolEmail}</strong></span>
          </p>
        </div>

        {/* 2. RECEIPT META & TITLE */}
        <div className="py-2.5 border-b border-dashed border-slate-300 flex items-center justify-between text-[11px]">
          <div>
            <span className="font-extrabold uppercase tracking-wider text-slate-900 block text-xs">
              Fee Receipt
            </span>
            <span className="font-mono text-slate-600 text-[10px] block">
              No: <strong className="text-slate-900">{receipt.receipt_number}</strong>
            </span>
          </div>

          <div className="text-right">
            <span className="font-bold text-slate-900 block">{formatDate(receipt.payment_date)}</span>
            <span className="text-slate-500 font-mono text-[10px] block">
              {receipt.payment_time || '10:30 AM'}
            </span>
          </div>
        </div>

        {/* 3. STUDENT INFORMATION */}
        <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] grid grid-cols-2 gap-x-3 gap-y-1.5">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Student Name</span>
            <span className="font-bold text-slate-950 block truncate">{receipt.student_name_snapshot}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Reg Number</span>
            <span className="font-mono font-bold text-slate-900 block">{receipt.registration_number_snapshot}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Class & Roll</span>
            <span className="font-semibold text-slate-800 block">
              {receipt.class_snapshot} {receipt.section_snapshot ? `(${receipt.section_snapshot})` : ''} • Roll {receipt.roll_number_snapshot}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Session</span>
            <span className="font-semibold text-slate-800 block">{receipt.academic_year_snapshot || '2026-27'}</span>
          </div>
        </div>

        {/* 4. ITEMIZED CHARGES BREAKDOWN */}
        <div className="py-2.5 border-b border-slate-300 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-0.5">
            <span>Particulars</span>
            <span className="text-right">Amount</span>
          </div>

          <div className="space-y-1 text-[11px]">
            {(receipt.items || []).map((item, idx) => (
              <div key={item.id || idx} className="flex items-start justify-between gap-2">
                <span className={`leading-tight ${item.amount < 0 ? 'text-emerald-700 font-semibold' : 'text-slate-800'}`}>
                  {item.description}
                </span>
                <span
                  className={`font-mono shrink-0 text-right ${
                    item.amount < 0 ? 'text-emerald-700 font-bold' : 'font-bold text-slate-900'
                  }`}
                >
                  {item.amount < 0 ? `- ${formatCurrency(Math.abs(item.amount))}` : formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. TOTALS, PAID, & BALANCE */}
        <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
          {receipt.discount > 0 && (
            <div className="flex items-center justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">{formatCurrency(receipt.subtotal)}</span>
            </div>
          )}

          {receipt.discount > 0 && (
            <div className="flex items-center justify-between text-emerald-700 font-semibold">
              <span>Discount Applied:</span>
              <span className="font-mono">- {formatCurrency(receipt.discount)}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs font-extrabold text-slate-950 pt-0.5">
            <span>TOTAL DUE:</span>
            <span className="font-mono">{formatCurrency(receipt.total_amount)}</span>
          </div>

          <div className="flex items-center justify-between font-bold text-slate-900">
            <span>Amount Paid:</span>
            <span className="font-mono text-emerald-700">{formatCurrency(receipt.amount_paid)}</span>
          </div>

          <div className="flex items-center justify-between font-semibold text-slate-700">
            <span>Balance Due:</span>
            <span className={`font-mono ${receipt.balance_after_payment > 0 ? 'text-rose-700 font-bold' : 'text-slate-700'}`}>
              {formatCurrency(receipt.balance_after_payment)}
            </span>
          </div>
        </div>

        {/* 6. PAYMENT MODE & COUNTER STAFF */}
        <div className="py-2 text-[10.5px] text-slate-600 flex items-center justify-between border-b border-slate-200">
          <div>
            <span>Payment Mode: </span>
            <strong className="text-slate-900 capitalize">{receipt.payment_method}</strong>
            {receipt.reference_number && (
              <span className="font-mono text-slate-500 block">Ref: {receipt.reference_number}</span>
            )}
          </div>

          <div className="text-right">
            <span>Received By: </span>
            <strong className="text-slate-900 block truncate max-w-[140px]">
              {receipt.received_by_name_snapshot || 'Accountant'}
            </strong>
          </div>
        </div>

        {/* 7. PHYSICAL SIGNATURE & STAMP SPACE */}
        <div className="pt-4 pb-1 grid grid-cols-2 gap-4 items-end text-center text-[10px]">
          <div className="flex flex-col items-center">
            <div className="w-28 border-b border-slate-400 mb-1" />
            <span className="font-bold text-slate-800">Authorized Signature</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-20 h-10 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400 font-semibold mb-1">
              [ School Seal ]
            </div>
            <span className="font-bold text-slate-800">School Stamp</span>
          </div>
        </div>

        {/* 8. FOOTER */}
        <div className="pt-2 text-center text-[9px] text-slate-400 font-medium border-t border-slate-100 mt-2">
          Thank you. Computer-generated official fee receipt • Powered by School ERP
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 4-Up Batch Receipt Grid Component (For batch printing 4 receipts per A4)
// ----------------------------------------------------------------------------
export function BatchFourUpReceipts({
  receipts,
  onClose,
}: {
  receipts: PaymentReceipt[];
  onClose?: () => void;
}) {
  const { currentSchool } = useAuth();

  const handleBatchPrint = () => {
    printBatchReceiptsDirectly(receipts, currentSchool);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
        <h3 className="text-sm font-bold text-slate-900">
          Batch 4-Up A4 Print Sheet ({receipts.length} Receipts)
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleBatchPrint}
          >
            Download PDF
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={handleBatchPrint}
          >
            Print A4 Sheet (4-Up)
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div
        id="printable-batch-receipts"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[210mm] mx-auto print:grid-cols-2 print:gap-1"
      >
        {receipts.slice(0, 4).map((r) => (
          <div key={r.id} className="scale-95 origin-top">
            <FeeReceipt receipt={r} showActions={false} />
          </div>
        ))}
      </div>
    </div>
  );
}

