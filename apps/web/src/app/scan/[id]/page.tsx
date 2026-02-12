'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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

export default function ScanPage() {
  const { id } = useParams<{ id: string }>();
  const [scan, setScan] = useState<ScanData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
        if (!res.ok) {
          setError('Scan not found');
          return;
        }
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

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-red-400">{error}</p>
      </main>
    );
  }

  if (!scan) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  // Pending / Running state
  if (scan.status === 'pending' || scan.status === 'running') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-green-400" />
        <p className="text-gray-400">
          Scanning <span className="text-white">{scan.url}</span>...
        </p>
      </main>
    );
  }

  // Failed state
  if (scan.status === 'failed') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-2xl font-bold text-red-400">Scan Failed</p>
        <p className="text-gray-400">{scan.error}</p>
      </main>
    );
  }

  // Completed state
  const { score, results } = scan;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <p className="text-sm text-gray-400">{scan.url}</p>
        <p className={`mt-2 text-7xl font-bold ${scoreColor(score ?? 0)}`}>
          {score}
        </p>
        <p className="text-gray-500">/ 100</p>
      </div>

      {/* Summary */}
      {results && (
        <div className="mb-4 flex justify-center gap-6 text-sm">
          <span className="text-green-400">{results.summary.passed} passed</span>
          <span className="text-red-400">{results.summary.failed} failed</span>
          <span className="text-gray-500">{results.scan_duration_ms}ms</span>
        </div>
      )}

      {/* Share button */}
      {scan.report_token && (
        <div className="mb-8 text-center">
          <button
            onClick={() => handleShare(scan.report_token!)}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            {copied ? 'Link copied!' : 'Share report'}
          </button>
        </div>
      )}

      {/* Checks list */}
      {results && (
        <div className="space-y-2">
          {results.checks.map((check) => (
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
              {!check.passed && check.fix === '__PRO_ONLY__' && (
                <Link
                  href="/pricing"
                  className="mt-2 inline-block rounded bg-green-900/50 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-900"
                >
                  Upgrade to Pro to see the fix →
                </Link>
              )}
              {!check.passed && check.fix && check.fix !== '__PRO_ONLY__' && (
                <pre className="mt-2 rounded bg-gray-800 p-3 text-xs text-gray-300">
                  {check.fix}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
