import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { proxyToHono } from '@/lib/api';
import { db, users, eq } from '@shipsafe/db';
import Link from 'next/link';
import { DashboardTable } from './dashboard-table';

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
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-gray-400">
        Welcome, {session.user.email}
      </p>

      {scans.length === 0 ? (
        <div className="mt-8 rounded-lg border border-gray-700 bg-gray-800/50 p-8 text-center">
          <p className="text-gray-400">No scans yet.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Run your first scan
          </Link>
        </div>
      ) : (
        <DashboardTable scans={scans} plan={plan} />
      )}
    </main>
  );
}
