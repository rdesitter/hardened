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

export function DashboardTable({
  scans,
  plan,
}: {
  scans: ScanItem[];
  plan: string;
}) {
  const [historyMap, setHistoryMap] = useState<Record<string, HistoryPoint[]>>({});

  // Fetch history for URLs that appear more than once
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
    <div className="mt-8 overflow-hidden rounded-lg border border-gray-700">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-700 bg-gray-800/50">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-300">URL</th>
            <th className="px-4 py-3 font-medium text-gray-300">Score</th>
            {plan === 'pro' && (
              <th className="px-4 py-3 font-medium text-gray-300">Trend</th>
            )}
            <th className="px-4 py-3 font-medium text-gray-300">Status</th>
            <th className="px-4 py-3 font-medium text-gray-300">Source</th>
            <th className="px-4 py-3 font-medium text-gray-300">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/50">
          {scans.map((scan) => (
            <tr key={scan.id} className="hover:bg-gray-800/30">
              <td className="px-4 py-3">
                <Link
                  href={`/scan/${scan.id}`}
                  className="text-blue-400 hover:underline"
                >
                  {scan.url.replace(/^https?:\/\//, '').slice(0, 40)}
                </Link>
              </td>
              <td className="px-4 py-3">
                {scan.score !== null ? (
                  <span
                    className={
                      scan.score >= 70
                        ? 'text-green-400'
                        : scan.score >= 40
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }
                  >
                    {scan.score}/100
                  </span>
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </td>
              {plan === 'pro' && (
                <td className="px-4 py-3">
                  {historyMap[scan.url]?.length > 1 ? (
                    <ScoreSparkline data={historyMap[scan.url]} />
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </td>
              )}
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    scan.status === 'completed'
                      ? 'bg-green-900/50 text-green-400'
                      : scan.status === 'failed'
                        ? 'bg-red-900/50 text-red-400'
                        : 'bg-yellow-900/50 text-yellow-400'
                  }`}
                >
                  {scan.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    scan.isMonitoring
                      ? 'bg-purple-900/50 text-purple-400'
                      : 'bg-gray-700/50 text-gray-400'
                  }`}
                >
                  {scan.isMonitoring ? 'Monitoring' : 'Manual'}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-400">
                {new Date(scan.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
