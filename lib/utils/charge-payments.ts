import type { PaymentReceipt, StudentCharge } from '@/lib/types';

// Receipts allocate cash in item order, with tuition before extra charges.
export function reconcileChargePayments(charges: StudentCharge[], receipts: PaymentReceipt[], tuition = false): StudentCharge[] {
  const cents = (value: unknown) => Math.max(0, Math.round((Number(value) || 0) * 100));
  const paid = new Map<string, number>();
  const seen = new Set<string>();
  for (const receipt of receipts) {
    const key = `${receipt.school_id}:${receipt.id}`;
    if (seen.has(key) || receipt.is_reversed) continue;
    seen.add(key);
    let remaining = cents(receipt.amount_paid);
    const items = [...(receipt.items || [])].sort((a, b) => {
      if (a.item_type === 'tuition' && b.item_type !== 'tuition') return -1;
      if (b.item_type === 'tuition' && a.item_type !== 'tuition') return 1;
      return (a.created_at || '').localeCompare(b.created_at || '');
    });
    for (const item of items) {
      if (item.item_type === 'discount') continue;
      const allocation = Math.min(remaining, cents(item.amount));
      remaining -= allocation;
      const charge = charges.find((c) => c.id === item.item_reference_id && c.school_id === receipt.school_id && c.student_id === receipt.student_id);
      if (charge && (tuition ? item.item_type === 'tuition' : item.item_type !== 'tuition')) paid.set(charge.id, (paid.get(charge.id) || 0) + allocation);
    }
  }
  return charges.map((charge) => {
    if (charge.status === 'waived' || charge.status === 'cancelled') return charge;
    const amount = cents(charge.amount);
    const paidAmount = Math.min(amount, Math.max(cents(charge.paid_amount), paid.get(charge.id) || 0));
    return { ...charge, paid_amount: paidAmount / 100, remaining_amount: Math.max(0, amount - paidAmount) / 100,
      status: paidAmount >= amount ? 'paid' : paidAmount > 0 ? 'partial' : 'pending' };
  });
}
