'use client';

// ============================================================================
// Account Security & Password Management Page
// ============================================================================

import React from 'react';
import { UserPasswordCard } from '@/components/auth/user-password-modal';
import { useAuth } from '@/lib/context/auth-context';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AccountSecurityPage() {
  const { currentUser } = useAuth();

  const getDashboardHref = () => {
    if (!currentUser) return '/login';
    switch (currentUser.role) {
      case 'super_admin': return '/super-admin';
      case 'school_admin': return '/admin';
      case 'teacher': return '/teacher';
      case 'student': return '/student';
      case 'parent': return '/parent';
      case 'driver': return '/driver';
      case 'staff':
      case 'accountant': return '/staff';
      default: return '/login';
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 space-y-6 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <span>Account Security &amp; Password</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your credentials for signing in with email, phone, or registration ID
          </p>
        </div>

        <Link
          href={getDashboardHref()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </Link>
      </div>

      <UserPasswordCard />
    </div>
  );
}
