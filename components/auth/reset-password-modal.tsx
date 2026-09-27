'use client';

// ============================================================================
// Hierarchical Password Reset Modal Component
// ============================================================================

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateSecurePassword, validatePasswordStrength } from '@/lib/utils/security';
import { useToast } from '@/components/ui/toast';
import { securityService } from '@/lib/services/api';
import { UserRole } from '@/lib/types';
import { useAuth } from '@/lib/context/auth-context';
import { KeyRound, Sparkles, Copy, Check, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole: UserRole;
  targetId: string;
  targetName: string;
  targetLoginId?: string;
  schoolId?: string;
  onSuccess?: () => void;
}

export function ResetPasswordModal({
  isOpen,
  onClose,
  targetRole,
  targetId,
  targetName,
  targetLoginId,
  schoolId,
  onSuccess,
}: ResetPasswordModalProps) {
  const { currentUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requireChange, setRequireChange] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerate = () => {
    const generated = generateSecurePassword(14);
    setNewPassword(generated);
    setConfirmPassword(generated);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!newPassword) return;
    try {
      await navigator.clipboard.writeText(newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      success('Temporary password copied to clipboard!');
    } catch {
      toastError('Could not copy to clipboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toastError('Passwords do not match');
      return;
    }

    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      toastError(validation.message || 'Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await securityService.resetUserPassword({
        schoolId,
        targetRole,
        targetId,
        targetName,
        newPassword,
        requireChangeOnNextLogin: requireChange,
        actorUserId: currentUser?.id || 'admin',
        actorRole: currentUser?.role || 'school_admin',
        actorName: currentUser?.name || 'Administrator',
      });

      success(res.message);
      setNewPassword('');
      setConfirmPassword('');
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reset Account Password"
      description={`Set a new temporary password for ${targetName} (${targetLoginId || targetRole})`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Generate a high-entropy 14-character password</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
          >
            Generate
          </Button>
        </div>

        {/* New Password Input with Eye & Copy */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            New Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters (12+ recommended)"
              className="w-full pl-3 pr-20 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {newPassword && (
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy password"
                  className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Confirm Password <span className="text-rose-500">*</span>
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Require Password Change on Next Login Checkbox */}
        <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={requireChange}
            onChange={(e) => setRequireChange(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
          />
          <span>
            <strong>Require password change on next login</strong> (Recommended for temporary passwords)
          </span>
        </label>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Reset Password
          </Button>
        </div>
      </form>
    </Modal>
  );
}
