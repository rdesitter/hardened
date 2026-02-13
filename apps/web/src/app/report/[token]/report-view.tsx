'use client';

import { useState } from 'react';

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

const GROUP_LABELS: Record<string, string> = {
  transport: 'Transport',
  headers: 'Headers',
  cors: 'CORS',
  cookies: 'Cookies',
  exposure: 'Exposure',
  dns: 'DNS',
};

const GROUP_ORDER = ['transport', 'headers', 'cors', 'cookies', 'exposure', 'dns'];

function scoreStroke(score: number): string {
  if (score >= 70) return '#4ade80';
  if (score >= 40) return '#facc15';
  return '#f87171';
}

function scoreTextClass(score: number): string {
  if (score >= 70) return 'text-green-400';
  if (score >= 40) return 'text-yellow-400';
  return 'text-red-400';
}

function categoryBadge(category: string): string {
  switch (category) {
    case 'critical':
      return 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20';
    case 'warning':
      return 'bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20';
    default:
      return 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20';
  }
}

function CheckItem({ check }: { check: CheckResult }) {
  const [expanded, setExpanded] = useState(false);
  const hasExpandable = check.detail || (!check.passed && check.fix);

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/50">
      <button
        type="button"
        onClick={() => hasExpandable && setExpanded(!expanded)}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left ${hasExpandable ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          check.passed
            ? 'bg-green-500/10 text-green-400'
            : 'bg-red-500/10 text-red-400'
        }`}>
          {check.passed ? '✓' : '✗'}
        </span>
        <span className="flex-1 text-sm font-medium">{check.label}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs ${categoryBadge(check.category)}`}>
          {check.category}
        </span>
        {hasExpandable && (
          <svg
            className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        )}
      </button>
      {expanded && (
        <div className="border-t border-gray-800 px-4 py-3">
          <p className="text-sm text-gray-400">{check.detail}</p>
          {!check.passed && check.fix && (
            <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-950 p-3 text-xs leading-relaxed text-gray-300">
              {check.fix}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export function ReportView({ report }: { report: ReportData }) {
  const s = report.score;
  const circumference = Math.PI * 2 * 15.9;

  // Group checks
  const grouped = new Map<string, CheckResult[]>();
  for (const check of report.results.checks) {
    const list = grouped.get(check.group) ?? [];
    list.push(check);
    grouped.set(check.group, list);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* Header badge */}
      <div className="mb-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-400/20 bg-green-400/5 px-3 py-1 text-xs font-medium text-green-400">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
          Hardened Security Report
        </span>
      </div>

      {/* Score header */}
      <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
        {/* Circle */}
        <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
          <svg viewBox="0 0 36 36" className="h-32 w-32 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="2" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={scoreStroke(s)} strokeWidth="2"
              strokeDasharray={`${(s / 100) * circumference}, ${circumference}`}
              strokeLinecap="round"
            />
          </svg>
          <span className={`absolute text-3xl font-bold ${scoreTextClass(s)}`}>{s}</span>
        </div>
        {/* Info */}
        <div className="text-center sm:text-left">
          <p className="text-lg font-semibold">{report.url.replace(/^https?:\/\//, '')}</p>
          <p className="mt-1 text-sm text-gray-400">
            {report.results.summary.passed} passed, {report.results.summary.failed} failed — {report.results.scan_duration_ms}ms
          </p>
          <p className="mt-1 text-xs text-gray-600">
            Scanned {new Date(report.scanned_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Grouped checks */}
      <div className="space-y-6">
        {GROUP_ORDER.filter((g) => grouped.has(g)).map((group) => {
          const checks = grouped.get(group)!;
          const passed = checks.filter((c) => c.passed).length;
          return (
            <div key={group}>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                  {GROUP_LABELS[group] ?? group}
                </h3>
                <span className="text-xs text-gray-600">
                  {passed}/{checks.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {checks.map((check) => (
                  <CheckItem key={check.id} check={check} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-10 text-center">
        <p className="text-xs text-gray-600">
          Scanned with{' '}
          <a href="/" className="text-green-400 hover:underline">Hardened</a>
          {' '}— Free security audit for apps
        </p>
      </div>
    </main>
  );
}
