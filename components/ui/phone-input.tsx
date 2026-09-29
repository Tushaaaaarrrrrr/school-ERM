'use client';

// ============================================================================
// GI Campus - Standard 10-Digit Mobile / Phone Input Component
// Enforces: Starts with 6, 7, 8, or 9 and exactly 10 digits only
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Phone, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { sanitizeIndianMobile, isValidIndianMobile } from '@/lib/utils/formatters';

export { sanitizeIndianMobile, isValidIndianMobile };

export interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  className?: string;
  id?: string;
}

export function validatePhoneNumber(raw: string): {
  isValid: boolean;
  error?: string;
  cleaned: string;
} {
  const cleaned = sanitizeIndianMobile(raw);
  if (!cleaned) {
    return { isValid: false, cleaned };
  }
  if (!/^[6-9]/.test(cleaned)) {
    return {
      isValid: false,
      error: 'Must start with 6, 7, 8, or 9',
      cleaned,
    };
  }
  if (cleaned.length !== 10) {
    return {
      isValid: false,
      error: `Must be exactly 10 digits (${cleaned.length}/10)`,
      cleaned,
    };
  }
  return { isValid: true, cleaned };
}

export function PhoneInput({
  value,
  onChange,
  onValidationChange,
  label = 'Phone Number',
  required = true,
  disabled = false,
  placeholder = '98765 00000',
  helperText,
  className,
  id = 'phone-input',
}: PhoneInputProps) {
  const cleaned = sanitizeIndianMobile(value || '');
  const validation = validatePhoneNumber(cleaned);

  useEffect(() => {
    onValidationChange?.(validation.isValid);
  }, [validation.isValid, onValidationChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeIndianMobile(e.target.value);
    onChange(sanitized);
  };

  const getStatusBorder = () => {
    if (!cleaned) return 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600';
    if (!/^[6-9]/.test(cleaned)) {
      return 'border-rose-500 bg-rose-50/20 focus:border-rose-600 focus:ring-rose-600';
    }
    if (cleaned.length === 10) {
      return 'border-emerald-500 bg-emerald-50/20 focus:border-emerald-600 focus:ring-emerald-600';
    }
    return 'border-amber-400 bg-amber-50/10 focus:border-indigo-600 focus:ring-indigo-600';
  };

  return (
    <div className={cn('w-full space-y-1.5 text-left', className)}>
      {/* Header Label and Counter Badge */}
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
            cleaned.length === 10 && /^[6-9]/.test(cleaned)
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
              : cleaned.length > 0 && !/^[6-9]/.test(cleaned)
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : cleaned.length > 0
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-slate-100 text-slate-500'
          )}
        >
          {cleaned.length}/10 Digits
        </span>
      </div>

      {/* Input Field with +91 Country Prefix */}
      <div className="relative rounded-lg shadow-xs flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 gap-1.5 border-r border-slate-200 pr-2 my-1.5">
          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs font-semibold font-mono text-slate-600">+91</span>
        </div>

        <input
          id={id}
          type="tel"
          inputMode="numeric"
          pattern="[6-9][0-9]{9}"
          maxLength={10}
          value={cleaned}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="tel-national"
          className={cn(
            'block w-full rounded-lg border bg-white pl-20 pr-10 py-2 text-sm font-mono tracking-wider text-slate-900 placeholder:font-sans placeholder:tracking-normal placeholder-slate-400 transition-all focus:outline-none focus:ring-1 disabled:bg-slate-50 disabled:text-slate-500',
            getStatusBorder()
          )}
        />

        {/* Right Status Indicator */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {cleaned.length === 10 && /^[6-9]/.test(cleaned) ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : cleaned.length > 0 && !/^[6-9]/.test(cleaned) ? (
            <XCircle className="w-4 h-4 text-rose-500" />
          ) : cleaned.length > 0 ? (
            <AlertCircle className="w-4 h-4 text-amber-500" />
          ) : null}
        </div>
      </div>

      {/* Requirement Pills / Rules Checklist */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors',
            /^[6-9]/.test(cleaned)
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : cleaned.length > 0
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-slate-50 text-slate-400 border border-slate-200'
          )}
        >
          {/^[6-9]/.test(cleaned) ? '✓' : '•'} Starts with 6, 7, 8, 9
        </span>

        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors',
            cleaned.length === 10
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : cleaned.length > 0
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-slate-50 text-slate-400 border border-slate-200'
          )}
        >
          {cleaned.length === 10 ? '✓' : '•'} Exactly 10 Digits
        </span>
      </div>

      {/* Feedback Messages */}
      {cleaned.length > 0 && !/^[6-9]/.test(cleaned) ? (
        <p className="flex items-center gap-1.5 text-xs text-rose-600 font-bold">
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          Invalid number: Must start with 6, 7, 8, or 9
        </p>
      ) : cleaned.length > 0 && cleaned.length < 10 ? (
        <p className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Enter {10 - cleaned.length} more digit{10 - cleaned.length > 1 ? 's' : ''} (must be 10 digits)
        </p>
      ) : cleaned.length === 10 && /^[6-9]/.test(cleaned) ? (
        <p className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Valid 10-digit mobile number
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
