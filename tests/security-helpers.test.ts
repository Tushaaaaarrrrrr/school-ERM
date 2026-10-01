import { describe, expect, it } from 'vitest';
import { hashSecret, hasConfiguredPin, hashIfPlain, isHashedSecret, verifySecret } from '@/lib/server/secrets';
import { blockedFor, clearFailures, consume, recordFailure } from '@/lib/server/rate-limit';
import { escapeLikePattern, generateSecurePin } from '@/lib/utils/security';
import { stripSchoolSecrets, studentLoginProfile } from '@/lib/server/sanitize';
import type { School, Student } from '@/lib/types';

describe('secrets', () => {
  it('hashes and verifies', async () => {
    const hash = await hashSecret('24680');
    expect(isHashedSecret(hash)).toBe(true);
    expect(hash).not.toContain('24680');
    expect(await verifySecret('24680', hash)).toBe(true);
    expect(await verifySecret('24681', hash)).toBe(false);
  });

  it('uses a fresh salt each time', async () => {
    expect(await hashSecret('same')).not.toBe(await hashSecret('same'));
  });

  it('still accepts legacy plaintext values', async () => {
    expect(await verifySecret('12345', '12345')).toBe(true);
    expect(await verifySecret('12345', '54321')).toBe(false);
    expect(await verifySecret('', '12345')).toBe(false);
    expect(await verifySecret('12345', undefined)).toBe(false);
  });

  it('hashIfPlain leaves existing hashes alone', async () => {
    const hash = await hashSecret('x');
    expect(await hashIfPlain(hash)).toBe(hash);
    expect(isHashedSecret(await hashIfPlain('x'))).toBe(true);
  });

  it('recognises configured PINs', async () => {
    expect(hasConfiguredPin('12345')).toBe(true);
    expect(hasConfiguredPin(await hashSecret('12345'))).toBe(true);
    expect(hasConfiguredPin('123')).toBe(false);
    expect(hasConfiguredPin(null)).toBe(false);
  });
});

describe('rate limiting', () => {
  it('blocks after the limit within the window', () => {
    const key = `t-consume-${Math.random()}`;
    expect(consume(key, 2, 60_000)).toBe(0);
    expect(consume(key, 2, 60_000)).toBe(0);
    expect(consume(key, 2, 60_000)).toBeGreaterThan(0);
  });

  it('counts failures and clears them on success', () => {
    const key = `t-fail-${Math.random()}`;
    for (let i = 0; i < 3; i++) recordFailure(key, 60_000);
    expect(blockedFor(key, 3)).toBeGreaterThan(0);
    expect(blockedFor(key, 4)).toBe(0);
    clearFailures(key);
    expect(blockedFor(key, 3)).toBe(0);
  });
});

describe('security utils', () => {
  it('escapes LIKE wildcards', () => {
    expect(escapeLikePattern('john_doe%@x.com')).toBe('john\\_doe\\%@x.com');
    expect(escapeLikePattern('a\\b')).toBe('a\\\\b');
  });

  it('generates 5-digit PINs', () => {
    for (let i = 0; i < 50; i++) expect(generateSecurePin()).toMatch(/^\d{5}$/);
  });
});

describe('sanitize', () => {
  it('removes the admin PIN and security answer from schools', () => {
    const school = { id: 's1', name: 'S', code: 'C', admin_pin: 'scrypt$a$b', security_answer: 'secret' } as unknown as School;
    const out = stripSchoolSecrets(school) as unknown as Record<string, unknown>;
    expect(out.admin_pin).toBeUndefined();
    expect(out.security_answer).toBeUndefined();
    expect(out.has_admin_pin).toBe(true);
    expect(out.name).toBe('S');
  });

  it('exposes only login fields of a student', () => {
    const student = {
      id: 'st1', school_id: 's1', first_name: 'A', last_name: 'B', registration_number: 'R1', status: 'active',
      date_of_birth: '2015-01-01', emergency_info: { blood_group: 'O+' },
      guardian: { email: 'p@x.com', primary_phone: '999', address: 'home' },
    } as unknown as Student;
    const out = studentLoginProfile(student) as Record<string, any>;
    expect(out.guardian).toEqual({ email: 'p@x.com' });
    expect(out.date_of_birth).toBeUndefined();
    expect(out.emergency_info).toBeUndefined();
  });
});
