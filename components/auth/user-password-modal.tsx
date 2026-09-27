import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { userPasswordService, passkeyService, RegisteredPasskey } from '@/lib/services/api';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Fingerprint,
  Plus,
  Trash2,
  Smartphone,
} from 'lucide-react';

interface UserPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UserPasswordModal({ isOpen, onClose, onSuccess }: UserPasswordModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Security, Passkeys & Password"
      description="Manage your account password and biometric passkeys for fast sign-in"
    >
      <UserPasswordCard onFinished={() => { onSuccess?.(); onClose(); }} isModal={true} />
    </Modal>
  );
}

export function UserPasswordCard({ onFinished, isModal = false }: { onFinished?: () => void; isModal?: boolean }) {
  const { currentUser } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Passkeys
  const [passkeys, setPasskeys] = useState<RegisteredPasskey[]>([]);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const isPasskeySupported = typeof window !== 'undefined' && passkeyService.isSupported();

  // Form Fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Visibility Toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const loadPasskeys = () => {
    if (!currentUser) return;
    const list = passkeyService.getUserPasskeys(currentUser.id);
    setPasskeys(list);
  };

  useEffect(() => {
    async function loadStatus() {
      if (!currentUser) return;
      setIsLoadingStatus(true);
      try {
        const res = await userPasswordService.getUserPasswordStatus(currentUser);
        setHasPassword(res.hasPassword);
        loadPasskeys();
      } catch {
        setHasPassword(false);
      } finally {
        setIsLoadingStatus(false);
      }
    }
    loadStatus();
  }, [currentUser]);

  const handleRegisterPasskey = async () => {
    if (!currentUser) return;
    setIsRegisteringPasskey(true);
    try {
      const res = await passkeyService.registerPasskey(currentUser);
      if (res.success && res.passkey) {
        toastSuccess(`Passkey registered! You can now sign in using ${res.passkey.name}.`);
        loadPasskeys();
      } else {
        toastError(res.error || 'Failed to register passkey');
      }
    } catch {
      toastError('Could not create passkey on this device.');
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  const handleDeletePasskey = (id: string) => {
    passkeyService.deletePasskey(id);
    loadPasskeys();
    toastSuccess('Passkey removed.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!currentUser) {
      setFormError('No active user session found.');
      return;
    }

    if (newPassword.length < 6) {
      setFormError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('New password and confirm password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (hasPassword) {
        // Existing user: requires current password
        if (!currentPassword) {
          setFormError('Please enter your current password.');
          setIsSubmitting(false);
          return;
        }

        const res = await userPasswordService.changeUserPassword(
          currentUser,
          currentPassword,
          newPassword
        );

        if (res.success) {
          toastSuccess('Password updated successfully!');
          setFormSuccess('Your password has been changed successfully. You can now use it to sign in.');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setTimeout(() => onFinished?.(), 1500);
        } else {
          setFormError(res.error || 'Failed to update password. Please check your current password.');
        }
      } else {
        // New user without prior password
        const res = await userPasswordService.setUserPassword(currentUser, newPassword);
        if (res.success) {
          toastSuccess('Password created successfully!');
          setFormSuccess('Your password has been created! You can now sign in directly using your email or registration number.');
          setHasPassword(true);
          setNewPassword('');
          setConfirmPassword('');
          setTimeout(() => onFinished?.(), 1500);
        } else {
          setFormError(res.error || 'Failed to create password.');
        }
      }
    } catch {
      setFormError('An unexpected error occurred while saving your password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingStatus) {
    return (
      <div className="p-6 text-center text-xs text-slate-500">
        Loading security status...
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* 1. BIOMETRIC PASSKEYS SECTION                                  */}
      {/* ============================================================== */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Fingerprint className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Passkeys &amp; Biometric Sign-In</h4>
              <p className="text-[11px] text-slate-500">Sign in with Touch ID, Face ID, or Windows Hello</p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRegisterPasskey}
            isLoading={isRegisteringPasskey}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Add Passkey
          </Button>
        </div>

        {passkeys.length > 0 ? (
          <div className="divide-y divide-slate-200 border-t border-slate-200/80 pt-2 space-y-1">
            {passkeys.map((pk) => (
              <div key={pk.id} className="pt-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="font-semibold text-slate-800">{pk.name}</p>
                    <p className="text-[10px] text-slate-400">
                      Added on {new Date(pk.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeletePasskey(pk.id)}
                  className="text-rose-500 hover:text-rose-700 p-1 rounded-md transition-colors cursor-pointer"
                  title="Delete passkey"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 pt-1">
            No passkeys registered yet. Click &quot;Add Passkey&quot; to enable one-touch biometric login on this device.
          </p>
        )}
      </div>

      {/* ============================================================== */}
      {/* 2. PASSWORD FORM SECTION                                       */}
      {/* ============================================================== */}
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Informative Banner */}
        <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-indigo-950">
              {hasPassword ? 'Change Your Account Password' : 'Create Account Password'}
            </p>
            <p className="text-indigo-700/90 mt-0.5 leading-relaxed">
              {hasPassword
                ? 'Enter your current password to verify your identity, then set a new password.'
                : 'You have not set a password yet (e.g. you signed up with Google). Create a password below to enable direct sign-in with your email or registration number.'}
            </p>
          </div>
        </div>

        {formError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {formSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formSuccess}</span>
          </div>
        )}

        {/* 1. Current Password (Only shown if user has an existing password) */}
        {hasPassword && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* 2. New Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {hasPassword ? 'New Password' : 'Create Password'} <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 3. Confirm Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Confirm {hasPassword ? 'New ' : ''}Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button
            type="submit"
            variant="primary"
            className="py-2.5 px-5 rounded-xl text-xs font-bold cursor-pointer"
            isLoading={isSubmitting}
          >
            {hasPassword ? 'Update Password' : 'Create Password'}
          </Button>
        </div>
      </form>
    </div>
  );

  if (isModal) {
    return content;
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Security, Passkeys &amp; Password</h3>
            <p className="text-xs text-slate-500">Manage credentials and Touch/Face ID for direct sign-in</p>
          </div>
        </div>
      </div>
      {content}
    </div>
  );
}
