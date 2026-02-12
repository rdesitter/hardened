import { Hono } from 'hono';
import { db, reports, scans, eq } from '@shipsafe/db';

export const reportsRouter = new Hono();

// GET /api/reports/:token — public report (no auth required)
reportsRouter.get('/:token', async (c) => {
  const token = c.req.param('token');

  const [report] = await db
    .select({
      scanId: reports.scanId,
      publicToken: reports.publicToken,
      createdAt: reports.createdAt,
    })
    .from(reports)
    .where(eq(reports.publicToken, token))
    .limit(1);

  if (!report) {
    return c.json({ error: 'Report not found' }, 404);
  }

  const [scan] = await db
    .select()
    .from(scans)
    .where(eq(scans.id, report.scanId))
    .limit(1);

  if (!scan) {
    return c.json({ error: 'Scan not found' }, 404);
  }

  // Public reports always include full fixes (serves as a showcase)
  return c.json({
    url: scan.url,
    score: scan.score,
    results: scan.results,
    scanned_at: scan.createdAt,
  });
});
