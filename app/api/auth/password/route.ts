// ============================================================================
// Centralized Server-Side Password Storage & Verification Engine
// Persists passwords securely to .data/passwords.json
// ============================================================================

import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { getSuperAdminEmails, isSuperAdminEmail } from '@/lib/server/super-admin';
import { getAccessContext } from '@/lib/server/access';
import { isDemoEnvironment } from '@/lib/utils/security';
import { hashSecret, isHashedSecret, verifySecret } from '@/lib/server/secrets';
import { blockedFor, clearFailures, clientIp, recordFailure, tooManyRequests } from '@/lib/server/rate-limit';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const PASSWORDS_FILE = path.join(DATA_DIR, 'passwords.json');

function loadPasswordsFromFile(): Record<string, string> {
  try {
    if (fs.existsSync(PASSWORDS_FILE)) {
      const data = fs.readFileSync(PASSWORDS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read from passwords.json:', e);
  }
  return {};
}

function savePasswordsToFile(passwords: Record<string, string>) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PASSWORDS_FILE, JSON.stringify(passwords, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not write to passwords.json:', e);
  }
}

// Global in-memory cache of passwords
declare global {
  // eslint-disable-next-line no-var
  var __SERVER_PASSWORDS__: Record<string, string> | undefined;
}

const isDemoMode = isDemoEnvironment;

const DEMO_SEED_PASSWORDS: Record<string, string> = {
  'superadmin': 'admin123',
  'admin': 'admin123',
  'usr-super-01': 'admin123',
  'admin@delhipublic.edu.in': 'admin123',
  'jdps-103': 'student123',
  'jdps-101': 'student123',
};

function getPasswordsDb(): Record<string, string> {
  if (!globalThis.__SERVER_PASSWORDS__) {
    globalThis.__SERVER_PASSWORDS__ = {
      ...(isDemoMode() ? DEMO_SEED_PASSWORDS : {}),
      ...loadPasswordsFromFile(),
    };
  }
  return globalThis.__SERVER_PASSWORDS__;
}

function superAdminPasswordKeys(): string[] {
  return ['superadmin', 'admin', 'usr-super-01', ...getSuperAdminEmails()];
}

const ACCOUNT_FAILURE_LIMIT = 8;
const IP_FAILURE_LIMIT = 100;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;

async function matchStoredPassword(db: Record<string, string>, key: string, cleanPass: string): Promise<boolean> {
  const stored = db[key];
  if (!(await verifySecret(cleanPass, stored))) return false;
  if (!isHashedSecret(stored)) {
    db[key] = await hashSecret(cleanPass);
    savePasswordsToFile(db);
  }
  return true;
}

async function checkPassword(ids: string[], cleanPass: string, role?: string): Promise<boolean> {
  const db = getPasswordsDb();
  for (const id of ids) {
    if (await matchStoredPassword(db, id, cleanPass)) return true;
  }

  const superKeys = superAdminPasswordKeys();
  if (ids.some((id) => superKeys.includes(id))) {
    for (const k of superKeys) {
      if (await matchStoredPassword(db, k, cleanPass)) return true;
    }
    if (isDemoMode() && ['password', 'admin123', 'demo', '123456'].includes(cleanPass)) return true;
  }

  try {
    const schools = await serverDb.getSchools();
    const matchedSchool = schools.find((s) => {
      const adminEmails = (s.admin_email || '')
        .split(',')
        .map((e: string) => e.trim().toLowerCase())
        .filter(Boolean);
      return (
        adminEmails.some((e: string) => ids.includes(e)) ||
        ids.includes(s.email?.toLowerCase() || '') ||
        ids.includes(s.code?.toLowerCase() || '')
      );
    });
    if (matchedSchool) {
      if (await verifySecret(cleanPass, matchedSchool.admin_pin)) return true;
      if (isDemoMode() && ['admin123', 'admin', 'password', '12345', '123456'].includes(cleanPass)) return true;
    }
  } catch (err) {
    console.error('Password verify: school admin lookup failed', err);
  }

  return isDemoMode() && role === 'student' && ['student123', 'Student@123', 'password', '123456'].includes(cleanPass);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || 'set';

    if (action === 'verify') {
      const { identifier, password, userId, email, loginId, role } = body;
      const cleanPass = String(password || '').trim();
      const ids = [identifier, userId, email, loginId]
        .map((value) => String(value || '').trim().toLowerCase())
        .filter(Boolean);

      if (ids.length === 0 || !cleanPass) {
        return NextResponse.json({ success: true, valid: false });
      }

      const ipKey = `pw-ip:${clientIp(request)}`;
      const accountKeys = ids.map((id) => `pw-acct:${id}`);
      const waitSeconds = Math.max(
        blockedFor(ipKey, IP_FAILURE_LIMIT),
        ...accountKeys.map((key) => blockedFor(key, ACCOUNT_FAILURE_LIMIT))
      );
      if (waitSeconds > 0) return tooManyRequests(waitSeconds);

      const valid = await checkPassword(ids, cleanPass, role);
      if (valid) {
        accountKeys.forEach(clearFailures);
      } else {
        recordFailure(ipKey, FAILURE_WINDOW_MS);
        accountKeys.forEach((key) => recordFailure(key, FAILURE_WINDOW_MS));
      }
      return NextResponse.json({ success: true, valid });
    }

    if (action !== 'set') {
      return NextResponse.json({ success: false, error: 'Unsupported action' }, { status: 400 });
    }

    const context = await getAccessContext();
    if (!context.authenticated || !context.user) {
      return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
    }
    const caller = context.user;
    const callerIsSuperAdmin = context.state === 'SUPER_ADMIN';

    const { userId, email, loginId, password, isSuperAdmin } = body;
    const targetIds = [userId, email, loginId]
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean);
    const callerIds = [caller.id, caller.email, caller.login_id]
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean);
    const isSelf = targetIds.length > 0 && targetIds.every((id) => callerIds.includes(id));
    if (!isSelf && !callerIsSuperAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    if ((isSuperAdmin || isSuperAdminEmail(email)) && !callerIsSuperAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const cleanPass = String(password || '').trim();

    if (!cleanPass || cleanPass.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const db = getPasswordsDb();
    const hashed = await hashSecret(cleanPass);

    for (const key of targetIds) db[key] = hashed;

    if (isSuperAdmin || isSuperAdminEmail(email)) {
      for (const k of superAdminPasswordKeys()) db[k] = hashed;
    }

    savePasswordsToFile(db);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Password API error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to process password' },
      { status: 500 }
    );
  }
}
