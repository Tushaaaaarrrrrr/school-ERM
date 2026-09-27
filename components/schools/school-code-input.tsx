'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  validateSchoolCodeFormat,
  sanitizeSchoolCode,
  SCHOOL_CODE_CONFIG,
  SchoolCodeValidationResult,
} from '@/lib/utils/school-code';
import { schoolService } from '@/lib/services/api';
import { CheckCircle2, XCircle, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface SchoolCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, isAvailable: boolean, isChecking: boolean) => void;
  excludeSchoolId?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  className?: string;
  id?: string;
}

export function SchoolCodeInput({
  value,
  onChange,
  onValidationChange,
  excludeSchoolId,
  label = 'School Code',
  required = true,
  disabled = false,
  helperText = 'Unique short prefix for student login (e.g. MVN01, JNS01)',
  className,
  id = 'school-code-input',
}: SchoolCodeInputProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeCheckCodeRef = useRef<string>('');

  const onValidationChangeRef = useRef(onValidationChange);
  useEffect(() => {
    onValidationChangeRef.current = onValidationChange;
  }, [onValidationChange]);

  const sanitizedValue = sanitizeSchoolCode(value);
  const formatResult: SchoolCodeValidationResult = validateSchoolCodeFormat(sanitizedValue);

  useEffect(() => {
    activeCheckCodeRef.current = sanitizedValue;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!sanitizedValue) {
      setIsChecking(false);
      setIsAvailable(null);
      setServerError(null);
      setServerMessage(null);
      onValidationChangeRef.current?.(false, false, false);
      return;
    }

    if (sanitizedValue.length < SCHOOL_CODE_CONFIG.MIN_LENGTH) {
      setIsChecking(false);
      setIsAvailable(null);
      setServerError(null);
      setServerMessage(null);
      onValidationChangeRef.current?.(false, false, false);
      return;
    }

    const validation = validateSchoolCodeFormat(sanitizedValue);
    if (!validation.isValid) {
      setIsChecking(false);
      setIsAvailable(false);
      setServerError('Not Available');
      setServerMessage(null);
      onValidationChangeRef.current?.(false, false, false);
      return;
    }

    // Trigger check
    setIsChecking(true);
    setServerError(null);
    setServerMessage(null);
    onValidationChangeRef.current?.(true, false, true);

    debounceTimerRef.current = setTimeout(async () => {
      const codeToCheck = sanitizedValue;
      try {
        const res = await schoolService.checkCodeAvailability(codeToCheck, excludeSchoolId);
        if (activeCheckCodeRef.current === codeToCheck) {
          setIsChecking(false);
          setIsAvailable(res.available);
          if (res.available) {
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
        if (activeCheckCodeRef.current === codeToCheck) {
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
  }, [sanitizedValue, excludeSchoolId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const clean = sanitizeSchoolCode(raw);
    onChange(clean);
  };

  // Determine input border and ring styles
  const getStatusBorder = () => {
    if (!sanitizedValue) return 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600';
    if (sanitizedValue.length < SCHOOL_CODE_CONFIG.MIN_LENGTH) {
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
      {/* Header Label and Character Counter */}
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
            'text-[11px] font-mono font-medium px-1.5 py-0.5 rounded transition-colors',
            sanitizedValue.length >= SCHOOL_CODE_CONFIG.MIN_LENGTH &&
              sanitizedValue.length <= SCHOOL_CODE_CONFIG.MAX_LENGTH
              ? 'bg-indigo-50 text-indigo-700 font-semibold'
              : 'bg-slate-100 text-slate-500'
          )}
        >
          {sanitizedValue.length}/{SCHOOL_CODE_CONFIG.MAX_LENGTH}
        </span>
      </div>

      {/* Input Field with Status Icon */}
      <div className="relative rounded-lg shadow-xs">
        <input
          id={id}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder="e.g. MVN01"
          maxLength={SCHOOL_CODE_CONFIG.MAX_LENGTH}
          disabled={disabled}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className={cn(
            'block w-full uppercase tracking-wider font-mono font-bold rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:normal-case placeholder:font-normal placeholder-slate-400 transition-all pr-10 focus:outline-none focus:ring-1 disabled:bg-slate-50 disabled:text-slate-500',
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
          ) : sanitizedValue.length > 0 && !formatResult.isValid ? (
            <AlertCircle className="w-4 h-4 text-amber-500" />
          ) : null}
        </div>
      </div>

      {/* Requirement Pills / Rules Checklist */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {/* Length Pill (5-7 chars) */}
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors',
            formatResult.hasMinLength && formatResult.hasMaxLength
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : sanitizedValue.length > 0
              ? 'bg-slate-100 text-slate-600 border border-slate-200'
              : 'bg-slate-50 text-slate-400 border border-slate-200'
          )}
        >
          {formatResult.hasMinLength && formatResult.hasMaxLength ? '✓' : '•'} 5–7 Chars
        </span>

        {/* Minimum 3 Letters Pill */}
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors',
            formatResult.hasMinLetters
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : sanitizedValue.length > 0
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-slate-50 text-slate-400 border border-slate-200'
          )}
        >
          {formatResult.hasMinLetters ? '✓' : '•'} Min 3 Letters ({formatResult.letterCount}/3)
        </span>

        {/* Minimum 2 Digits Pill */}
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors',
            formatResult.hasMinDigits
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : sanitizedValue.length > 0
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-slate-50 text-slate-400 border border-slate-200'
          )}
        >
          {formatResult.hasMinDigits ? '✓' : '•'} Min 2 Digits ({formatResult.digitCount}/2)
        </span>
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
      ) : sanitizedValue.length > 0 && !formatResult.isValid ? (
        <p className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {formatResult.error}
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
