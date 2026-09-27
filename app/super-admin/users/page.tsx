'use client';

// ============================================================================
// Super Admin Users & Identity Management
// ============================================================================

import React, { useEffect, useState } from 'react';
import { schoolService } from '@/lib/services/api';
import type { School } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { RefreshCw, Users, ShieldCheck, AlertCircle } from 'lucide-react';

export default function UsersPage() {
  const { success, error: toastError } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [schoolId, setSchoolId] = useState('');
  const [role, setRole] = useState('school_admin');
  const [status, setStatus] = useState('active');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setLoadError('');
    setIsLoading(true);
    try {
      const [response, s] = await Promise.all([
        fetch('/api/users', { cache: 'no-store' }),
        schoolService.getSchools(),
      ]);
      const u = await response.json();
      if (!response.ok) throw new Error(u.error || 'Unable to load users');
      setUsers(u.data || []);
      setSchools(s);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const open = (user: any) => {
    const membership =
      user.school_memberships?.find((m: any) => m.status === 'active') ||
      user.school_memberships?.[0];
    setEditing(user);
    setName(user.display_name || '');
    setSchoolId(membership?.school_id || (schools[0]?.id || ''));
    setRole(membership?.role || user.role || 'school_admin');
    setStatus(
      user.status === 'disabled'
        ? 'disabled'
        : membership?.status === 'revoked'
        ? 'revoked'
        : 'active'
    );
    setError('');
  };

  const save = async () => {
    if (!editing) return;
    setIsSaving(true);
    setError('');
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: editing.id,
          name,
          schoolId,
          role,
          status,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Unable to save user access');
        return;
      }

      success(`Successfully updated access for ${name || editing.email}`);
      setEditing(null);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Unable to save user access');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Users</h1>
          <p className="text-sm text-slate-500">
            Authenticated platform identities and their assigned school roles.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh
        </Button>
      </div>

      {loadError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Account Status</th>
                <th className="p-4">Assigned School</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!isLoading &&
                users.map((user) => {
                  const m = user.school_memberships?.find((x: any) => x.status === 'active');
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{user.display_name}</td>
                      <td className="p-4 text-xs font-mono text-slate-600">{user.email}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            user.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-700 font-medium">
                        {m?.schools?.name || (
                          <span className="text-slate-400 italic">No School Assigned</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="capitalize font-semibold text-slate-800">
                          {m?.role?.replace('_', ' ') || user.role?.replace('_', ' ') || 'None'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button size="sm" variant="outline" onClick={() => open(user)}>
                          Edit Access
                        </Button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {isLoading && (
          <div className="p-12 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span>Loading platform users…</span>
          </div>
        )}
      </div>

      {/* EDIT USER ACCESS MODAL */}
      {editing && (
        <Modal
          isOpen={true}
          onClose={() => setEditing(null)}
          title="Assign School Access"
          description={`Configure school membership and role for ${editing.display_name || editing.email}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-left">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                School
              </label>
              <select
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-indigo-500"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
              >
                <option value="">Choose school</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Role
              </label>
              <select
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-indigo-500"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {['school_admin', 'teacher', 'staff', 'accountant', 'driver', 'parent'].map((r) => (
                  <option key={r} value={r}>
                    {r.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Access Status
              </label>
              <select
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-indigo-500"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="revoked">Revoked</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                {error}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(null)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={save}
                isLoading={isSaving}
                disabled={!schoolId}
              >
                Save Access
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

