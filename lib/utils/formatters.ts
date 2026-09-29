// ============================================================================
// Formatting Utilities: Currency, Dates, Time & Labels
// ============================================================================

/**
 * Formats a numeric amount to Indian Currency format (e.g. ₹2,000, ₹1,25,000)
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '₹0';
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numeric)) return '₹0';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numeric);
}

/**
 * Formats a date string (YYYY-MM-DD or ISO) into readable localized format
 * Example: "15 Aug 2026"
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Formats a Month Year (e.g. "2026-08" -> "August 2026")
 */
export function formatMonthYear(monthString: string | null | undefined): string {
  if (!monthString) return '—';
  try {
    const date = new Date(monthString.includes('-') && monthString.length === 7 ? `${monthString}-01` : monthString);
    if (isNaN(date.getTime())) return monthString;
    return new Intl.DateTimeFormat('en-IN', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return monthString;
  }
}

/**
 * Formats 24hr time (e.g. "08:30:00" or "14:00") into 12hr AM/PM format (e.g. "08:30 AM", "02:00 PM")
 */
export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '—';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  return `${formattedHours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

/**
 * Returns readable day name from 1-7 (1=Monday)
 */
export function getDayName(dayNumber: number): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[dayNumber - 1] || 'Unknown';
}

export function formatPercentage(obtained: number, max: number = 100): string {
  if (!max || max <= 0) return '0%';
  const pct = max === 100 ? obtained : (obtained / max) * 100;
  return `${pct.toFixed(1).replace(/\.0$/, '')}%`;
}

export function formatNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return '0';
  const numeric = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(numeric)) return '0';
  return new Intl.NumberFormat('en-IN').format(numeric);
}

/**
 * Sanitizes a person's name to only allow letters (Latin and Unicode),
 * combining marks (for Indian script vowels), and spaces.
 * Strictly removes all digits, symbols, and numbers.
 */
export function sanitizePersonName(val: string | null | undefined): string {
  if (!val) return '';
  return val.replace(/[^\p{L}\p{M}\s]/gu, '');
}

/**
 * Validates that a person's name contains only letters, marks, and spaces.
 */
export function isValidPersonName(val: string | null | undefined): boolean {
  if (!val || !val.trim()) return true;
  return /^[\p{L}\p{M}\s]+$/u.test(val.trim());
}

/**
 * Sanitizes Indian mobile phone numbers:
 * - Digits only
 * - Handles pasted numbers with country code +91 / 91 or leading 0
 * - Restricts starting digit to 6, 7, 8, or 9
 * - Restricts length to maximum 10 digits
 */
export function sanitizeIndianMobile(val: string | null | undefined): string {
  if (!val) return '';
  let digits = val.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length > 10 && ['6', '7', '8', '9'].includes(digits[2])) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0') && digits.length > 10 && ['6', '7', '8', '9'].includes(digits[1])) {
    digits = digits.slice(1);
  }
  if (digits.length > 0 && !/^[6-9]/.test(digits)) {
    return '';
  }
  return digits.slice(0, 10);
}

/**
 * Validates that a mobile phone number is exactly 10 digits starting with 6, 7, 8, or 9.
 */
export function isValidIndianMobile(val: string | null | undefined): boolean {
  if (!val) return false;
  return /^[6-9]\d{9}$/.test(val.replace(/\D/g, ''));
}

