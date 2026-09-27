'use client';

// ============================================================================
// 5-Digit Mandatory Security PIN Lock Screen
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { pinSecurityService } from '@/lib/services/api';
import {
  Lock,
  Unlock,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  LogOut,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Delete,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PinLockScreen() {
  const { currentUser, currentSchool, verifyPin, logout } = useAuth();
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number>(5);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  // Check initial PIN status on load
  const loadInitialStatus = useCallback(async () => {
    if (!currentUser) return;
    if (currentUser.role === 'super_admin') {
      await verifyPin('');
      return;
    }
    try {
      const status = await pinSecurityService.getUserPinStatus(currentUser);
      if (!status.hasPin) {
        await verifyPin('');
        return;
      }
      setIsLocked(status.isLocked);
      setRemainingAttempts(Math.max(0, 5 - status.failedAttempts));
      if (status.isLocked) {
        setErrorMsg(
          currentUser.role === 'school_admin'
            ? 'Account Locked: 5 failed attempts exceeded. Please contact Super Admin to unlock your campus portal.'
            : 'Account Locked: 5 failed attempts exceeded. Please contact your School Principal to unlock your portal.'
        );
      }
    } catch (err) {
      console.error('Error fetching PIN status:', err);
    }
  }, [currentUser, verifyPin]);

  useEffect(() => {
    loadInitialStatus();
  }, [loadInitialStatus]);

  const handleDigitPress = (digit: string) => {
    if (isLocked || isChecking) return;
    if (pin.length < 5) {
      const newPin = pin + digit;
      setPin(newPin);
      setErrorMsg(null);
      if (newPin.length === 5) {
        submitPin(newPin);
      }
    }
  };

  const handleDeleteDigit = () => {
    if (isLocked || isChecking) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    if (isLocked || isChecking) return;
    setPin('');
    setErrorMsg(null);
  };

  const submitPin = async (pinToVerify: string) => {
    if (pinToVerify.length !== 5 || isChecking) return;
    setIsChecking(true);
    try {
      const res = await verifyPin(pinToVerify);
      if (!res.success) {
        setPin('');
        if (res.isLocked) {
          setIsLocked(true);
          setRemainingAttempts(0);
          setErrorMsg(res.error || 'Account security locked. Maximum failed attempts reached.');
        } else {
          setRemainingAttempts(res.remainingAttempts ?? 5);
          setErrorMsg(res.error || 'Incorrect PIN. Please try again.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Verification failed. Please try again.');
      setPin('');
    } finally {
      setIsChecking(false);
    }
  };

  // Keyboard navigation support (0-9, Backspace, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked || isChecking) return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteDigit();
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isLocked, isChecking]);

  if (!currentUser) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 select-none overflow-y-auto">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-center my-auto transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header Branding */}
        <div className="bg-slate-900 text-white p-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg ${
                isLocked
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-indigo-600 text-white ring-4 ring-indigo-500/30'
              }`}
            >
              {isLocked ? (
                <ShieldAlert className="w-7 h-7" />
              ) : (
                <Lock className="w-7 h-7" />
              )}
            </div>

            <h2 className="text-base font-bold text-white tracking-tight">
              {isLocked ? 'Security Lockout' : 'Security Verification'}
            </h2>

            <p className="text-xs text-slate-300 mt-1 max-w-[240px]">
              {isLocked
                ? 'Account has been temporarily locked'
                : 'Enter your 5-digit PIN to unlock your workspace'}
            </p>

            {/* School / User Info pill */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-slate-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{currentUser.name}</span>
              <span className="text-slate-400 capitalize">({currentUser.role.replace('_', ' ')})</span>
            </div>
          </div>
        </div>

        {/* Lockout Notice or PIN Dot Display */}
        <div className="p-6 space-y-6">
          {isLocked ? (
            <div className="space-y-4 text-left p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1.5">
                  <p className="font-bold text-rose-950">5 Failed Attempts Exceeded</p>
                  <p className="text-rose-800 leading-relaxed">
                    {currentUser.role === 'school_admin'
                      ? 'For your school’s data protection, this Principal account has been locked. Please contact Super Admin (pay.laxmikant@gmail.com) to reset your PIN.'
                      : 'For security reasons, your account is locked. Please contact your School Principal to reset your 5-digit PIN.'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-rose-200 flex items-center justify-between text-[11px] text-rose-700">
                <span>School: <strong>{currentSchool?.name || 'Assigned School'}</strong></span>
                <span className="font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ) : (
            <>
              {/* 5-Digit Indicator Dots */}
              <div>
                <div className="flex items-center justify-center gap-3.5 mb-2">
                  {[0, 1, 2, 3, 4].map((index) => {
                    const isFilled = pin.length > index;
                    const isCurrent = pin.length === index;

                    return (
                      <div
                        key={index}
                        className={`w-4 h-4 rounded-full transition-all duration-200 ${
                          isFilled
                            ? 'bg-indigo-600 scale-110 shadow-md ring-2 ring-indigo-200'
                            : isCurrent
                            ? 'border-2 border-indigo-500 bg-indigo-50 scale-105'
                            : 'border-2 border-slate-300 bg-slate-100'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Remaining Attempts Tag */}
                <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500">
                  {remainingAttempts < 3 ? (
                    <span className="text-rose-600 flex items-center gap-1 font-bold animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {remainingAttempts} attempt{remainingAttempts > 1 ? 's' : ''} remaining before lockout
                    </span>
                  ) : (
                    <span>Max 5 attempts • {remainingAttempts} remaining</span>
                  )}
                </div>
              </div>

              {/* Error Message banner */}
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center animate-shake">
                  {errorMsg}
                </div>
              )}

              {/* Numeric Dial Keypad */}
              <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleDigitPress(digit)}
                    disabled={isChecking}
                    className="h-12 rounded-xl text-base font-bold text-slate-800 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 active:scale-95 transition-all shadow-2xs"
                  >
                    {digit}
                  </button>
                ))}

                {/* Clear Button */}
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isChecking || pin.length === 0}
                  className="h-12 rounded-xl text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all shadow-2xs disabled:opacity-40"
                  title="Clear PIN"
                >
                  Clear
                </button>

                {/* 0 Button */}
                <button
                  type="button"
                  onClick={() => handleDigitPress('0')}
                  disabled={isChecking}
                  className="h-12 rounded-xl text-base font-bold text-slate-800 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 active:scale-95 transition-all shadow-2xs"
                >
                  0
                </button>

                {/* Backspace Button */}
                <button
                  type="button"
                  onClick={handleDeleteDigit}
                  disabled={isChecking || pin.length === 0}
                  className="h-12 rounded-xl flex items-center justify-center text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-rose-600 active:scale-95 transition-all shadow-2xs disabled:opacity-40"
                  title="Backspace"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Secure 5-Digit Verification
            </span>

            <button
              type="button"
              onClick={logout}
              className="font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
