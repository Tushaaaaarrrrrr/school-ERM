/**
 * School Code Validation & Formatting Utility
 *
 * Rules:
 * - Length: 5 to 7 characters (inclusive)
 * - Minimum 3 letters (A-Z)
 * - Minimum 2 numeric digits (0-9)
 * - Only uppercase alphanumeric characters allowed (no symbols or spaces)
 */

export interface SchoolCodeValidationResult {
  isValid: boolean;
  code: string;
  length: number;
  letterCount: number;
  digitCount: number;
  hasMinLength: boolean;
  hasMaxLength: boolean;
  hasMinLetters: boolean;
  hasMinDigits: boolean;
  isAlphanumeric: boolean;
  error?: string;
}

export const SCHOOL_CODE_CONFIG = {
  MIN_LENGTH: 5,
  MAX_LENGTH: 7,
  MIN_LETTERS: 3,
  MIN_DIGITS: 2,
} as const;

/**
 * Sanitizes input for school code (uppercase, letters & digits only, max 7 chars).
 */
export function sanitizeSchoolCode(input: string): string {
  if (!input) return '';
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, SCHOOL_CODE_CONFIG.MAX_LENGTH);
}

/**
 * Validates a school code against format rules.
 */
export function validateSchoolCodeFormat(input: string): SchoolCodeValidationResult {
  const code = (input || '').trim().toUpperCase();
  const length = code.length;
  const letters = (code.match(/[A-Z]/g) || []).length;
  const digits = (code.match(/[0-9]/g) || []).length;
  const isAlphanumeric = /^[A-Z0-9]+$/.test(code);

  const hasMinLength = length >= SCHOOL_CODE_CONFIG.MIN_LENGTH;
  const hasMaxLength = length <= SCHOOL_CODE_CONFIG.MAX_LENGTH && length > 0;
  const hasMinLetters = letters >= SCHOOL_CODE_CONFIG.MIN_LETTERS;
  const hasMinDigits = digits >= SCHOOL_CODE_CONFIG.MIN_DIGITS;

  let error: string | undefined = undefined;

  if (!code) {
    error = 'School code is required';
  } else if (!isAlphanumeric) {
    error = 'Only letters and numbers are allowed';
  } else if (length < SCHOOL_CODE_CONFIG.MIN_LENGTH) {
    error = `School code must be at least ${SCHOOL_CODE_CONFIG.MIN_LENGTH} characters`;
  } else if (length > SCHOOL_CODE_CONFIG.MAX_LENGTH) {
    error = `School code cannot exceed ${SCHOOL_CODE_CONFIG.MAX_LENGTH} characters`;
  } else if (!hasMinLetters) {
    error = `Requires at least ${SCHOOL_CODE_CONFIG.MIN_LETTERS} letters (A-Z) (currently ${letters})`;
  } else if (!hasMinDigits) {
    error = `Requires at least ${SCHOOL_CODE_CONFIG.MIN_DIGITS} digits (0-9) (currently ${digits})`;
  }

  const isValid =
    isAlphanumeric &&
    hasMinLength &&
    hasMaxLength &&
    hasMinLetters &&
    hasMinDigits;

  return {
    isValid,
    code,
    length,
    letterCount: letters,
    digitCount: digits,
    hasMinLength,
    hasMaxLength,
    hasMinLetters,
    hasMinDigits,
    isAlphanumeric,
    error,
  };
}
