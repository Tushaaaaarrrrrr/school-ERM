import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const PREFIX = 'scrypt$';
const KEY_LENGTH = 32;

export function isHashedSecret(stored: string | null | undefined): boolean {
  return typeof stored === 'string' && stored.startsWith(PREFIX);
}

export async function hashSecret(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(plain, salt, KEY_LENGTH);
  return `${PREFIX}${salt.toString('base64')}$${key.toString('base64')}`;
}

// Accepts legacy plaintext values so existing PINs/passwords keep working until they are re-hashed.
export async function verifySecret(plain: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored || !plain) return false;
  if (!isHashedSecret(stored)) {
    const a = Buffer.from(plain);
    const b = Buffer.from(stored.trim());
    return a.length === b.length && timingSafeEqual(a, b);
  }
  const [, saltB64, keyB64] = stored.split('$');
  if (!saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, 'base64');
  const actual = await scrypt(plain, Buffer.from(saltB64, 'base64'), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function hashIfPlain(value: string | null | undefined): Promise<string | null | undefined> {
  if (!value || isHashedSecret(value)) return value;
  return hashSecret(value.trim());
}

export function hasConfiguredPin(stored: string | null | undefined): boolean {
  if (!stored) return false;
  return isHashedSecret(stored) || /^\d{5}$/.test(stored.trim());
}
