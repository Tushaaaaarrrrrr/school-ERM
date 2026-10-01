'use client';

// ============================================================================
// Super Admin Platform Settings
// ============================================================================

import React from 'react';
import { UserPasswordCard } from '@/components/auth/user-password-modal';

export default function SuperAdminSettingsPage() {
  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Settings</h1>
      </div>

      {/* Account Password & Direct Login Security */}
      <UserPasswordCard />
    </div>
  );
}
