/**
 * @fileoverview Rate limiter middleware — sliding window, per-user.
 * Extracted into its own module to avoid circular imports (server ↔ routes).
 */

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30;

// Periodic cleanup to prevent memory leak — purge expired entries every 60s
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of rateLimitMap.entries()) {
    const active = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
    if (active.length === 0) {
      rateLimitMap.delete(key);
    } else {
      rateLimitMap.set(key, active);
    }
  }
}, RATE_LIMIT_WINDOW);

/**
 * Per-user rate limiting. MUST run AFTER requireAuth so req.user is populated.
 * Falls back to req.ip if user is not authenticated.
 */
export function rateLimit(req, res, next) {
  const userId = req.user?.id || req.ip;
  const now = Date.now();
  const key = `rl:${userId}`;

  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, []);
  }

  const timestamps = rateLimitMap.get(key).filter((t) => now - t < RATE_LIMIT_WINDOW);
  rateLimitMap.set(key, timestamps);

  if (timestamps.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: { code: 'RATE_LIMITED', message: `Too many requests. Max ${RATE_LIMIT_MAX} per minute.`, status: 429 },
    });
  }

  timestamps.push(now);
  res.set('X-RateLimit-Remaining', String(RATE_LIMIT_MAX - timestamps.length));
  res.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX));
  next();
}

/** Expose internals for testing */
export const _testInternals = { rateLimitMap, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW };
