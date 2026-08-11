// In-memory rate limiter (resets on server restart — fine for demo, use Redis in prod)
const attempts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, maxAttempts = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const record = attempts.get(key);

  // No record, or previous window expired -> start fresh
  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  // Within window and already over the limit -> block
  if (record.count >= maxAttempts) return false;

  record.count++;
  return true;
}