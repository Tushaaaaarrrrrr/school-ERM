import React from 'react';
import { cn } from '@/lib/utils/cn';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-slate-200/80', className)} {...props} />;
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-3">
      <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-slate-100 items-center">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-3 sm:p-4 md:p-5 border border-slate-200 rounded-xl bg-white space-y-2 sm:space-y-3 animate-pulse">
      <div className="flex justify-between items-center">
        <Skeleton className="h-3 sm:h-4 w-16 sm:w-24" />
        <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg" />
      </div>
      <Skeleton className="h-6 sm:h-8 w-20 sm:w-32" />
      <Skeleton className="h-2.5 sm:h-3 w-24 sm:w-40" />
    </div>
  );
}
