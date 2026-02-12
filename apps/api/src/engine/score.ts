import type { CheckResult } from '@shipsafe/db';

const penalties: Record<string, number> = {
  critical: 15,
  warning: 8,
  info: 3,
};

export function calculateScore(checks: CheckResult[]): number {
  const totalPenalty = checks
    .filter((c) => !c.passed)
    .reduce((sum, c) => sum + (penalties[c.category] ?? 0), 0);

  return Math.max(0, 100 - totalPenalty);
}

export function calculateSummary(checks: CheckResult[]) {
  const failed = checks.filter((c) => !c.passed);
  return {
    total: checks.length,
    passed: checks.length - failed.length,
    failed: failed.length,
    critical_failed: failed.filter((c) => c.category === 'critical').length,
    warning_failed: failed.filter((c) => c.category === 'warning').length,
  };
}
