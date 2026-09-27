'use client';

// ============================================================================
// Root Page - Instant Authentication Gateway & Dashboard Redirection
// Automatically directs unauthenticated users to /login and authenticated users
// to their dedicated role-based dashboard.
// ============================================================================

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!currentUser) {
      router.replace('/login');
      return;
    }

    switch (currentUser.role) {
      case 'super_admin':
        router.replace('/super-admin');
        break;
      case 'teacher':
        router.replace('/teacher');
        break;
      case 'student':
        router.replace('/student');
        break;
      case 'parent':
        router.replace('/parent');
        break;
      case 'driver':
        router.replace('/driver');
        break;
      case 'staff':
        router.replace('/staff');
        break;
      case 'school_admin':
      default:
        router.replace('/admin');
        break;
    }
  }, [currentUser, isLoading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white selection:bg-indigo-500">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <img
            src="/icons/icon-192.png"
            alt="GI Campus Logo"
            className="w-16 h-16 rounded-2xl object-contain shadow-xl shadow-indigo-500/20"
          />
          <div className="absolute inset-0 rounded-2xl border-2 border-indigo-400 animate-ping opacity-25" />
        </div>
        <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          Redirecting to GI Campus...
        </p>
      </div>
    </div>
  );
}
