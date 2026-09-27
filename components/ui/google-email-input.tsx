'use client';

// ============================================================================
// Centralized Google Email Input with Live Uniqueness & Availability Check
// Supports School Admins, Teachers, Staff, and Parents
// Strictly enforces concise 'Checking...', 'Available', and 'Not Available'
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { emailValidationService } from '@/lib/services/api';
import { CheckCircle2, XCircle, Loader2, AlertCircle, Mail, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface GoogleEmailInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, isAvailable: boolean, isChecking: boolean) => void;
  targetSchoolId?: string;
  targetRole?: string;
  excludeSchoolId?: string;
  excludeEmail?: string;
  excludeUserId?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  className?: string;
  id?: string;
}

export function GoogleEmailInput({
  value,
  onChange,
  onValidationChange,
  targetSchoolId,
  targetRole,
  excludeSchoolId,
  excludeEmail,
  excludeUserId,
  label = 'Google Email (@gmail.com)',
  placeholder = 'user.name@gmail.com',
  required = false,
  disabled = false,
  helperText,
  className,
  id = 'google-email-input',
}: GoogleEmailInputProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeCheckEmailRef = useRef<string>('');

  const onValidationChangeRef = useRef(onValidationChange);
  useEffect(() => {
    onValidationChangeRef.current = onValidationChange;
  }, [onValidationChange]);

  const cleanValue = (value || '').trim().toLowerCase();
  const formatResult = emailValidationService.validateGmailFormat(cleanValue);
  const isGmailFormat = cleanValue.endsWith('@gmail.com');

  useEffect(() => {
    activeCheckEmailRef.current = cleanValue;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!cleanValue) {
      setIsChecking(false);
      setIsAvailable(null);
      setServerError(null);
      setServerMessage(null);
      onValidationChangeRef.current?.(!required, true, false);
      return;
    }

    // Only start checking when user has entered '@gmail.com'
    if (!cleanValue.endsWith('@gmail.com')) {
      setIsChecking(false);
      setIsAvailable(null);
      setServerError(null);
      setServerMessage(null);
      onValidationChangeRef.current?.(false, false, false);
      return;
    }

    const format = emailValidationService.validateGmailFormat(cleanValue);
    if (!format.isValid) {
      setIsChecking(false);
      setIsAvailable(false);
      setServerError('Not Available');
      setServerMessage(null);
      onValidationChangeRef.current?.(false, false, false);
      return;
    }

    setIsChecking(true);
    setServerError(null);
    setServerMessage(null);
    onValidationChangeRef.current?.(true, false, true);

    debounceTimerRef.current = setTimeout(async () => {
      const emailToCheck = cleanValue;
      try {
        const res = await emailValidationService.verifyEmailAvailability(emailToCheck, {
          targetSchoolId,
          targetRole,
          excludeSchoolId,
          excludeEmail,
          excludeUserId,
        });

        if (activeCheckEmailRef.current === emailToCheck) {
          setIsChecking(false);
          setIsAvailable(res.isAvailable);
          if (res.isAvailable) {
            setServerMessage('Available');
            setServerError(null);
            onValidationChangeRef.current?.(true, true, false);
          } else {
            setServerError('Not Available');
            setServerMessage(null);
            onValidationChangeRef.current?.(true, false, false);
          }
        }
      } catch {
        if (activeCheckEmailRef.current === emailToCheck) {
          setIsChecking(false);
          setIsAvailable(false);
          setServerError('Not Available');
          onValidationChangeRef.current?.(true, false, false);
        }
      }
    }, 280);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [cleanValue, targetSchoolId, targetRole, excludeSchoolId, excludeEmail, excludeUserId, required]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const getStatusBorder = () => {
    if (!cleanValue) return 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600';
    if (!isGmailFormat) {
      return 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600';
    }
    if (isChecking) {
      return 'border-indigo-400 focus:border-indigo-600 focus:ring-indigo-600';
    }
    if (isAvailable === true) {
      return 'border-emerald-500 bg-emerald-50/20 focus:border-emerald-600 focus:ring-emerald-600';
    }
    if (isAvailable === false || serverError || !formatResult.isValid) {
      return 'border-rose-500 bg-rose-50/20 focus:border-rose-600 focus:ring-rose-600';
    }
    return 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600';
  };

  return (
    <div className={cn('w-full space-y-1.5 text-left', className)}>
      {/* Label and Domain Tag */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
        >
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
        <span
          className={cn(
            'text-[10px] font-mono font-medium px-1.5 py-0.5 rounded transition-colors',
            cleanValue.endsWith('@gmail.com')
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : cleanValue.includes('@')
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-slate-100 text-slate-500'
          )}
        >
          @gmail.com
        </span>
      </div>

      {/* Input Field with Status Icon */}
      <div className="relative rounded-lg shadow-xs">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Mail className="w-4 h-4" />
        </div>

        <input
          id={id}
          type="email"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={cn(
            'block w-full rounded-lg border bg-white pl-9 pr-10 py-2 text-sm text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-1 disabled:bg-slate-50 disabled:text-slate-500',
            getStatusBorder()
          )}
        />

        {/* Right Status Indicator */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {isChecking ? (
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
          ) : isAvailable === true ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : isAvailable === false || serverError ? (
            <XCircle className="w-4 h-4 text-rose-500" />
          ) : null}
        </div>
      </div>

      {/* Live Server Feedback / Validation Notice */}
      {isChecking ? (
        <p className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
          <Loader2 className="w-3 h-3 animate-spin shrink-0" />
          Checking...
        </p>
      ) : serverMessage && isAvailable === true ? (
        <p className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          {serverMessage}
        </p>
      ) : serverError ? (
        <p className="flex items-center gap-1.5 text-xs text-rose-600 font-bold">
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          {serverError}
        </p>
      ) : cleanValue && !cleanValue.endsWith('@gmail.com') ? (
        <p className="flex items-center gap-1.5 text-[11px] text-amber-600 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Must end with @gmail.com
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-slate-400 shrink-0" />
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
