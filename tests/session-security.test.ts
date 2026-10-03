import { describe, expect, it } from 'vitest';
import { signSessionCookie, verifySessionCookie } from '@/lib/server/session-cookie';
import { POST as sessionPOST } from '@/app/api/auth/session/route';
import { middleware } from '@/middleware';
import { NextRequest } from 'next/server';

describe('session-cookie security', () => {
  const validStudent = {
    id: 'usr-st1',
    role: 'student',
    school_id: 'sch-1',
    name: 'Alice Student',
    email: 'alice@school.com',
  };

  it('valid signed cookie verifies properly', async () => {
    const signed = await signSessionCookie(validStudent);
    expect(typeof signed).toBe('string');
    expect(signed.split('.').length).toBe(2);

    const verified = await verifySessionCookie<typeof validStudent>(signed);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(validStudent.id);
    expect(verified?.role).toBe('student');
    expect(verified?.school_id).toBe('sch-1');
  });

  it('tampered payload (e.g. changing role from student to school_admin) fails verification', async () => {
    const signed = await signSessionCookie(validStudent);
    const [payloadB64, sigB64] = signed.split('.');

    // Decode payload, modify role to school_admin, and re-encode without signature
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    decoded.role = 'school_admin';
    const tamperedPayloadB64 = Buffer.from(JSON.stringify(decoded)).toString('base64url');

    const forgedCookie = `${tamperedPayloadB64}.${sigB64}`;
    const result = await verifySessionCookie(forgedCookie);
    expect(result).toBeNull();
  });

  it('unsigned legacy raw JSON cookie fails verification', async () => {
    const rawJsonCookie = JSON.stringify({
      id: 'usr-evil',
      role: 'school_admin',
      school_id: 'sch-1',
    });
    expect(await verifySessionCookie(rawJsonCookie)).toBeNull();

    const urlEncodedCookie = encodeURIComponent(rawJsonCookie);
    expect(await verifySessionCookie(urlEncodedCookie)).toBeNull();
  });

  it('garbage cookie fails verification', async () => {
    expect(await verifySessionCookie('')).toBeNull();
    expect(await verifySessionCookie(undefined)).toBeNull();
    expect(await verifySessionCookie(null)).toBeNull();
    expect(await verifySessionCookie('garbage')).toBeNull();
    expect(await verifySessionCookie('one.two.three')).toBeNull();
    expect(await verifySessionCookie('not_base64.not_base64')).toBeNull();
    expect(await verifySessionCookie('.')).toBeNull();
    expect(await verifySessionCookie('payload.')).toBeNull();
    expect(await verifySessionCookie('.signature')).toBeNull();
  });

  it('tampered signature fails verification', async () => {
    const signed = await signSessionCookie(validStudent);
    const [payloadB64, sigB64] = signed.split('.');
    const corruptedSig = sigB64.endsWith('a') ? `${sigB64.slice(0, -1)}b` : `${sigB64.slice(0, -1)}a`;
    const corruptedCookie = `${payloadB64}.${corruptedSig}`;
    expect(await verifySessionCookie(corruptedCookie)).toBeNull();
  });
});

describe('session API route', () => {
  it('POST /api/auth/session issues a signed cookie and returns session in JSON', async () => {
    const user = {
      id: 'usr-tch-01',
      role: 'teacher',
      name: 'Bob Teacher',
      school_id: 'sch-1',
      email: 'bob@school.com',
    };

    const req = new Request('http://localhost/api/auth/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user }),
    });

    const res = await sessionPOST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(typeof data.session).toBe('string');

    // Verify the returned session string
    const verified = await verifySessionCookie<typeof user>(data.session);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(user.id);
    expect(verified?.role).toBe('teacher');

    // Verify Set-Cookie header contains school_erp_session
    const cookieHeader = res.headers.get('set-cookie');
    expect(cookieHeader).toContain('school_erp_session=');
  });
});

describe('middleware cookie tamper-proofing', () => {
  it('allows valid signed teacher cookie to access /teacher', async () => {
    const signed = await signSessionCookie({ id: 'usr-t1', role: 'teacher', school_id: 's1' });
    const req = new NextRequest('http://localhost/teacher/classes', {
      headers: { cookie: `school_erp_session=${signed}` },
    });
    const res = await middleware(req);
    // Should allow (status 200 / not redirect to login)
    expect(res.status).toBe(200);
  });

  it('redirects tampered cookie on guarded portal to /login', async () => {
    const signed = await signSessionCookie({ id: 'usr-s1', role: 'student', school_id: 's1' });
    const [payloadB64, sigB64] = signed.split('.');
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    decoded.role = 'school_admin';
    const tamperedPayloadB64 = Buffer.from(JSON.stringify(decoded)).toString('base64url');
    const tamperedCookie = `${tamperedPayloadB64}.${sigB64}`;

    const req = new NextRequest('http://localhost/admin/dashboard', {
      headers: { cookie: `school_erp_session=${tamperedCookie}` },
    });
    const res = await middleware(req);
    expect(res.status).toBe(307);
    const location = res.headers.get('location') || '';
    expect(location).toContain('/login');
  });

  it('redirects unsigned raw JSON cookie on guarded portal to /login', async () => {
    const rawJson = encodeURIComponent(JSON.stringify({ id: 'usr-evil', role: 'school_admin' }));
    const req = new NextRequest('http://localhost/admin/dashboard', {
      headers: { cookie: `school_erp_session=${rawJson}` },
    });
    const res = await middleware(req);
    expect(res.status).toBe(307);
    const location = res.headers.get('location') || '';
    expect(location).toContain('/login');
  });
});
