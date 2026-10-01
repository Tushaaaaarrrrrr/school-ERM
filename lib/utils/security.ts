// ============================================================================
// Security, Validation & Password Utilities
// ============================================================================

import { AuthEvent, AuthEventType, UserRole } from '@/lib/types';

// Generic security error response preventing enumeration attacks
export const GENERIC_AUTH_ERROR = 'Invalid login credentials.';
export const UNREGISTERED_GOOGLE_ERROR =
  "This Google account isn't registered with this platform. Please contact your school administrator.";

function secureRandomInt(maxExclusive: number): number {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error('Random range must be a positive safe integer.');
  }
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) throw new Error('Secure random generation is unavailable.');
  const range = 0x100000000;
  const cutoff = range - (range % maxExclusive);
  const values = new Uint32Array(1);
  do cryptoApi.getRandomValues(values); while (values[0] >= cutoff);
  return values[0] % maxExclusive;
}

export function generateSecurePin(length = 5): string {
  return Array.from({ length }, () => secureRandomInt(10)).join('');
}

/**
 * High-entropy 14-character password generator
 * Strictly includes: Uppercase (A-Z), Lowercase (a-z), Numbers (0-9), Symbols (!@#$%^&*)
 */
export function generateSecurePassword(length = 14): string {
  if (!Number.isSafeInteger(length) || length < 4) {
    throw new Error('Secure passwords must contain at least 4 characters.');
  }
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%^&*';

  let password = '';
  // Ensure at least one character from each set
  password += upper[secureRandomInt(upper.length)];
  password += lower[secureRandomInt(lower.length)];
  password += numbers[secureRandomInt(numbers.length)];
  password += symbols[secureRandomInt(symbols.length)];

  const allChars = upper + lower + numbers + symbols;
  for (let i = password.length; i < length; i++) {
    password += allChars[secureRandomInt(allChars.length)];
  }

  const characters = password.split('');
  for (let i = characters.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [characters[i], characters[j]] = [characters[j], characters[i]];
  }
  return characters.join('');
}

/**
 * Validate password requirements (Min 8 chars, 1 upper, 1 lower, 1 number)
 */
export function validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number.' };
  }
  return { isValid: true };
}

// In-Memory Progressive Rate Limiter
interface AttemptRecord {
  count: number;
  lastAttempt: number;
  blockedUntil: number;
}

const rateLimitStore: Record<string, AttemptRecord> = {};

export function checkRateLimit(key: string): { isAllowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = rateLimitStore[key];

  if (!record) return { isAllowed: true };

  if (record.blockedUntil > now) {
    const remaining = Math.ceil((record.blockedUntil - now) / 1000);
    return { isAllowed: false, retryAfterSeconds: remaining };
  }

  return { isAllowed: true };
}

export function recordFailedAttempt(key: string): { isAllowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = rateLimitStore[key] || { count: 0, lastAttempt: now, blockedUntil: 0 };

  // Reset count if last attempt was over 15 minutes ago
  if (now - record.lastAttempt > 15 * 60 * 1000) {
    record.count = 0;
  }

  record.count += 1;
  record.lastAttempt = now;

  let cooldown = 0;
  if (record.count >= 5) {
    cooldown = Math.min(300, Math.pow(2, record.count - 4) * 15); // Progressive: 15s, 30s, 60s, 120s, up to 300s
    record.blockedUntil = now + cooldown * 1000;
  }

  rateLimitStore[key] = record;

  if (cooldown > 0) {
    return { isAllowed: false, retryAfterSeconds: cooldown };
  }
  return { isAllowed: true };
}

export function resetRateLimit(key: string): void {
  delete rateLimitStore[key];
}

// Image Upload Validation & Sanitization
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

export function validateImageFile(
  file: File | { name: string; size: number; type: string },
  maxMb = 2
): { isValid: boolean; error?: string } {
  if (!file) return { isValid: false, error: 'No file provided' };

  // Validate size
  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return { isValid: false, error: `File size exceeds the allowed maximum of ${maxMb} MB.` };
  }

  // Validate MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return { isValid: false, error: 'Only JPEG, PNG, and WEBP image formats are supported.' };
  }

  // Validate Extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return { isValid: false, error: 'Invalid image file extension.' };
  }
  const extensionMatchesType = file.type.toLowerCase() === 'image/jpeg'
    ? ext === 'jpg' || ext === 'jpeg'
    : ext === file.type.toLowerCase().replace('image/', '');
  if (!extensionMatchesType) {
    return { isValid: false, error: 'The image extension does not match its declared format.' };
  }

  return { isValid: true };
}

/** Verifies that file contents match the claimed supported image format. */
export async function validateImageFileContent(
  file: File,
  maxMb = 2
): Promise<{ isValid: boolean; error?: string }> {
  const metadata = validateImageFile(file, maxMb);
  if (!metadata.isValid) return metadata;
  if (file.size === 0) return { isValid: false, error: 'The selected image is empty.' };

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
    .every((value, index) => bytes[index] === value);
  const webp = bytes.length >= 12
    && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
    && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  const matchesClaim = (file.type.toLowerCase() === 'image/jpeg' && jpeg)
    || (file.type.toLowerCase() === 'image/png' && png)
    || (file.type.toLowerCase() === 'image/webp' && webp);
  return matchesClaim
    ? { isValid: true }
    : { isValid: false, error: 'The file contents do not match the selected image format.' };
}

export function generateSafeStoragePath(prefix: string, originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const randomHash = globalThis.crypto?.randomUUID?.()
    || Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const timestamp = Date.now();
  return `${prefix}/${timestamp}-${randomHash}.${ext}`;
}
