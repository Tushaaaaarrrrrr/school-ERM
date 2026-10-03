export const SESSION_COOKIE_NAME = 'school_erp_session';

const DEFAULT_SECRET = 'default-dev-secret-school-erp-key-change-in-prod-2026';

function getSecret(): string {
  return process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SECRET;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64url');
  }
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlToBytes(str: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(str, 'base64url'));
  }
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(): Promise<CryptoKey> {
  const secret = getSecret();
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signSessionCookie(payload: any): Promise<string> {
  const jsonStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const payloadB64 = bytesToBase64Url(new TextEncoder().encode(jsonStr));
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payloadB64)
  );
  const signatureB64 = bytesToBase64Url(new Uint8Array(signature));
  return `${payloadB64}.${signatureB64}`;
}

export async function verifySessionCookie<T = any>(
  cookieStr: string | undefined | null
): Promise<T | null> {
  if (!cookieStr || typeof cookieStr !== 'string') return null;
  try {
    let raw = cookieStr.trim();
    if (raw.startsWith('"') && raw.endsWith('"')) {
      raw = raw.slice(1, -1).trim();
    }
    try {
      raw = decodeURIComponent(raw);
    } catch {}

    const dotIndex = raw.indexOf('.');
    if (dotIndex === -1 || dotIndex !== raw.lastIndexOf('.')) {
      return null;
    }

    const payloadB64 = raw.slice(0, dotIndex);
    const signatureB64 = raw.slice(dotIndex + 1);
    if (!payloadB64 || !signatureB64) {
      return null;
    }

    const key = await getHmacKey();
    const signatureBytes = base64UrlToBytes(signatureB64);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as unknown as BufferSource,
      new TextEncoder().encode(payloadB64)
    );

    if (!isValid) return null;

    const payloadBytes = base64UrlToBytes(payloadB64);
    const jsonStr = new TextDecoder().decode(payloadBytes);
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}
