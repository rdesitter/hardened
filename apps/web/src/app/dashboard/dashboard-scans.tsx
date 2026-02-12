'use client';

import Link from 'next/link';
import { ScoreSparkline } from '@/components/score-sparkline';
import { useEffect, useState } from 'react';

interface ScanItem {
  id: string;
  url: string;
  status: string;
  score: number | null;
  isMonitoring: boolean;
  createdAt: string;
}

interface HistoryPoint {
  score: number;
  date: string;
}

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

export function DashboardScans({
  scans,
  plan,
}: {
  scans: ScanItem[];
  plan: string;
}) {
  const [historyMap, setHistoryMap] = useState<Record<string, HistoryPoint[]>>({});

  useEffect(() => {
    if (plan !== 'pro') return;

    const urlCounts = new Map<string, number>();
    for (const scan of scans) {
      urlCounts.set(scan.url, (urlCounts.get(scan.url) ?? 0) + 1);
    }

    const multiUrls = [...urlCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([url]) => url);

    if (multiUrls.length === 0) return;

    Promise.all(
      multiUrls.map(async (url) => {
        const res = await fetch(
          `/api/scans?history=true&url=${encodeURIComponent(url)}`,
        );
        if (!res.ok) return { url, history: [] };
        const data = await res.json();
        return { url, history: data.history as HistoryPoint[] };
      }),
    ).then((results) => {
      const map: Record<string, HistoryPoint[]> = {};
      for (const r of results) {
        map[r.url] = r.history;
      }
      setHistoryMap(map);
    });
  }, [scans, plan]);

  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      {scans.map((scan) => {
        const s = scan.score ?? 0;
        const circumference = Math.PI * 2 * 15.9;

        return (
          <Link
            key={scan.id}
            href={`/scan/${scan.id}`}
            className="group rounded-xl border border-gray-800 bg-gray-900/50 p-4 transition-colors hover:border-gray-700 hover:bg-gray-900/80"
          >
            <div className="flex items-center gap-4">
              {/* Mini score circle */}
              {scan.score !== null ? (
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                  <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke={scoreStroke(s)} strokeWidth="3"
                      strokeDasharray={`${(s / 100) * circumference}, ${circumference}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className={`absolute text-xs font-bold ${scoreTextClass(s)}`}>{s}</span>
                </div>
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-800">
                  <span className="text-xs text-gray-500">—</span>
                </div>
              )}

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium group-hover:text-white">
                  {scan.url.replace(/^https?:\/\//, '')}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      scan.status === 'completed'
                        ? 'bg-green-500/10 text-green-400'
                        : scan.status === 'failed'
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-yellow-500/10 text-yellow-400'
                    }`}
                  >
                    {scan.status}
                  </span>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      scan.isMonitoring
                        ? 'bg-purple-500/10 text-purple-400'
                        : 'bg-gray-500/10 text-gray-400'
                    }`}
                  >
                    {scan.isMonitoring ? 'Monitoring' : 'Manual'}
                  </span>
                  <span className="text-xs text-gray-600">
                    {new Date(scan.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Sparkline */}
              {plan === 'pro' && historyMap[scan.url]?.length > 1 && (
                <ScoreSparkline data={historyMap[scan.url]} />
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
