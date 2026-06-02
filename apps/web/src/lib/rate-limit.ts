/**
 * In-memory sliding-window rate limiter for login attempts.
 * Keyed by IP address. Resets after WINDOW_MS.
 *
 * For multi-instance deploys: replace with Redis INCR + EXPIRE.
 * This is sufficient for single-instance Vercel/Docker deployments.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

const MAX_ATTEMPTS = 10; // per window
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 30 * 60 * 1000; // 30-minute lockout after MAX exceeded

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
}

export function checkLoginRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(ip);

  if (!bucket || now > bucket.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    const retryAfterMs = bucket.resetAt - now;
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  bucket.count += 1;
  return { allowed: true, remaining: MAX_ATTEMPTS - bucket.count };
}

export function resetLoginRateLimit(ip: string): void {
  store.delete(ip);
}

/** Trigger lockout (extend window to LOCKOUT_MS from now) */
export function lockoutIp(ip: string): void {
  const now = Date.now();
  store.set(ip, { count: MAX_ATTEMPTS, resetAt: now + LOCKOUT_MS });
}

/** Periodic cleanup to avoid memory growth */
setInterval(
  () => {
    const now = Date.now();
    for (const [key, bucket] of store) {
      if (now > bucket.resetAt) store.delete(key);
    }
  },
  5 * 60 * 1000
);
