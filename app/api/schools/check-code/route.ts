// ============================================================================
// API Route: Real-Time School Code Verification & Availability Check
// GET/POST /api/schools/check-code
// ============================================================================

import { NextResponse } from 'next/server';
import { clientIp, consume, tooManyRequests } from '@/lib/server/rate-limit';
import { serverDb } from '@/lib/server/db';
import { validateSchoolCodeFormat, sanitizeSchoolCode } from '@/lib/utils/school-code';

export async function GET(request: Request) {
  try {
    const retryAfter = consume(`check-code:${clientIp(request)}`, 30, 60_000);
    if (retryAfter > 0) return tooManyRequests(retryAfter);
    const { searchParams } = new URL(request.url);
    const rawCode = searchParams.get('code') || '';
    const excludeId = searchParams.get('excludeId') || undefined;

    return await handleCheckCode(rawCode, excludeId);
  } catch (err: unknown) {
    console.error('School code check error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to check school code' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const retryAfter = consume(`check-code:${clientIp(request)}`, 30, 60_000);
    if (retryAfter > 0) return tooManyRequests(retryAfter);
    const body = await request.json().catch(() => ({}));
    const rawCode = body.code || '';
    const excludeId = body.excludeId || undefined;

    return await handleCheckCode(rawCode, excludeId);
  } catch (err: unknown) {
    console.error('School code check error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to check school code' },
      { status: 500 }
    );
  }
}

async function handleCheckCode(rawCode: string, excludeId?: string) {
  const sanitized = sanitizeSchoolCode(rawCode);
  const validation = validateSchoolCodeFormat(sanitized);

  if (!validation.isValid) {
    return NextResponse.json({
      success: true,
      valid: false,
      available: false,
      code: sanitized,
      error: validation.error,
      details: {
        length: validation.length,
        letterCount: validation.letterCount,
        digitCount: validation.digitCount,
        hasMinLetters: validation.hasMinLetters,
        hasMinDigits: validation.hasMinDigits,
        hasMinLength: validation.hasMinLength,
        hasMaxLength: validation.hasMaxLength,
      },
    });
  }

  const result = await serverDb.isSchoolCodeAvailable(sanitized, excludeId);

  return NextResponse.json({
    success: true,
    valid: true,
    available: result.available,
    code: sanitized,
    error: result.error,
    message: result.available ? `School code "${sanitized}" is available!` : result.error,
    existingSchool: result.existingSchool ? { name: result.existingSchool.name, code: result.existingSchool.code } : undefined,
    details: {
      length: validation.length,
      letterCount: validation.letterCount,
      digitCount: validation.digitCount,
      hasMinLetters: validation.hasMinLetters,
      hasMinDigits: validation.hasMinDigits,
      hasMinLength: validation.hasMinLength,
      hasMaxLength: validation.hasMaxLength,
    },
  });
}
