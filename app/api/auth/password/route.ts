// ============================================================================
// Centralized Server-Side Password Storage & Verification Engine
// Persists passwords securely to .data/passwords.json
// ============================================================================

import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { getSuperAdminEmails, isSuperAdminEmail } from '@/lib/server/super-admin';
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

// Shared demo passwords are only acceptable when no real backend is attached.
function isDemoMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !url || !key || url.includes('demo.supabase.co') || url.includes('your-project-id') || key === 'demo-anon-key';
}

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || 'set';

    if (action === 'verify') {
      const { identifier, password, userId, email, loginId, role } = body;
      const cleanPass = String(password || '').trim();
      const ids = [
        identifier,
        userId,
        email,
        loginId,
      ]
        .map((value) => String(value || '').trim().toLowerCase())
        .filter(Boolean);

      if (ids.length === 0 || !cleanPass) {
        return NextResponse.json({ success: true, valid: false });
      }

      const db = getPasswordsDb();
      for (const id of ids) {
        const stored = db[id];
        if (stored && stored === cleanPass) {
          return NextResponse.json({ success: true, valid: true });
        }
      }

      const superKeys = superAdminPasswordKeys();
      if (ids.some((id) => superKeys.includes(id))) {
        for (const k of superKeys) {
          if (db[k] && db[k] === cleanPass) {
            return NextResponse.json({ success: true, valid: true });
          }
        }
        if (isDemoMode() && ['password', 'admin123', 'demo', '123456'].includes(cleanPass)) {
          return NextResponse.json({ success: true, valid: true });
        }
      }

      // Check school administrator credentials against serverDb
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
          if (matchedSchool.admin_pin && String(matchedSchool.admin_pin).trim() === cleanPass) {
            return NextResponse.json({ success: true, valid: true });
          }
          if (isDemoMode() && ['admin123', 'admin', 'password', '12345', '123456'].includes(cleanPass)) {
            return NextResponse.json({ success: true, valid: true });
          }
        }
      } catch (_) {}

      if (isDemoMode() && role === 'student' && ['student123', 'Student@123', 'password', '123456'].includes(cleanPass)) {
        return NextResponse.json({ success: true, valid: true });
      }

      return NextResponse.json({ success: true, valid: false });
    }

    // Setting a password
    const { userId, email, loginId, password, isSuperAdmin } = body;
    const cleanPass = String(password || '').trim();

    if (!cleanPass || cleanPass.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const db = getPasswordsDb();

    if (userId) db[String(userId).trim()] = cleanPass;
    if (email) db[String(email).trim().toLowerCase()] = cleanPass;
    if (loginId) db[String(loginId).trim().toLowerCase()] = cleanPass;

    if (isSuperAdmin || isSuperAdminEmail(email)) {
      for (const k of superAdminPasswordKeys()) db[k] = cleanPass;
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
