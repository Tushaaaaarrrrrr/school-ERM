'use client';

// ============================================================================
// In-App Account Deletion Request Page (App Store / Google Play Compliant)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { deletionService } from '@/lib/services/api';
import { AccountDeletionRequest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils/formatters';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

export default function AccountDeletePage() {
  const { currentUser, currentSchool } = useAuth();
  const { success, error: toastError } = useToast();

  const [existingRequests, setExistingRequests] = useState<AccountDeletionRequest[]>([]);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadRequests = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const all = await deletionService.getDeletionRequests();
      const userReqs = all.filter((r) => r.requested_by === currentUser.id);
      setExistingRequests(userReqs);
    } catch {
      toastError('Failed to load deletion request status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [currentUser]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      await deletionService.requestAccountDeletion(
        currentUser,
        reason.trim() || undefined
      );

      success('Account deletion request submitted for administrative review.');
      setReason('');
      loadRequests();
    } catch {
      toastError('Failed to submit deletion request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeRequest = existingRequests.find((r) => r.status === 'pending');

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 text-left space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Deletion Request</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your personal account privacy and institutional deletion request
          </p>
        </div>
      </div>

      {/* Active Pending Request Banner */}
      {activeRequest && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Clock className="w-5 h-5 text-amber-600" />
            <span>Deletion Request Pending Administrative Review</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Your deletion request submitted on <strong>{formatDate(activeRequest.requested_at)}</strong> is currently being reviewed by your school administrator.
          </p>
        </div>
      )}

      {/* Consequences Warning Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">What happens when you request deletion?</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Deleting your account will remove your digital login access to the SchoolERP portal. Certain academic transcripts, attendance logs, and tax receipt records may be retained by your school where required by applicable educational regulations and auditing law.
            </p>
          </div>
        </div>

        {!activeRequest && (
          <form onSubmit={handleSubmitRequest} className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Account Deletion (Optional)
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Graduated, moving to another institution, or no longer associated"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Link href="/">
                <Button type="button" variant="outline" size="sm">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                isLoading={isSubmitting}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Submit Deletion Request
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Request History */}
      {existingRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Request History
          </h3>
          <div className="divide-y divide-slate-100">
            {existingRequests.map((req) => (
              <div key={req.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-900">
                    Requested on {formatDate(req.requested_at)}
                  </span>
                  {req.request_reason && (
                    <p className="text-[11px] text-slate-500 mt-0.5">Reason: "{req.request_reason}"</p>
                  )}
                  {req.review_reason && (
                    <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                      Admin Note: "{req.review_reason}" (by {req.reviewed_by_name || 'Admin'})
                    </p>
                  )}
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    req.status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : req.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
