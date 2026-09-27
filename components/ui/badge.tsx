import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'default', size = 'sm', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 font-medium rounded-md border',
    md: 'text-xs px-2.5 py-1 font-semibold rounded-full border',
  };

  return (
    <span className={cn('inline-flex items-center gap-1 leading-none', variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
}

/**
 * Status Badge for Invoices (paid, partial, pending, overdue, waived)
 */
export function InvoiceStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'paid':
      return <Badge variant="success">PAID</Badge>;
    case 'partial':
      return <Badge variant="warning">PARTIAL</Badge>;
    case 'pending':
      return <Badge variant="info">PENDING</Badge>;
    case 'overdue':
      return <Badge variant="danger">OVERDUE</Badge>;
    case 'waived':
      return <Badge variant="neutral">WAIVED</Badge>;
    default:
      return <Badge>{status.toUpperCase()}</Badge>;
  }
}

/**
 * General Status Badge (active, inactive, draft, published)
 */
export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
    case 'published':
      return <Badge variant="success">{status.toUpperCase()}</Badge>;
    case 'draft':
    case 'upcoming':
      return <Badge variant="warning">{status.toUpperCase()}</Badge>;
    case 'inactive':
    case 'suspended':
    case 'closed':
    case 'archived':
      return <Badge variant="danger">{status.toUpperCase()}</Badge>;
    default:
      return <Badge>{status.toUpperCase()}</Badge>;
  }
}
