import type { ScanResult, CheckResult } from '@shipsafe/db';
import { calculateSummary } from './score.js';
import { safeCheck } from './utils.js';
import { checkHttps } from './checks/https.js';
import { checkSecurityHeaders } from './checks/headers.js';
import { checkExposedPaths } from './checks/exposed-paths.js';

const SCAN_TIMEOUT = 30_000;

export async function runScan(url: string): Promise<ScanResult> {
  const start = Date.now();

  const checksPromise = Promise.all([
    safeCheck(() => checkHttps(url)),
    safeCheck(() => checkSecurityHeaders(url)),
    safeCheck(() => checkExposedPaths(url)),
  ]);

  // Global timeout
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Scan timed out')), SCAN_TIMEOUT),
  );

  let allChecks: CheckResult[];
  try {
    const rawChecks = await Promise.race([checksPromise, timeoutPromise]);
    allChecks = (rawChecks as CheckResult[][]).flat();
  } catch {
    // Timeout — return empty results
    allChecks = [];
  }
  return {
    checks: allChecks,
    summary: calculateSummary(allChecks),
    scan_duration_ms: Date.now() - start,
    scanned_at: new Date().toISOString(),
  };
}
