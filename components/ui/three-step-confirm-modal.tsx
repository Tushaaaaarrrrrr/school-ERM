'use client';

// ============================================================================
// Three-Step Safety Confirmation Modal (Destructive / Sensitive Actions)
// ============================================================================

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/context/auth-context';
import { AlertTriangle, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

interface ThreeStepConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  actionLabel: string;
  impactDetails: { label: string; value: string | number }[];
  warningMessage: string;
  expectedConfirmationText: string;
  confirmationPrompt: string;
  onConfirm: (reason: string, reauthPassword?: string) => Promise<void>;
}

export function ThreeStepConfirmModal({
  isOpen,
  onClose,
  title,
  actionLabel,
  impactDetails,
  warningMessage,
  expectedConfirmationText,
  confirmationPrompt,
  onConfirm,
}: ThreeStepConfirmModalProps) {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [reason, setReason] = useState('');
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetModal = () => {
    setCurrentStep(1);
    setReason('');
    setTypedConfirmation('');
    setError(null);
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleStep1Next = () => {
    if (!reason.trim()) {
      setError('Please provide a valid operational reason to continue.');
      return;
    }
    setError(null);
    setCurrentStep(2);
  };

  const handleStep2Next = () => {
    if (typedConfirmation.trim().toUpperCase() !== expectedConfirmationText.trim().toUpperCase()) {
      setError(`Typed confirmation must exactly match "${expectedConfirmationText}".`);
      return;
    }
    setError(null);
    setCurrentStep(3);
  };

  const handleFinalConfirm = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await onConfirm(reason.trim(), currentUser?.email || 'authorized_admin');
      handleClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Execution failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="space-y-5 text-left text-xs">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                currentStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              1
            </span>
            <span className="font-semibold text-slate-700">Warning & Impact</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                currentStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              2
            </span>
            <span className="font-semibold text-slate-700">Typed Confirmation</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                currentStep === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              3
            </span>
            <span className="font-semibold text-slate-700">Authorize</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Warning & Impact Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{warningMessage}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Scope & Impact Summary
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {impactDetails.map((item, idx) => (
                  <div key={idx} className="bg-white p-2 rounded border border-slate-200/80">
                    <span className="text-slate-400 text-[10px] block">{item.label}</span>
                    <strong className="text-slate-900 font-semibold">{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Administrative Reason / Justification <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for audit log..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleStep1Next}>
                Continue to Step 2 →
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Typed Confirmation */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <p className="text-slate-700 leading-relaxed">{confirmationPrompt}</p>
              <div className="p-2 rounded bg-white font-mono font-bold text-center text-rose-600 border border-rose-200 select-all">
                {expectedConfirmationText}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Type exact confirmation text <span className="text-rose-500">*</span>
              </label>
              <Input
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                placeholder={`Type "${expectedConfirmationText}" here`}
              />
            </div>

            <div className="flex justify-between pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)}>
                ← Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleStep2Next}
                disabled={typedConfirmation.trim().toUpperCase() !== expectedConfirmationText.trim().toUpperCase()}
              >
                Proceed to Final Authorization →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Administrator Authorization Check */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="block text-xs font-bold text-emerald-900">
                  Authorized Platform Administrator
                </strong>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Authenticated as <strong>{currentUser?.name || 'Administrator'}</strong> (
                  <span className="font-mono text-emerald-700">{currentUser?.email || 'pay.laxmikant@gmail.com'}</span>).
                </p>
                <p className="text-[11px] text-slate-600 pt-1">
                  Ready to execute <strong>{actionLabel}</strong>. This action will be logged in the permanent platform security audit trail.
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setCurrentStep(2)}>
                ← Back
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isProcessing}
                onClick={handleFinalConfirm}
              >
                {actionLabel}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
