// Map the UI invoice to the actual database columns; never send display fields.
export function feeInvoiceRow(invoice: any) {
  const billingMonth = String(invoice.billing_month || '');
  if (!/^\d{4}-(0[1-9]|1[0-2])(?:-\d{2})?$/.test(billingMonth)) throw new Error('A valid billing month is required.');
  const money = (key: string, fallback?: number) => {
    const value = Number(invoice[key] ?? fallback);
    if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid invoice ${key}.`);
    return Math.round(value * 100) / 100;
  };
  const finalAmount = money('final_amount');
  const paidAmount = money('paid_amount', 0);
  if (paidAmount > finalAmount) throw new Error('Paid amount cannot exceed the invoice total.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(invoice.due_date || ''))) throw new Error('An invoice due date is required.');
  const row: any = {
    school_id: invoice.school_id, student_id: invoice.student_id,
    academic_year_id: invoice.academic_year_id,
    fee_structure_id: invoice.fee_structure_id || null,
    billing_month: `${billingMonth.slice(0, 7)}-01`,
    base_amount: money('base_amount'), discount_amount: money('discount_amount', 0),
    late_fee: money('late_fee', Number(invoice.fine_amount || 0)),
    final_amount: finalAmount, paid_amount: paidAmount, due_date: invoice.due_date,
    status: ['waived', 'cancelled'].includes(invoice.status) ? invoice.status : paidAmount >= finalAmount ? 'paid' : paidAmount > 0 ? 'partial' : invoice.status === 'overdue' ? 'overdue' : 'pending',
  };
  if (invoice.created_at) row.created_at = invoice.created_at;
  return row;
}

export function displayFeeInvoice(row: any, student?: any, structure?: any) {
  const finalAmount = Number(row.final_amount);
  const paidAmount = Number(row.paid_amount);
  return { ...row, billing_month: String(row.billing_month).slice(0, 7),
    final_amount: finalAmount, paid_amount: paidAmount, base_amount: Number(row.base_amount),
    discount_amount: Number(row.discount_amount || 0), fine_amount: Number(row.late_fee || 0),
    remaining_amount: Math.max(0, Math.round((finalAmount - paidAmount) * 100) / 100),
    fee_structure_name: structure?.name || row.fee_structure_name || 'Tuition Fee',
    registration_number: student?.registration_number || row.registration_number,
    student_name: student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : row.student_name,
    class_name: student?.current_enrollment?.class_name || row.class_name,
    section_name: student?.current_enrollment?.section_name || row.section_name,
  };
}
