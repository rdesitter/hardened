'use client';

interface CheckResult {
  id: string;
  category: 'critical' | 'warning' | 'info';
  group: string;
  passed: boolean;
  label: string;
  detail: string;
  fix: string | null;
}

export interface ReportData {
  url: string;
  score: number;
  results: {
    checks: CheckResult[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      critical_failed: number;
      warning_failed: number;
    };
    scan_duration_ms: number;
  };
  scanned_at: string;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

function categoryBadge(category: string): string {
  switch (category) {
    case 'critical':
      return 'bg-red-900 text-red-300';
    case 'warning':
      return 'bg-yellow-900 text-yellow-300';
    default:
      return 'bg-blue-900 text-blue-300';
  }
}

export function ReportView({ report }: { report: ReportData }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      {/* Header */}
      <div className="mb-2 text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-green-400">
          ShipSafe Security Report
        </p>
        <p className="mt-2 text-sm text-gray-400">{report.url}</p>
        <p className={`mt-2 text-7xl font-bold ${scoreColor(report.score)}`}>
          {report.score}
        </p>
        <p className="text-gray-500">/ 100</p>
      </div>

      {/* Summary */}
      <div className="mb-8 flex justify-center gap-6 text-sm">
        <span className="text-green-400">
          {report.results.summary.passed} passed
        </span>
        <span className="text-red-400">
          {report.results.summary.failed} failed
        </span>
        <span className="text-gray-500">
          {report.results.scan_duration_ms}ms
        </span>
      </div>

      {/* Checks list */}
      <div className="space-y-2">
        {report.results.checks.map((check) => (
          <div
            key={check.id}
            className="rounded-lg border border-gray-800 bg-gray-900 p-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">
                {check.passed ? '✓' : '✗'}
              </span>
              <span className="font-medium">{check.label}</span>
              <span
                className={`rounded px-2 py-0.5 text-xs ${categoryBadge(check.category)}`}
              >
                {check.category}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-400">{check.detail}</p>
            {!check.passed && check.fix && (
              <pre className="mt-2 whitespace-pre-wrap rounded bg-gray-800 p-3 text-xs text-gray-300">
                {check.fix}
              </pre>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <p className="mt-8 text-center text-xs text-gray-600">
        Scanned with{' '}
        <a href="/" className="text-green-400 hover:underline">
          ShipSafe
        </a>
      </p>
    </main>
  );
}
