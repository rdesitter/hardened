'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ScoreHistoryChart } from '@/components/score-history-chart';

interface CheckResult {
  id: string;
  category: 'critical' | 'warning' | 'info';
  group: string;
  passed: boolean;
  label: string;
  detail: string;
  fix: string | null;
}

interface ScanData {
  id: string;
  url: string;
  status: string;
  score: number | null;
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
  } | null;
  error: string | null;
  report_token: string | null;
}

interface HistoryPoint {
  score: number;
  date: string;
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
  const hasExpandable = check.detail || (!check.passed && check.fix && check.fix !== '__PRO_ONLY__');

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
        {!check.passed && (
          <span className={`rounded-full px-2 py-0.5 text-xs ${categoryBadge(check.category)}`}>
            {check.category}
          </span>
        )}
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
          {!check.passed && check.fix === '__PRO_ONLY__' && (
            <Link
              href="/pricing"
              className="mt-3 inline-flex items-center gap-1 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 ring-1 ring-green-500/20 transition-colors hover:bg-green-500/20"
            >
              Upgrade to Pro to see the fix
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          )}
          {!check.passed && check.fix && check.fix !== '__PRO_ONLY__' && (
            <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-950 p-3 text-xs leading-relaxed text-gray-300">
              {check.fix}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function ScanPage() {
  const { id } = useParams<{ id: string }>();
  const [scan, setScan] = useState<ScanData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [plan, setPlan] = useState<string | null>(null);

  function handleShare(token: string) {
    const url = `${window.location.origin}/report/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  useEffect(() => {
    if (!id) return;
    let active = true;

    async function poll() {
      try {
        const res = await fetch(`/api/scans/${id}`);
        if (!res.ok) { setError('Scan not found'); return; }
        const data: ScanData = await res.json();
        if (!active) return;
        setScan(data);
        if (data.status === 'pending' || data.status === 'running') {
          setTimeout(poll, 2000);
        }
      } catch {
        if (active) setError('Failed to fetch scan');
      }
    }

    poll();
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!scan || scan.status !== 'completed') return;
    const checks = scan.results?.checks ?? [];
    const hasPro = checks.some((c) => !c.passed && c.fix === '__PRO_ONLY__');
    const userPlan = hasPro ? 'free' : 'pro';
    setPlan(userPlan);

    if (userPlan === 'pro') {
      fetch(`/api/scans?history=true&url=${encodeURIComponent(scan.url)}`)
        .then((res) => res.json())
        .then((data) => setHistory(data.history ?? []))
        .catch(() => {});
    }
  }, [scan]);

  if (error) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-red-400">{error}</p>
      </main>
    );
  }

  if (!scan) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-green-400" />
      </main>
    );
  }

  if (scan.status === 'pending' || scan.status === 'running') {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-gray-800 border-t-green-400" />
          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="font-medium">Scanning your app...</p>
          <p className="mt-1 text-sm text-gray-400">{scan.url}</p>
        </div>
      </main>
    );
  }

  if (scan.status === 'failed') {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-red-400">Scan Failed</p>
        <p className="text-sm text-gray-400">{scan.error}</p>
      </main>
    );
  }

  // Completed
  const { score, results } = scan;
  const s = score ?? 0;
  const circumference = Math.PI * 2 * 15.9;

  // Group checks
  const grouped = new Map<string, CheckResult[]>();
  for (const check of results?.checks ?? []) {
    const list = grouped.get(check.group) ?? [];
    list.push(check);
    grouped.set(check.group, list);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
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
              className="transition-all duration-700"
            />
          </svg>
          <span className={`absolute text-3xl font-bold ${scoreTextClass(s)}`}>{s}</span>
        </div>
        {/* Info */}
        <div className="text-center sm:text-left">
          <p className="text-lg font-semibold">{scan.url.replace(/^https?:\/\//, '')}</p>
          {results && (
            <p className="mt-1 text-sm text-gray-400">
              {results.summary.passed} passed, {results.summary.failed} failed — {results.scan_duration_ms}ms
            </p>
          )}
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            {scan.report_token && (
              <button
                onClick={() => handleShare(scan.report_token!)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                </svg>
                {copied ? 'Copied!' : 'Share report'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* History chart */}
      {plan === 'pro' && (
        <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <h2 className="mb-3 text-sm font-medium text-gray-400">Score History</h2>
          <ScoreHistoryChart data={history} />
        </div>
      )}
      {plan === 'free' && (
        <div className="mb-8 flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3">
          <p className="text-sm text-gray-400">Track your score over time</p>
          <Link
            href="/pricing"
            className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 ring-1 ring-green-500/20 transition-colors hover:bg-green-500/20"
          >
            Upgrade to Pro
          </Link>
        </div>
      )}

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
    </main>
  );
}
