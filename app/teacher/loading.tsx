import React from 'react';
import { CardSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function TeacherLoading() {
  return (
    <div className="space-y-6 text-left w-full animate-in fade-in duration-200">
      <div className="space-y-1">
        <Skeleton className="h-7 w-48 rounded" />
        <Skeleton className="h-4 w-64 rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
