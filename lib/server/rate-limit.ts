import { NextResponse } from 'next/server';

// In-memory, per-process. Fine for a single Render instance; needs a shared store (e.g. Redis) if scaled out.
type Bucket = { count: number; resetAt: number };

declare global {
  // eslint-disable-next-line no-var
  var __RATE_LIMIT_BUCKETS__: Map<string, Bucket> | undefined;
}

const buckets = (globalThis.__RATE_LIMIT_BUCKETS__ ??= new Map<string, Bucket>());

function prune(now: number) {
  if (buckets.size < 10_000) return;
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
}

function current(key: string, now: number): Bucket | undefined {
  const bucket = buckets.get(key);
  if (bucket && bucket.resetAt <= now) {
    buckets.delete(key);
    return undefined;
  }
  return bucket;
}

/** Counts every call; returns the seconds to wait once `limit` calls happen within `windowMs`. */
export function consume(key: string, limit: number, windowMs: number): number {
  const now = Date.now();
  prune(now);
  const bucket = current(key, now) ?? { count: 0, resetAt: now + windowMs };
  bucket.count += 1;
  buckets.set(key, bucket);
  return bucket.count > limit ? Math.ceil((bucket.resetAt - now) / 1000) : 0;
}

/** Seconds remaining if `key` has already reached `limit` recorded failures, else 0. */
export function blockedFor(key: string, limit: number): number {
  const now = Date.now();
  const bucket = current(key, now);
  return bucket && bucket.count >= limit ? Math.ceil((bucket.resetAt - now) / 1000) : 0;
}

export function recordFailure(key: string, windowMs: number): void {
  const now = Date.now();
  prune(now);
  const bucket = current(key, now) ?? { count: 0, resetAt: now + windowMs };
  bucket.count += 1;
  buckets.set(key, bucket);
}

export function clearFailures(key: string): void {
  buckets.delete(key);
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export function tooManyRequests(retryAfterSeconds: number) {
  return NextResponse.json(
    { success: false, valid: false, error: `Too many attempts. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).` },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  );
}
