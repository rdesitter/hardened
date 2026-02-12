import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { proxyToHono } from '@/lib/api';
import { db, users, eq } from '@hardened/db';
import Link from 'next/link';
import { DashboardScans } from './dashboard-scans';

interface ScanItem {
  id: string;
  url: string;
  status: string;
  score: number | null;
  isMonitoring: boolean;
  createdAt: string;
}

async function getUserScans(): Promise<ScanItem[]> {
  try {
    const res = await proxyToHono('/api/scans');
    if (!res.ok) return [];
    const data = await res.json();
    return data.scans ?? [];
  } catch {
    return [];
  }
}

async function getUserPlan(userId: string): Promise<string> {
  const [user] = await db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user?.plan ?? 'free';
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const [scans, plan] = await Promise.all([
    getUserScans(),
    getUserPlan(session.user.id!),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-400">
            {session.user.email}
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-gray-950 transition-colors hover:bg-green-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New scan
        </Link>
      </div>

      {scans.length === 0 ? (
        <div className="mt-12 flex flex-col items-center rounded-2xl border border-gray-800 bg-gray-900/50 py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-800">
            <svg className="h-7 w-7 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </div>
          <p className="mt-4 text-gray-400">No scans yet</p>
          <Link
            href="/"
            className="mt-4 rounded-xl bg-green-500 px-5 py-2.5 text-sm font-semibold text-gray-950 transition-colors hover:bg-green-400"
          >
            Run your first scan
          </Link>
        </div>
      ) : (
        <DashboardScans scans={scans} plan={plan} />
      )}
    </main>
  );
}
