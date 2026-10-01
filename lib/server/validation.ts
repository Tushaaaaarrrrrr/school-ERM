import { NextResponse } from 'next/server';
import { z } from 'zod';

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
export const fiveDigitPin = z.string().regex(/^\d{5}$/, 'PIN must be exactly 5 digits');

type Parsed<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

export async function parseJsonBody<S extends z.ZodTypeAny>(request: Request, schema: S): Promise<Parsed<z.infer<S>>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: NextResponse.json({ success: false, error: 'Request body must be valid JSON' }, { status: 400 }) };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue?.path.length ? `${issue.path.join('.')}: ` : '';
    return { ok: false, response: NextResponse.json({ success: false, error: `${where}${issue?.message || 'Invalid request'}` }, { status: 400 }) };
  }
  return { ok: true, data: result.data };
}
