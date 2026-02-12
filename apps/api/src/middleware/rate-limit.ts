import { createMiddleware } from 'hono/factory';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Cleanup expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 10 * 60 * 1000);

function getLimit(plan: string | undefined): number {
  switch (plan) {
    case 'pro': return 50;
    case 'free': return 10;
    default: return 5; // anonymous
  }
}

export const rateLimit = createMiddleware(async (c, next) => {
  const ip = c.req.header('x-forwarded-for') ?? 'unknown';
  const userId = c.req.header('X-User-Id');
  const plan = c.req.header('X-User-Plan');

  const key = userId ?? `ip:${ip}`;
  const limit = getLimit(plan);
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    await next();
    return;
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    c.header('Retry-After', String(retryAfter));
    return c.json({ error: 'Too many requests' }, 429);
  }

  entry.count++;
  await next();
});
