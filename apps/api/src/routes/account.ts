import { Hono } from 'hono';
import { db, users, scans, reports, sessions, accounts, eq } from '@shipsafe/db';
import { inArray } from 'drizzle-orm';

const deleteStore = new Map<string, number>();

export const accountRouter = new Hono();

accountRouter.delete('/', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  // Rate limit: 1 call per hour per user
  const now = Date.now();
  const lastCall = deleteStore.get(userId);
  if (lastCall && now - lastCall < 60 * 60 * 1000) {
    const retryAfter = Math.ceil((lastCall + 60 * 60 * 1000 - now) / 1000);
    c.header('Retry-After', String(retryAfter));
    return c.json({ error: 'Too many requests. Try again later.' }, 429);
  }
  deleteStore.set(userId, now);

  // Get user email for logging
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Get all scan IDs for this user
  const userScans = await db
    .select({ id: scans.id })
    .from(scans)
    .where(eq(scans.userId, userId));

  const scanIds = userScans.map((s) => s.id);

  // Transaction: delete reports → scans → user (accounts + sessions cascade)
  await db.transaction(async (tx) => {
    if (scanIds.length > 0) {
      await tx.delete(reports).where(inArray(reports.scanId, scanIds));
      await tx.delete(scans).where(eq(scans.userId, userId));
    }

    // sessions and accounts cascade via FK onDelete, but delete explicitly for safety
    await tx.delete(sessions).where(eq(sessions.userId, userId));
    await tx.delete(accounts).where(eq(accounts.userId, userId));
    await tx.delete(users).where(eq(users.id, userId));
  });

  console.log(
    `[ACCOUNT_DELETED] user_id=${userId} email=${user.email} timestamp=${new Date().toISOString()}`,
  );

  return c.json({ status: 'deleted' });
});
