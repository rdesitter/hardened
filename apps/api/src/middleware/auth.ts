import { createMiddleware } from 'hono/factory';

export const internalAuth = createMiddleware(async (c, next) => {
  const token = c.req.header('X-Internal-Token');
  const expected = process.env.INTERNAL_API_TOKEN;

  if (!expected) {
    console.error('INTERNAL_API_TOKEN is not set');
    return c.json({ error: 'Server misconfigured' }, 500);
  }

  if (token !== expected) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
});
