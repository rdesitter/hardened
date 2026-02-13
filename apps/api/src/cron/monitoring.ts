import cron from 'node-cron';
import { Resend } from 'resend';
import { nanoid } from 'nanoid';
import { db, users, scans, reports, eq, and, desc } from '@hardened/db';
import type { CheckResult, ScanResult } from '@hardened/db';
import { runScan } from '../engine/index.js';
import { calculateScore } from '../engine/score.js';

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY!);
  }
  return _resend;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const EMAIL_FROM = process.env.AUTH_EMAIL_FROM ?? 'Hardened <onboarding@resend.dev>';

interface Regression {
  id: string;
  label: string;
}

/**
 * Find checks that regressed (passed before → failed now).
 */
function findRegressions(
  oldChecks: CheckResult[],
  newChecks: CheckResult[],
): Regression[] {
  const oldMap = new Map(oldChecks.map((c) => [c.id, c]));
  const regressions: Regression[] = [];

  for (const check of newChecks) {
    const old = oldMap.get(check.id);
    if (old && old.passed && !check.passed) {
      regressions.push({ id: check.id, label: check.label });
    }
  }

  return regressions;
}

/**
 * Run monitoring for all Pro users.
 * For each Pro user, re-scan their most recent URL, compare scores,
 * and send an alert email if regressions are detected.
 */
export async function runMonitoring(): Promise<{ processed: number; alerts: number }> {
  console.log('[monitoring] Starting weekly monitoring job...');

  // Get the latest scan for each Pro user (subquery: max created_at per user)
  const proUsers = await db
    .select({
      userId: users.id,
      email: users.email,
    })
    .from(users)
    .where(eq(users.plan, 'pro'));

  let processed = 0;
  let alerts = 0;

  for (const user of proUsers) {
    // Get the user's most recent completed scan
    const [lastScan] = await db
      .select()
      .from(scans)
      .where(
        and(
          eq(scans.userId, user.userId),
          eq(scans.status, 'completed'),
        ),
      )
      .orderBy(desc(scans.createdAt))
      .limit(1);

    if (!lastScan) continue;

    const url = lastScan.url;
    const oldResults = lastScan.results as ScanResult | null;
    const oldScore = lastScan.score ?? 0;

    console.log(`[monitoring] Scanning ${url} for ${user.email}...`);

    try {
      // Run a new scan
      const newResults = await runScan(url);
      const newScore = calculateScore(newResults.checks as CheckResult[]);

      // Save the monitoring scan
      const [monitoringScan] = await db
        .insert(scans)
        .values({
          url,
          userId: user.userId,
          status: 'completed',
          score: newScore,
          results: newResults,
          isMonitoring: true,
        })
        .returning({ id: scans.id });

      // Create public report
      await db.insert(reports).values({
        scanId: monitoringScan.id,
        publicToken: nanoid(32),
      });

      processed++;

      // Compare with previous scan
      if (!oldResults) continue;

      const regressions = findRegressions(
        oldResults.checks,
        newResults.checks as CheckResult[],
      );

      if (regressions.length > 0) {
        // Fetch the report token for the new scan
        const [report] = await db
          .select({ publicToken: reports.publicToken })
          .from(reports)
          .where(eq(reports.scanId, monitoringScan.id))
          .limit(1);

        const reportUrl = report
          ? `${APP_URL}/report/${report.publicToken}`
          : `${APP_URL}/dashboard`;

        await sendAlertEmail(
          user.email,
          url,
          oldScore,
          newScore,
          regressions,
          reportUrl,
        );
        alerts++;
      }
    } catch (error) {
      console.error(`[monitoring] Failed to scan ${url} for ${user.email}:`, error);
    }
  }

  console.log(`[monitoring] Done. Processed: ${processed}, Alerts sent: ${alerts}`);
  return { processed, alerts };
}

async function sendAlertEmail(
  to: string,
  url: string,
  oldScore: number,
  newScore: number,
  regressions: Regression[],
  reportUrl: string,
): Promise<void> {
  const regressionList = regressions
    .map((r) => `  - ${r.label} (${r.id}): passed → failed`)
    .join('\n');

  const text = `Security regression detected on ${url}

Score change: ${oldScore}/100 → ${newScore}/100

Checks that regressed:
${regressionList}

View the full report: ${reportUrl}

---
Hardened Weekly Monitoring
You receive this email because you have an active Pro subscription.`;

  try {
    await getResend().emails.send({
      from: EMAIL_FROM,
      to,
      subject: `⚠️ Hardened: Security regression detected on ${url}`,
      text,
    });
    console.log(`[monitoring] Alert email sent to ${to} for ${url}`);
  } catch (error) {
    console.error(`[monitoring] Failed to send alert email to ${to}:`, error);
  }
}

/**
 * Schedule the monitoring cron job.
 * Runs every Monday at 6:00 UTC.
 */
export function scheduleMonitoring(): void {
  cron.schedule('0 6 * * 1', () => {
    runMonitoring().catch((err) =>
      console.error('[monitoring] Unhandled error:', err),
    );
  }, { timezone: 'UTC' });

  console.log('[monitoring] Cron scheduled: every Monday at 6:00 UTC');
}
