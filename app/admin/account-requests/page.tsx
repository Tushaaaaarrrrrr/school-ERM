'use client';

// ============================================================================
// School Admin User Deletion Requests Review Center
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { deletionService } from '@/lib/services/api';
import { AccountDeletionRequest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils/formatters';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  AlertTriangle,
  UserX,
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';

export default function AdminAccountRequestsPage() {
  const { currentSchool, currentUser } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const { success, error: toastError } = useToast();

  const [requests, setRequests] = useState<AccountDeletionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Reject Modal State
  const [rejectingReq, setRejectingReq] = useState<AccountDeletionRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const list = await deletionService.getDeletionRequests(schoolId);
      setRequests(list);
    } catch {
      toastError('Failed to load deletion requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [schoolId]);

  const handleApprove = async (req: AccountDeletionRequest) => {
    try {
      await deletionService.reviewDeletionRequest(
        req.id,
        'approved',
        'Approved by School Administrator',
        currentUser?.id || 'admin',
        currentUser?.name || 'School Admin'
      );
      success(`Deletion request for ${req.user_name} approved!`);
      loadRequests();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to approve request');
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingReq) return;
    if (!rejectReason.trim()) {
      toastError('A mandatory rejection reason is required.');
      return;
    }

    setIsProcessing(true);
    try {
      await deletionService.reviewDeletionRequest(
        rejectingReq.id,
        'rejected',
        rejectReason.trim(),
        currentUser?.id || 'admin',
        currentUser?.name || 'School Admin'
      );
      success(`Deletion request rejected.`);
      setRejectingReq(null);
      setRejectReason('');
      loadRequests();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Deletion Requests</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review incoming account deletion and privacy requests from students, teachers, and staff
        </p>
      </div>

      {/* Requests Table */}
      {isLoading ? (
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <TableSkeleton rows={4} cols={5} />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-900 mb-1">No pending deletion requests</p>
          <p className="text-xs text-slate-400">All submitted user deletion requests have been reviewed.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Reason</th>
                  <th className="px-5 py-3.5">Submitted Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {r.user_name}
                      {r.user_email && (
                        <span className="block font-normal text-[11px] text-slate-400">{r.user_email}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 capitalize font-medium">{r.user_role.replace('_', ' ')}</td>
                    <td className="px-5 py-3.5 text-slate-600 italic">{r.request_reason || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-500">{formatDate(r.requested_at)}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          r.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : r.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {r.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleApprove(r)}
                            leftIcon={<UserX className="w-3 h-3" />}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRejectingReq(r);
                              setRejectReason('');
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mandatory Rejection Reason Modal */}
      <Modal
        isOpen={!!rejectingReq}
        onClose={() => setRejectingReq(null)}
        title="Reject Account Deletion Request"
        description={`Provide a mandatory educational or operational rationale for denying deletion to ${rejectingReq?.user_name}`}
      >
        <form onSubmit={handleReject} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Rejection <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Student currently has active academic examination enrollment or statutory fee audit pending."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setRejectingReq(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isProcessing}>
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
