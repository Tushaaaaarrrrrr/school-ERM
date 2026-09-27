'use client';

// ============================================================================
// School Access Suspended Notice Page
// ============================================================================

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Mail, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SuspendedSchoolPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            School Access Suspended
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your school's access to the SchoolERP platform is currently suspended by the platform administration.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2 text-slate-700">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            <span>What should I do?</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Please contact your school administrator, principal, or platform support team to resolve institutional account status.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Link href="/login" className="w-full">
            <Button variant="primary" size="sm" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Sign In
            </Button>
          </Link>
          <a
            href="mailto:support@schoolerp.com"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 py-1"
          >
            Contact Platform Support →
          </a>
        </div>
      </div>
    </div>
  );
}
