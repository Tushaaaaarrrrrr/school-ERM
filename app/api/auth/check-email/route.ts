// ============================================================================
// API Route: Centralized Email & Identity Conflict Verification
// POST /api/auth/check-email
// ============================================================================

import { NextResponse } from 'next/server';
import { clientIp, consume, tooManyRequests } from '@/lib/server/rate-limit';
import { checkEmailRegistry, validateGmailDomain } from '@/lib/server/email-registry';

export async function GET(request: Request) {
  try {
    const retryAfter = consume(`check-email:${clientIp(request)}`, 30, 60_000);
    if (retryAfter > 0) return tooManyRequests(retryAfter);
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || '';
    const excludeUserId = searchParams.get('excludeUserId') || undefined;
    const excludeEmail = searchParams.get('excludeEmail') || undefined;
    const excludeSchoolId = searchParams.get('excludeSchoolId') || undefined;
    const targetSchoolId = searchParams.get('targetSchoolId') || undefined;
    const targetRole = searchParams.get('targetRole') || undefined;

    return await handleEmailCheck(email, {
      excludeUserId,
      excludeEmail,
      excludeSchoolId,
      targetSchoolId,
      targetRole,
    });
  } catch (err: unknown) {
    console.error('Email check endpoint error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to verify email' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const retryAfter = consume(`check-email:${clientIp(request)}`, 30, 60_000);
    if (retryAfter > 0) return tooManyRequests(retryAfter);
    const body = await request.json().catch(() => ({}));
    const { email, excludeUserId, excludeEmail, excludeSchoolId, targetSchoolId, targetRole } = body;

    return await handleEmailCheck(email, {
      excludeUserId,
      excludeEmail,
      excludeSchoolId,
      targetSchoolId,
      targetRole,
    });
  } catch (err: unknown) {
    console.error('Email check endpoint error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to verify email' },
      { status: 500 }
    );
  }
}

async function handleEmailCheck(
  email: string,
  options?: {
    excludeUserId?: string;
    excludeEmail?: string;
    excludeSchoolId?: string;
    targetSchoolId?: string;
    targetRole?: string;
  }
) {
  if (!email) {
    return NextResponse.json(
      { success: false, valid: false, available: false, error: 'Email is required' },
      { status: 400 }
    );
  }

  const domainValidation = validateGmailDomain(email);
  if (!domainValidation.valid) {
    return NextResponse.json({
      success: true,
      valid: false,
      available: false,
      error: domainValidation.error,
    });
  }

  const result = await checkEmailRegistry(email, options);

  return NextResponse.json({
    success: true,
    valid: result.valid,
    available: result.available,
    normalizedEmail: result.normalizedEmail,
    error: result.error,
  });
}
