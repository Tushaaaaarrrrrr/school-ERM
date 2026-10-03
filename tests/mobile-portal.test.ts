import { describe, expect, it } from 'vitest';
import { GET } from '@/app/mobile-portal/route';

const status = async (path: string) =>
  (await GET(new Request(`http://x/mobile-portal?path=${encodeURIComponent(path)}`))).status;

describe('GET /mobile-portal', () => {
  it('allows in-app portal routes', async () => {
    expect(await status('/admin/payroll')).toBe(200);
    expect(await status('/teacher')).toBe(200);
    expect(await status('/account/security')).toBe(200);
  });

  it('rejects open redirects and unknown routes', async () => {
    expect(await status('//evil.com')).toBe(400);
    expect(await status('https://evil.com')).toBe(400);
    expect(await status('/\\evil.com')).toBe(400);
    expect(await status('/adminx')).toBe(400);
    expect(await status('/api/users')).toBe(400);
  });
});
