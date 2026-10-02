import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJsonBody } from '@/lib/server/validation';

const optionalId = z.string().max(254).nullish();
const passwordInput = z.object({
  action: z.enum(['verify', 'set']).optional(),
  identifier: optionalId,
  userId: optionalId,
  email: optionalId,
  loginId: optionalId,
  role: z.string().max(40).nullish(),
  password: z.string().max(200).nullish(),
  isSuperAdmin: z.boolean().nullish(),
});
import { serverDb } from '@/lib/server/db';
import { getSuperAdminEmails, isSuperAdminEmail } from '@/lib/server/super-admin';
import { getAccessContext } from '@/lib/server/access';
import { isDemoEnvironment } from '@/lib/utils/security';
import { hashSecret, isHashedSecret, verifySecret } from '@/lib/server/secrets';
import { readCredential, writeCredentials } from '@/lib/server/credentials';
import { blockedFor, clearFailures, clientIp, recordFailure, tooManyRequests } from '@/lib/server/rate-limit';

const isDemoMode = isDemoEnvironment;

function superAdminPasswordKeys(): string[] {
  return ['superadmin', 'admin', 'usr-super-01', ...getSuperAdminEmails()];
}

const ACCOUNT_FAILURE_LIMIT = 8;
const IP_FAILURE_LIMIT = 100;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;

async function matchStoredPassword(key: string, cleanPass: string): Promise<boolean> {
  const stored = await readCredential(key);
  if (!(await verifySecret(cleanPass, stored))) return false;
  if (!isHashedSecret(stored)) await writeCredentials([key], await hashSecret(cleanPass));
  return true;
}

async function hasStoredPassword(ids: string[]): Promise<boolean> {
  for (const id of ids) {
    if (await readCredential(id)) return true;
  }
  return false;
}

async function checkPassword(ids: string[], cleanPass: string, role?: string): Promise<boolean> {
  for (const id of ids) {
    if (await matchStoredPassword(id, cleanPass)) return true;
  }
  if (await hasStoredPassword(ids)) return false;

  const superKeys = superAdminPasswordKeys();
  if (ids.some((id) => superKeys.includes(id))) {
    for (const k of superKeys) {
      if (await matchStoredPassword(k, cleanPass)) return true;
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

async function canSchoolAdminManageTarget(caller: any, targetIds: string[]): Promise<boolean> {
  if (caller.role !== 'school_admin' || !caller.school_id || targetIds.length === 0) return false;
  const ids = new Set(targetIds.map((id) => id.toLowerCase()));
  const [students, teachers, staff, parents] = await Promise.all([
    serverDb.getStudents(caller.school_id),
    serverDb.getTeachers(caller.school_id),
    serverDb.getStaff(caller.school_id),
    serverDb.getParents(caller.school_id),
  ]);

  return (
    students.some((s: any) =>
      ids.has(String(s.id || '').toLowerCase()) ||
      ids.has(`usr-${String(s.id || '').toLowerCase()}`) ||
      ids.has(String(s.registration_number || '').toLowerCase())
    ) ||
    teachers.some((t: any) =>
      ids.has(String(t.id || '').toLowerCase()) ||
      ids.has(`usr-${String(t.id || '').toLowerCase()}`) ||
      ids.has(String(t.email || '').toLowerCase()) ||
      ids.has(String(t.employee_number || '').toLowerCase())
    ) ||
    staff.some((st: any) =>
      ids.has(String(st.id || '').toLowerCase()) ||
      ids.has(`usr-${String(st.id || '').toLowerCase()}`) ||
      ids.has(String(st.email || '').toLowerCase()) ||
      ids.has(String(st.employee_number || '').toLowerCase())
    ) ||
    parents.some((p: any) =>
      ids.has(String(p.id || '').toLowerCase()) ||
      ids.has(`usr-${String(p.id || '').toLowerCase()}`) ||
      ids.has(String(p.email || '').toLowerCase()) ||
      ids.has(String(p.primary_phone || '').replace(/\D/g, '').toLowerCase())
    )
  );
}

export async function POST(request: Request) {
  try {
    const parsed = await parseJsonBody(request, passwordInput);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
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

      const valid = await checkPassword(ids, cleanPass, role ?? undefined);
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

    const { identifier, userId, email, loginId, password, isSuperAdmin } = body;
    const targetIds = [identifier, userId, email, loginId]
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean);
    const callerIds = [caller.id, caller.email, caller.login_id]
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean);
    const callerAccountIds = new Set(
      callerIds.flatMap((id) => id.startsWith('usr-') ? [id, id.slice(4)] : [id, `usr-${id}`])
    );
    const isSelf = targetIds.length > 0 && targetIds.every((id) => callerAccountIds.has(id));
    const callerCanManageTarget = !isSelf && !callerIsSuperAdmin
      ? await canSchoolAdminManageTarget(caller, targetIds)
      : false;
    if (!isSelf && !callerIsSuperAdmin && !callerCanManageTarget) {
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

    const hashed = await hashSecret(cleanPass);
    const superAdminTarget = isSuperAdmin || isSuperAdminEmail(email);
    await writeCredentials(superAdminTarget ? [...targetIds, ...superAdminPasswordKeys()] : targetIds, hashed);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Password API error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to process password' },
      { status: 500 }
    );
  }
}
