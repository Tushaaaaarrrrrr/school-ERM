'use client';

// ============================================================================
// Super Admin Access Requests & Role Assignment Review Center
// ============================================================================

import React, { useEffect, useState } from 'react';
import { formatDate } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import {
  Clock,
  RefreshCw,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Mail,
  Building2,
  UserPlus,
} from 'lucide-react';

export default function SuperAdminAccessRequestsPage() {
  const { success, error: toastError } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Approval Modal State
  const [approvingReq, setApprovingReq] = useState<any | null>(null);
  const [assignedRole, setAssignedRole] = useState<string>('school_admin');
  const [assignedDesignation, setAssignedDesignation] = useState('');
  const [assignedDepartment, setAssignedDepartment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Reject Modal State
  const [rejectingReq, setRejectingReq] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/access-requests', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setRequests(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load access requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpenApprove = (req: any) => {
    setApprovingReq(req);
    setAssignedRole('school_admin');
    setAssignedDesignation('');
    setAssignedDepartment('');
  };

  const handleConfirmApprove = async () => {
    if (!approvingReq) return;
    setIsProcessing(true);
    try {
      const response = await fetch('/api/access-requests', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          requestId: approvingReq.id,
          role: assignedRole,
          name: approvingReq.applicant_name || approvingReq.profiles?.display_name,
          phone: approvingReq.phone || approvingReq.profiles?.phone,
          designation: assignedDesignation || undefined,
          department: assignedDepartment || undefined,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to approve request');

      success(`Successfully approved ${approvingReq.applicant_name || 'user'} as ${assignedRole.replace('_', ' ')}`);
      setApprovingReq(null);
      await load();
    } catch (err: any) {
      toastError(err.message || 'Failed to approve access request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingReq) return;
    setIsProcessing(true);
    try {
      const response = await fetch('/api/access-requests', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          requestId: rejectingReq.id,
          reason: rejectReason.trim() || 'Declined by Super Administrator',
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to decline request');

      success('Access request declined');
      setRejectingReq(null);
      setRejectReason('');
      await load();
    } catch (err: any) {
      toastError(err.message || 'Failed to decline access request');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (activeFilter === 'all') return true;
    return r.status === activeFilter;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Access Requests</h1>
          <p className="text-sm text-slate-500">
            Platform-wide history of school access applications. Approve, reject, or assign roles directly.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Refresh
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({requests.length})
        </button>
        <button
          onClick={() => setActiveFilter('pending')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeFilter === 'pending'
              ? 'bg-amber-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Pending ({pendingCount})
          {pendingCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>
        <button
          onClick={() => setActiveFilter('approved')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeFilter === 'approved'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Approved ({approvedCount})
        </button>
        <button
          onClick={() => setActiveFilter('rejected')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeFilter === 'rejected'
              ? 'bg-rose-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Declined ({rejectedCount})
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">Applicant</th>
                <th className="p-4">Email</th>
                <th className="p-4">School</th>
                <th className="p-4">Requested</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading &&
                filteredRequests.map((request) => {
                  const applicantName =
                    request.applicant_name || request.profiles?.display_name || 'Unknown';
                  const email = request.profiles?.email || '—';
                  const schoolName = request.schools?.name || 'Unknown School';
                  const schoolCode = request.schools?.code;

                  return (
                    <tr key={request.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-900">
                        {applicantName}
                        {request.phone && (
                          <span className="block text-xs font-normal text-slate-400 font-mono">
                            {request.phone}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600 font-mono text-xs">{email}</td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-800">{schoolName}</span>
                        {schoolCode && (
                          <span className="text-xs text-slate-400 block font-mono">
                            ({schoolCode})
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-slate-500 font-medium">
                        {formatDate(request.requested_at)}
                      </td>
                      <td className="p-4">
                        {request.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5" /> Pending Review
                          </span>
                        ) : request.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved (
                            {request.assigned_role?.replace('_', ' ') || 'Role Assigned'})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                            <XCircle className="w-3.5 h-3.5" /> Declined
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {request.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleOpenApprove(request)}
                              className="text-xs font-bold"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRejectingReq(request)}
                              className="text-xs font-bold text-rose-700 hover:bg-rose-50 border-rose-200"
                            >
                              Decline
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">
                            {request.reviewed_at ? `Reviewed ${formatDate(request.reviewed_at)}` : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="p-12 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span>Loading access requests…</span>
          </div>
        )}

        {!loading && !error && filteredRequests.length === 0 && (
          <div className="p-12 text-center text-sm text-slate-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <span>No access requests found in this view.</span>
          </div>
        )}
      </div>

      {/* APPROVE & ASSIGN ROLE MODAL */}
      {approvingReq && (
        <Modal
          isOpen={true}
          onClose={() => setApprovingReq(null)}
          title="Approve School Access Request"
          description={`Grant access to ${approvingReq.applicant_name || 'applicant'} for ${
            approvingReq.schools?.name || 'school'
          }`}
          maxWidth="md"
        >
          <div className="space-y-4 text-left">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p>
                <strong>Applicant:</strong>{' '}
                {approvingReq.applicant_name || approvingReq.profiles?.display_name} (
                {approvingReq.profiles?.email})
              </p>
              <p>
                <strong>School:</strong> {approvingReq.schools?.name}{' '}
                <span className="font-mono text-slate-500">({approvingReq.schools?.code})</span>
              </p>
              {approvingReq.applicant_notes && (
                <p>
                  <strong>Notes:</strong> {approvingReq.applicant_notes}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Assign Platform Role
              </label>
              <select
                value={assignedRole}
                onChange={(e) => setAssignedRole(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-indigo-500"
              >
                <option value="school_admin">School Admin (Full Management Access)</option>
                <option value="teacher">Teacher (Academics & Attendance)</option>
                <option value="accountant">Accountant (Fees & Collections)</option>
                <option value="staff">Staff / Support</option>
                <option value="driver">Driver (Transport Roster)</option>
                <option value="parent">Parent Portal</option>
              </select>
            </div>

            {(assignedRole === 'teacher' || assignedRole === 'staff') && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Department
                  </label>
                  <Input
                    placeholder="e.g. Science / Admin"
                    value={assignedDepartment}
                    onChange={(e) => setAssignedDepartment(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Designation
                  </label>
                  <Input
                    placeholder="e.g. Senior Teacher"
                    value={assignedDesignation}
                    onChange={(e) => setAssignedDesignation(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setApprovingReq(null)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmApprove}
                isLoading={isProcessing}
              >
                Confirm Approval
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* DECLINE REQUEST MODAL */}
      {rejectingReq && (
        <Modal
          isOpen={true}
          onClose={() => setRejectingReq(null)}
          title="Decline Access Request"
          description={`Decline access for ${rejectingReq.applicant_name || 'applicant'}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-left">
            <p className="text-xs text-slate-600">
              Are you sure you want to decline this request? The user will be notified that their application was not accepted.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Reason for Rejection (Optional)
              </label>
              <Input
                placeholder="e.g. Unverified identity or unauthorized application"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectingReq(null)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmReject}
                isLoading={isProcessing}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Decline Request
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

