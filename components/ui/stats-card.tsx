import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'indigo',
  className,
}: StatsCardProps) {
  const iconBg = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-100 text-slate-700',
  };

  return (
    <div
      className={cn(
        'bg-white p-3 sm:p-4 md:p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all text-left flex flex-col justify-between',
        className
      )}
    >
      <div className="flex items-start justify-between gap-1.5 sm:gap-2">
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 leading-tight">
          {title}
        </span>
        {Icon && (
          <div
            className={cn(
              'w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0',
              iconBg[accentColor]
            )}
          >
            <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
        )}
      </div>

      <div className="mt-2 sm:mt-3">
        <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
          <span className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 truncate">
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                'text-[10px] sm:text-xs font-semibold',
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              )}
            >
              {trend.value}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-500 line-clamp-1 sm:line-clamp-none">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
