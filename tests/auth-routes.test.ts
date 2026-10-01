import { beforeEach, describe, expect, it, vi } from 'vitest';

const accessContext = vi.fn();
vi.mock('@/lib/server/access', () => ({ getAccessContext: () => accessContext() }));

const serverDb = {
  getSchools: vi.fn(async () => []),
  getTeachers: vi.fn(async () => [{ id: 'tch-own' }]),
  getStaff: vi.fn(async () => [{ id: 'stf-own' }]),
  unlockAndResetPin: vi.fn(async () => undefined),
  getUserPinStatus: vi.fn(async () => ({ hasPin: true, isLocked: false, failedAttempts: 0, maxAttempts: 5, pin: 'scrypt$x$y', holderId: 'tch-own' })),
};
vi.mock('@/lib/server/db', () => ({ serverDb }));

const credentials = new Map<string, string>();
vi.mock('@/lib/server/credentials', () => ({
  readCredential: async (id: string) => credentials.get(id.toLowerCase()),
  writeCredentials: async (ids: string[], hash: string) => ids.forEach((id) => credentials.set(id.toLowerCase(), hash)),
}));

const { POST: passwordPOST } = await import('@/app/api/auth/password/route');
const { POST: pinResetPOST } = await import('@/app/api/auth/pin/reset/route');
const { POST: pinStatusPOST } = await import('@/app/api/auth/pin/status/route');

let ip = 0;
function post(body: unknown) {
  ip += 1;
  return new Request('http://test/api', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${ip}` },
    body: JSON.stringify(body),
  });
}

const student = { authenticated: true, state: 'ACTIVE_SCHOOL_USER', user: { id: 'usr-st1', role: 'student', school_id: 's1', email: 'parent@x.com', login_id: 'reg-1' } };
const teacher = { authenticated: true, state: 'ACTIVE_SCHOOL_USER', user: { id: 'tch-own', role: 'teacher', school_id: 's1', email: 't@x.com' } };
const schoolAdmin = { authenticated: true, state: 'ACTIVE_SCHOOL_USER', user: { id: 'adm', role: 'school_admin', school_id: 's1', email: 'a@x.com' } };
const superAdmin = { authenticated: true, state: 'SUPER_ADMIN', user: { id: 'usr-super-01', role: 'super_admin', email: 'owner@x.com' } };

beforeEach(() => {
  credentials.clear();
  vi.clearAllMocks();
});

describe('POST /api/auth/password (set)', () => {
  it('rejects anonymous callers', async () => {
    accessContext.mockResolvedValue({ authenticated: false });
    const res = await passwordPOST(post({ email: 'victim@x.com', password: 'hacked123' }));
    expect(res.status).toBe(401);
  });

  it("rejects setting someone else's password", async () => {
    accessContext.mockResolvedValue(student);
    const res = await passwordPOST(post({ userId: 'usr-st1', email: 'victim@x.com', password: 'hacked123' }));
    expect(res.status).toBe(403);
    expect(credentials.size).toBe(0);
  });

  it('rejects a non super admin claiming isSuperAdmin', async () => {
    accessContext.mockResolvedValue(student);
    const res = await passwordPOST(post({ userId: 'usr-st1', password: 'hacked123', isSuperAdmin: true }));
    expect(res.status).toBe(403);
  });

  it('lets a user set their own password, stored hashed, and verify it', async () => {
    accessContext.mockResolvedValue(student);
    const res = await passwordPOST(post({ userId: 'usr-st1', email: 'parent@x.com', loginId: 'reg-1', password: 'mynewpass1' }));
    expect(res.status).toBe(200);
    expect(credentials.get('reg-1')).toMatch(/^scrypt\$/);

    const ok = await (await passwordPOST(post({ action: 'verify', identifier: 'reg-1', password: 'mynewpass1' }))).json();
    expect(ok.valid).toBe(true);
    const bad = await (await passwordPOST(post({ action: 'verify', identifier: 'reg-1', password: 'wrong-pass' }))).json();
    expect(bad.valid).toBe(false);
  });

  it('rejects malformed bodies', async () => {
    accessContext.mockResolvedValue(student);
    const res = await passwordPOST(post({ action: 'drop-tables', password: 'x' }));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/password (verify) brute force', () => {
  it('locks an identifier after 8 failures, even with the right password', async () => {
    credentials.set('target@x.com', 'right-password');
    const headers = { 'content-type': 'application/json', 'x-forwarded-for': '10.9.9.9' };
    const attempt = (password: string) =>
      passwordPOST(new Request('http://test/api', { method: 'POST', headers, body: JSON.stringify({ action: 'verify', identifier: 'target@x.com', password }) }));
    for (let i = 0; i < 8; i++) expect((await attempt(`wrong-${i}`)).status).toBe(200);
    expect((await attempt('right-password')).status).toBe(429);
  });
});

describe('POST /api/auth/pin/reset', () => {
  it('only lets a super admin reset a school admin PIN', async () => {
    accessContext.mockResolvedValue(schoolAdmin);
    expect((await pinResetPOST(post({ targetType: 'school_admin', targetId: 's1', newPin: '11111' }))).status).toBe(403);
    accessContext.mockResolvedValue(superAdmin);
    expect((await pinResetPOST(post({ targetType: 'school_admin', targetId: 's1', newPin: '11111' }))).status).toBe(200);
  });

  it('limits school admins to their own teachers and staff', async () => {
    accessContext.mockResolvedValue(schoolAdmin);
    expect((await pinResetPOST(post({ targetType: 'teacher', targetId: 'tch-other-school' }))).status).toBe(403);
    expect((await pinResetPOST(post({ targetType: 'teacher', targetId: 'tch-own', removePin: true }))).status).toBe(200);
    expect(serverDb.unlockAndResetPin).toHaveBeenCalledWith(expect.objectContaining({ targetId: 'tch-own', removePin: true }));
  });

  it('rejects teachers and invalid PINs', async () => {
    accessContext.mockResolvedValue(teacher);
    expect((await pinResetPOST(post({ targetType: 'teacher', targetId: 'tch-own', newPin: '11111' }))).status).toBe(403);
    accessContext.mockResolvedValue(superAdmin);
    expect((await pinResetPOST(post({ targetType: 'school_admin', targetId: 's1', newPin: '12' }))).status).toBe(400);
  });
});

describe('POST /api/auth/pin/status', () => {
  it('never returns the stored PIN', async () => {
    accessContext.mockResolvedValue(teacher);
    const json = await (await pinStatusPOST()).json();
    expect(json.data.hasPin).toBe(true);
    expect(json.data.pin).toBeUndefined();
    expect(json.data.holderId).toBeUndefined();
  });

  it('requires a session', async () => {
    accessContext.mockResolvedValue({ authenticated: false });
    expect((await pinStatusPOST()).status).toBe(401);
  });
});
