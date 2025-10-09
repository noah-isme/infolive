import crypto from 'node:crypto';

import { getEnv } from '@/lib/env';

interface RateLimitOptions {
  limit?: number;
  windowMs?: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  retryAfter?: number;
}

const DEFAULT_OPTIONS: Required<RateLimitOptions> = {
  limit: 10,
  windowMs: 60_000,
};

const cache = new Map<string, { count: number; expiresAt: number }>();

const env = getEnv();

function getKey(identifier: string) {
  return crypto.createHash('sha256').update(`${env.RATE_LIMIT_TOKEN}-${identifier}`).digest('hex');
}

export function enforceRateLimit(
  identifier: string,
  options: RateLimitOptions = {},
): RateLimitResult {
  const { limit, windowMs } = { ...DEFAULT_OPTIONS, ...options };
  const key = getKey(identifier);
  const now = Date.now();

  const entry = cache.get(key);

  if (!entry || entry.expiresAt <= now) {
    cache.set(key, { count: 1, expiresAt: now + windowMs });
    return {
      success: true,
      limit,
      remaining: limit - 1,
    };
  }

  if (entry.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      retryAfter: Math.max(0, Math.ceil((entry.expiresAt - now) / 1000)),
    };
  }

  entry.count += 1;
  cache.set(key, entry);

  return {
    success: true,
    limit,
    remaining: limit - entry.count,
  };
}
