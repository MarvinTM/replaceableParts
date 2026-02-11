export function createRateLimiter({
  windowMs,
  max,
  message = 'Too many requests, please try again later.',
  keyGenerator
}) {
  const buckets = new Map();

  return (req, res, next) => {
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const now = Date.now();

    if (buckets.size > 1000) {
      for (const [key, bucket] of buckets.entries()) {
        if (bucket.resetAt <= now) {
          buckets.delete(key);
        }
      }
    }

    const key = (keyGenerator ? keyGenerator(req) : req.ip) || req.ip || 'global';
    const existing = buckets.get(key);

    let bucket = existing;
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    const remaining = Math.max(max - bucket.count, 0);
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      return res.status(429).json({ error: message });
    }

    next();
  };
}
