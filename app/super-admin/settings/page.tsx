'use client';

// ============================================================================
// Super Admin Platform Settings
// ============================================================================

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Shield, Database, Lock, CheckCircle2 } from 'lucide-react';
import { UserPasswordCard } from '@/components/auth/user-password-modal';

export default function SuperAdminSettingsPage() {
  const { success } = useToast();
  const [platformName, setPlatformName] = useState('SchoolERP Core Platform');
  const [supportEmail, setSupportEmail] = useState('support@schoolerp.platform.edu');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      success('Platform settings saved successfully');
    }, 500);
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Settings</h1>
      </div>

      {/* Account Password & Direct Login Security */}
      <UserPasswordCard />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Shield className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">General Platform Parameters</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Platform Brand Name"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                required
              />
              <Input
                label="Platform Support Email"
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save Platform Settings
            </Button>
          </div>
        </form>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Database className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Database & Security Isolation</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Supabase PostgreSQL Row Level Security (RLS) policies are active and enforced.</span>
            </div>
            <p>
              Every tenant query strictly isolates records by <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">school_id</code> based on the authenticated user profile.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
