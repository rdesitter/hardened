import type { Metadata } from 'next';
import { ReportView, type ReportData } from './report-view';

const HONO_API_URL = process.env.HONO_API_URL ?? 'http://api:4000';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

async function fetchReport(token: string): Promise<ReportData | null> {
  try {
    const res = await fetch(`${HONO_API_URL}/api/reports/${token}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const report = await fetchReport(token);

  if (!report) {
    return { title: 'Report not found — Hardened' };
  }

  const title = `Hardened Score: ${report.score}/100`;
  const description = `Security audit for ${report.url} — ${report.results.summary.passed} passed, ${report.results.summary.failed} failed (${report.results.summary.critical_failed} critical)`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${APP_URL}/report/${token}`,
      siteName: 'Hardened',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const report = await fetchReport(token);

  if (!report) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Report not found</p>
      </main>
    );
  }

  return <ReportView report={report} />;
}
