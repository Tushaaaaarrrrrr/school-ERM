'use client';

// ============================================================================
// FeatureGuard: Safe Page-level Module Access Guard
// ============================================================================

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { isFeatureEnabled, SCHOOL_FEATURE_CATALOG } from '@/lib/utils/features';
import { SchoolFeatureKey } from '@/lib/types';
import { ShieldAlert, ArrowLeft, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeatureGuardProps {
  feature: SchoolFeatureKey;
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

export function FeatureGuard({
  feature,
  children,
  fallbackTitle,
  fallbackMessage,
}: FeatureGuardProps) {
  const { currentSchool, currentUser } = useAuth();

  // Super Admin can always view everything
  if (currentUser?.role === 'super_admin') {
    return <>{children}</>;
  }

  const isEnabled = isFeatureEnabled(currentSchool, feature);

  if (!isEnabled) {
    const featDef = SCHOOL_FEATURE_CATALOG.find((f) => f.key === feature);
    const title = fallbackTitle || `${featDef?.name || 'Feature Module'} is Disabled`;
    const message =
      fallbackMessage ||
      `This module is currently not provisioned for ${currentSchool?.name || 'your school'}. All past records remain securely stored in the database. Please contact your Super Administrator to activate this module.`;

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500 leading-relaxed">{message}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 flex items-center justify-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              School Code: <strong className="text-slate-800">{currentSchool?.code || 'N/A'}</strong>
            </span>
          </div>

          <div className="pt-2">
            <Link href="/admin">
              <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
