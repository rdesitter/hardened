import { Hono } from 'hono';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { db, scans, reports, eq } from '@shipsafe/db';
import type { CheckResult, ScanResult } from '@shipsafe/db';
import { runScan } from '../engine/index.js';
import { calculateScore } from '../engine/score.js';

const createScanSchema = z.object({
  url: z.string().url().max(2048),
});

function sanitizeForFreePlan(results: ScanResult): ScanResult {
  return {
    ...results,
    checks: results.checks.map((check) => ({
      ...check,
      fix: check.passed ? null : '__PRO_ONLY__',
    })),
  };
}

export const scansRouter = new Hono();

// POST /api/scans — create and launch scan
scansRouter.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = createScanSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid URL', details: parsed.error.flatten() }, 400);
  }

  const url = parsed.data.url;
  const userId = c.req.header('X-User-Id') || null;

  // Create scan in DB (status: pending)
  const [scan] = await db
    .insert(scans)
    .values({ url, status: 'pending', userId })
    .returning({ id: scans.id, url: scans.url, status: scans.status });

  // Launch scan engine async — don't block the response
  runScanAsync(scan.id, url);

  return c.json({ id: scan.id, status: scan.status, url: scan.url }, 201);
});

// GET /api/scans/:id — get scan result
scansRouter.get('/:id', async (c) => {
  const id = c.req.param('id');

  const [scan] = await db
    .select()
    .from(scans)
    .where(eq(scans.id, id))
    .limit(1);

  if (!scan) {
    return c.json({ error: 'Scan not found' }, 404);
  }

  const plan = (c.req.header('X-User-Plan') as 'free' | 'pro') || 'free';
  const results = scan.results as ScanResult | null;
  const sanitizedResults = results && plan !== 'pro'
    ? sanitizeForFreePlan(results)
    : results;

  // Fetch report token if scan is completed
  let reportToken: string | null = null;
  if (scan.status === 'completed') {
    const [report] = await db
      .select({ publicToken: reports.publicToken })
      .from(reports)
      .where(eq(reports.scanId, scan.id))
      .limit(1);
    reportToken = report?.publicToken ?? null;
  }

  return c.json({
    id: scan.id,
    url: scan.url,
    status: scan.status,
    score: scan.score,
    results: sanitizedResults,
    error: scan.error,
    report_token: reportToken,
    created_at: scan.createdAt,
  });
});

// GET /api/scans — list scans
scansRouter.get('/', async (c) => {
  const allScans = await db
    .select({
      id: scans.id,
      url: scans.url,
      status: scans.status,
      score: scans.score,
      createdAt: scans.createdAt,
    })
    .from(scans)
    .orderBy(scans.createdAt)
    .limit(20);

  return c.json({ scans: allScans, total: allScans.length });
});

// Async scan execution
async function runScanAsync(scanId: string, url: string) {
  try {
    // Set status to running
    await db.update(scans).set({ status: 'running' }).where(eq(scans.id, scanId));

    const result = await runScan(url);

    // Set status to completed with results
    const score = calculateScore(result.checks as CheckResult[]);
    await db
      .update(scans)
      .set({ status: 'completed', score, results: result })
      .where(eq(scans.id, scanId));

    // Create public report
    await db.insert(reports).values({
      scanId,
      publicToken: nanoid(32),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db
      .update(scans)
      .set({ status: 'failed', error: message })
      .where(eq(scans.id, scanId));
  }
}
