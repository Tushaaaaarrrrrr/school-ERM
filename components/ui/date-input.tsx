'use client';

// ============================================================================
// DateInput Component (Date/Month/Year Format: DD/MM/YYYY)
// Provides localized DD/MM/YYYY display and typing with calendar picker support
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Calendar } from 'lucide-react';

export interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function isoToDisplay(iso: string | number | readonly string[] | undefined): string {
  if (!iso || typeof iso !== 'string') return '';
  const match = iso.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return '';
  const [, y, m, d] = match;
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
}

export function displayToIso(display: string): string | null {
  if (!display) return null;
  const match = display.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  const day = parseInt(d, 10);
  const month = parseInt(m, 10);
  const year = parseInt(y, 10);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (year < 1900 || year > 2100) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatRawDigits(raw: string, isDeleting: boolean): string {
  // If pasted in ISO format YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(raw.trim())) {
    return isoToDisplay(raw.trim());
  }

  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (!digits) return '';

  if (digits.length <= 2) {
    return digits + (digits.length === 2 && !isDeleting ? '/' : '');
  } else if (digits.length <= 4) {
    return digits.slice(0, 2) + '/' + digits.slice(2) + (digits.length === 4 && !isDeleting ? '/' : '');
  } else {
    return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
  }
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      rightElement,
      id,
      value,
      defaultValue,
      onChange,
      onBlur,
      placeholder = 'dd / mm / yyyy',
      required,
      disabled,
      min,
      max,
      name,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : undefined);

    const initialDisplay = isoToDisplay(value ?? defaultValue);
    const [displayValue, setDisplayValue] = useState(initialDisplay);
    const isDeletingRef = useRef(false);
    const pickerRef = useRef<HTMLInputElement>(null);
    const textInputRef = useRef<HTMLInputElement>(null);

    // Sync display value when parent value changes
    useEffect(() => {
      const formatted = isoToDisplay(value);
      setDisplayValue(formatted);
    }, [value]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const formatted = formatRawDigits(raw, isDeletingRef.current);
      setDisplayValue(formatted);

      if (onChange) {
        if (!formatted) {
          // Cleared
          const syntheticEvent = {
            ...e,
            target: {
              ...e.target,
              name: name || '',
              id: inputId || '',
              value: '',
            },
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(syntheticEvent);
        } else {
          const iso = displayToIso(formatted);
          if (iso) {
            const syntheticEvent = {
              ...e,
              target: {
                ...e.target,
                name: name || '',
                id: inputId || '',
                value: iso,
              },
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(syntheticEvent);
          }
        }
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      isDeletingRef.current = e.key === 'Backspace' || e.key === 'Delete';
      props.onKeyDown?.(e);
    };

    const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const iso = e.target.value; // YYYY-MM-DD from native date picker
      if (iso) {
        setDisplayValue(isoToDisplay(iso));
      } else {
        setDisplayValue('');
      }

      if (onChange) {
        onChange(e);
      }
    };

    const openCalendarPicker = () => {
      if (disabled) return;
      try {
        if (pickerRef.current && typeof pickerRef.current.showPicker === 'function') {
          pickerRef.current.showPicker();
          return;
        }
      } catch {}
      pickerRef.current?.focus();
    };

    // Current ISO value for the native picker
    const currentIso = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? value
      : displayToIso(displayValue) || '';

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative rounded-lg shadow-xs">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 z-10">
              {leftIcon}
            </div>
          )}

          {/* Formatted Text Input showing DD/MM/YYYY */}
          <input
            {...props}
            ref={(node) => {
              (textInputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
              }
            }}
            id={inputId}
            name={name}
            type="text"
            inputMode="numeric"
            maxLength={10}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
            value={displayValue}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onBlur={onBlur}
            className={cn(
              'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 disabled:bg-slate-50 disabled:text-slate-500 pr-10 font-normal',
              leftIcon && 'pl-9',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500',
              className
            )}
          />

          {/* Calendar Picker Trigger */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2.5">
            {rightElement ? (
              rightElement
            ) : rightIcon ? (
              rightIcon
            ) : (
              <div className="relative flex items-center justify-center w-7 h-7">
                {/* Visual Calendar Icon */}
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Open calendar picker"
                  onClick={openCalendarPicker}
                  disabled={disabled}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <Calendar className="w-4 h-4" />
                </button>

                {/* Invisible Native Date Picker overlay to ensure instant mobile/browser support */}
                <input
                  ref={pickerRef}
                  type="date"
                  tabIndex={-1}
                  aria-hidden="true"
                  disabled={disabled}
                  min={min}
                  max={max}
                  value={currentIso}
                  onChange={handlePickerChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto"
                />
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

DateInput.displayName = 'DateInput';
