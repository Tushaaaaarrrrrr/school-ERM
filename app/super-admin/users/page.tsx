'use client';

// ============================================================================
// Super Admin Users & Identity Management
// Features: Search, Filters, Role Tabs, Quick Assign, and Institutional Invite Links
// ============================================================================

import React, { useEffect, useState, useMemo } from 'react';
import { schoolService } from '@/lib/services/api';
import type { School } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { SearchFilterBar } from '@/components/ui/search-filter-bar';
import {
  RefreshCw,
  Users,
  ShieldCheck,
  AlertCircle,
  Link as LinkIcon,
  Copy,
  Check,
  Share2,
  ExternalLink,
  UserPlus,
  Sparkles,
  GraduationCap,
  Truck,
  Briefcase,
} from 'lucide-react';

type UserTab = 'all' | 'super_admin' | 'school_admin' | 'teacher' | 'staff_driver' | 'unassigned';

export default function UsersPage() {
  const { success, error: toastError } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState<UserTab>('all');

  // Edit Access Modal State
  const [editing, setEditing] = useState<any>(null);
  const [schoolId, setSchoolId] = useState('');
  const [role, setRole] = useState('school_admin');
  const [status, setStatus] = useState('active');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Invite Link Generator Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteSchoolId, setInviteSchoolId] = useState('');
  const [inviteRole, setInviteRole] = useState('teacher');
  const [isCopied, setIsCopied] = useState(false);

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
      if (s.length > 0 && !inviteSchoolId) {
        setInviteSchoolId(s[0].id);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openEditModal = (user: any) => {
    const membership =
      user.school_memberships?.find((m: any) => m.status === 'active') ||
      user.school_memberships?.[0];
    setEditing(user);
    setName(user.display_name || '');
    setSchoolId(membership?.school_id || (schools[0]?.id || ''));
    setRole(user.role === 'super_admin' ? 'super_admin' : (membership?.role || user.role || 'school_admin'));
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

  // Helper to determine active membership and role
  const getUserDetails = (user: any) => {
    const activeMem = user.school_memberships?.find((m: any) => m.status === 'active');
    const isSuperAdmin = user.role === 'super_admin';
    const effectiveRole = isSuperAdmin ? 'super_admin' : (activeMem?.role || user.role || 'unassigned');
    const assignedSchool = isSuperAdmin ? null : (activeMem?.schools || null);
    const isUnassigned = !isSuperAdmin && (!activeMem || !activeMem.school_id || effectiveRole === 'school_user' || effectiveRole === 'unassigned');
    return { activeMem, isSuperAdmin, effectiveRole, assignedSchool, isUnassigned };
  };

  // Counts for Tabs
  const counts = useMemo(() => {
    let super_admin = 0;
    let school_admin = 0;
    let teacher = 0;
    let staff_driver = 0;
    let unassigned = 0;

    users.forEach((user) => {
      const { isSuperAdmin, effectiveRole, isUnassigned } = getUserDetails(user);
      if (isSuperAdmin) super_admin++;
      else if (isUnassigned) unassigned++;
      else if (effectiveRole === 'school_admin') school_admin++;
      else if (effectiveRole === 'teacher') teacher++;
      else if (['driver', 'staff', 'accountant'].includes(effectiveRole)) staff_driver++;
    });

    return { all: users.length, super_admin, school_admin, teacher, staff_driver, unassigned };
  }, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const { isSuperAdmin, effectiveRole, assignedSchool, isUnassigned } = getUserDetails(user);

      // Tab filter
      if (activeTab === 'super_admin' && !isSuperAdmin) return false;
      if (activeTab === 'school_admin' && (isSuperAdmin || isUnassigned || effectiveRole !== 'school_admin')) return false;
      if (activeTab === 'teacher' && (isSuperAdmin || isUnassigned || effectiveRole !== 'teacher')) return false;
      if (activeTab === 'staff_driver' && (isSuperAdmin || isUnassigned || !['driver', 'staff', 'accountant'].includes(effectiveRole))) return false;
      if (activeTab === 'unassigned' && !isUnassigned) return false;

      // Search query (name or email)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = (user.display_name || '').toLowerCase().includes(query);
        const matchesEmail = (user.email || '').toLowerCase().includes(query);
        if (!matchesName && !matchesEmail) return false;
      }

      // School filter
      if (selectedSchoolFilter) {
        if (isSuperAdmin) return false; // Super Admins are platform-wide
        if (!assignedSchool || assignedSchool.id !== selectedSchoolFilter) return false;
      }

      // Role filter
      if (selectedRoleFilter) {
        if (selectedRoleFilter === 'super_admin' && !isSuperAdmin) return false;
        if (selectedRoleFilter === 'unassigned' && !isUnassigned) return false;
        if (selectedRoleFilter !== 'super_admin' && selectedRoleFilter !== 'unassigned') {
          if (effectiveRole !== selectedRoleFilter) return false;
        }
      }

      // Status filter
      if (selectedStatusFilter && user.status !== selectedStatusFilter) return false;

      return true;
    });
  }, [users, activeTab, searchQuery, selectedSchoolFilter, selectedRoleFilter, selectedStatusFilter]);

  // Selected school for invite generation
  const selectedInviteSchool = useMemo(() => {
    return schools.find((s) => s.id === inviteSchoolId) || schools[0] || null;
  }, [schools, inviteSchoolId]);

  // Generated Invite Link
  const generatedInviteUrl = useMemo(() => {
    if (!selectedInviteSchool) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://school-erm.onrender.com';
    return `${origin}/invite?code=${encodeURIComponent(selectedInviteSchool.code)}&role=${encodeURIComponent(inviteRole)}`;
  }, [selectedInviteSchool, inviteRole]);

  const copyInviteLink = () => {
    if (!generatedInviteUrl) return;
    navigator.clipboard.writeText(generatedInviteUrl);
    setIsCopied(true);
    success('Invite link copied to clipboard!');
    setTimeout(() => setIsCopied(false), 3000);
  };

  const shareOnWhatsApp = () => {
    if (!generatedInviteUrl || !selectedInviteSchool) return;
    const text = encodeURIComponent(
      `Join ${selectedInviteSchool.name} on GI Campus as ${inviteRole.replace('_', ' ').toUpperCase()}.\n\nClick this invite link to instantly sign in with your Google account (Zero passwords or SMS OTP required):\n${generatedInviteUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Users & Identity</h1>
          <p className="text-sm text-slate-500">
            Authenticated platform accounts, institutional roles, and instant invite links.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsInviteModalOpen(true)}
            leftIcon={<LinkIcon className="w-4 h-4 text-indigo-600" />}
            className="border-indigo-200 hover:bg-indigo-50 text-indigo-700"
          >
            Create Invite Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Role Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'all', label: 'All Users', count: counts.all },
          { id: 'super_admin', label: 'Super Admins', count: counts.super_admin },
          { id: 'school_admin', label: 'School Admins', count: counts.school_admin },
          { id: 'teacher', label: 'Teachers', count: counts.teacher },
          { id: 'staff_driver', label: 'Staff & Drivers', count: counts.staff_driver },
          { id: 'unassigned', label: 'Unassigned', count: counts.unassigned, alert: counts.unassigned > 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as UserTab)}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all shrink-0 border-b-2 ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                tab.alert
                  ? 'bg-amber-100 text-amber-800'
                  : activeTab === tab.id
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Filters Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name or Google email..."
        filters={[
          {
            id: 'school',
            label: 'School',
            value: selectedSchoolFilter,
            onChange: setSelectedSchoolFilter,
            options: schools.map((s) => ({ label: `${s.name} (${s.code})`, value: s.id })),
          },
          {
            id: 'role',
            label: 'Role',
            value: selectedRoleFilter,
            onChange: setSelectedRoleFilter,
            options: [
              { label: 'Super Admin', value: 'super_admin' },
              { label: 'School Admin', value: 'school_admin' },
              { label: 'Teacher', value: 'teacher' },
              { label: 'Driver', value: 'driver' },
              { label: 'Staff', value: 'staff' },
              { label: 'Accountant', value: 'accountant' },
              { label: 'Parent / Student', value: 'parent' },
              { label: 'Unassigned', value: 'unassigned' },
            ],
          },
          {
            id: 'status',
            label: 'Status',
            value: selectedStatusFilter,
            onChange: setSelectedStatusFilter,
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Revoked', value: 'revoked' },
              { label: 'Disabled', value: 'disabled' },
            ],
          },
        ]}
        onClearAll={() => {
          setSearchQuery('');
          setSelectedSchoolFilter('');
          setSelectedRoleFilter('');
          setSelectedStatusFilter('');
        }}
      />

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Google Account (Email)</th>
                <th className="p-4">Account Status</th>
                <th className="p-4">Assigned School</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!isLoading &&
                filteredUsers.map((user) => {
                  const { isSuperAdmin, effectiveRole, assignedSchool, isUnassigned } = getUserDetails(user);

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isUnassigned ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="p-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{user.display_name || 'No Name'}</span>
                          {isUnassigned && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                              Needs Assignment
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-xs font-mono text-slate-600">{user.email}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            user.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : user.status === 'revoked'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-700 font-medium">
                        {isSuperAdmin ? (
                          <span className="text-indigo-600 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> All Schools (Platform-wide)
                          </span>
                        ) : assignedSchool?.name ? (
                          <div>
                            <div className="font-semibold text-slate-900">{assignedSchool.name}</div>
                            <div className="text-[11px] font-mono text-slate-400">{assignedSchool.code}</div>
                          </div>
                        ) : (
                          <span className="text-amber-600 italic font-medium">No School Assigned</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`capitalize font-semibold text-xs px-2 py-0.5 rounded inline-block ${
                            isSuperAdmin
                              ? 'text-indigo-700 bg-indigo-50 border border-indigo-200'
                              : effectiveRole === 'school_admin'
                              ? 'text-purple-700 bg-purple-50 border border-purple-200'
                              : effectiveRole === 'teacher'
                              ? 'text-blue-700 bg-blue-50 border border-blue-200'
                              : effectiveRole === 'driver'
                              ? 'text-amber-700 bg-amber-50 border border-amber-200'
                              : isUnassigned
                              ? 'text-slate-500 bg-slate-100 border border-slate-200'
                              : 'text-slate-800 bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {effectiveRole.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {isUnassigned ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => openEditModal(user)}
                            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                          >
                            Assign School
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => openEditModal(user)}>
                            Edit Access
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredUsers.length === 0 && (
          <div className="p-12 text-center text-sm text-slate-500">
            No users found matching your search and filter criteria.
          </div>
        )}

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
              placeholder="e.g. Ramesh Kumar"
            />

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Role
              </label>
              <select
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-indigo-500"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {['super_admin', 'school_admin', 'teacher', 'driver', 'staff', 'accountant', 'parent', 'student'].map((r) => (
                  <option key={r} value={r}>
                    {r === 'super_admin' ? 'Super Admin (Global Platform Access)' : r.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {role !== 'super_admin' ? (
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
            ) : (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700">
                Super Admins automatically have unrestricted global access across all schools.
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Access Status
              </label>
              <select
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-indigo-500"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Active (Access Granted)</option>
                <option value="revoked">Revoked (Membership Removed)</option>
                <option value="disabled">Disabled (Login Blocked)</option>
              </select>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
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
                disabled={role !== 'super_admin' && !schoolId}
              >
                Save Access
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* INVITE LINK GENERATOR MODAL */}
      {isInviteModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsInviteModalOpen(false)}
          title="Create Institutional Invite Link"
          description="Generate a 1-click Google OAuth onboarding link for Teachers, Drivers, and Staff. Zero SMS OTP needed."
          maxWidth="md"
        >
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Target School
              </label>
              <select
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-indigo-500"
                value={inviteSchoolId}
                onChange={(e) => setInviteSchoolId(e.target.value)}
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Target Role
              </label>
              <select
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-indigo-500"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="teacher">Teacher (Faculty Portal)</option>
                <option value="driver">Transport Driver (Route & GPS Portal)</option>
                <option value="staff">Administrative Staff</option>
                <option value="accountant">School Accountant (Fee Management)</option>
                <option value="parent">Parent / Guardian Portal</option>
              </select>
            </div>

            {/* Generated Link Display */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Shareable Onboarding Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedInviteUrl}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-slate-100 border border-slate-300 rounded-xl text-slate-800 select-all focus:outline-none"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={copyInviteLink}
                  leftIcon={isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {isCopied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            {/* Explanatory Banner */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Free & Passwordless Workflow</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Send this link via WhatsApp, email, or SMS. When recipient opens it and clicks <strong>Sign In with Google</strong>, they are automatically admitted to <strong>{selectedInviteSchool?.name}</strong> with the <strong>{inviteRole.replace('_', ' ')}</strong> role immediately!
              </p>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={shareOnWhatsApp}
                leftIcon={<Share2 className="w-3.5 h-3.5 text-emerald-600" />}
                className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              >
                Share on WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsInviteModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
