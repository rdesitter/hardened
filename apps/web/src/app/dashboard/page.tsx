import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { proxyToHono } from '@/lib/api';
import Link from 'next/link';

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

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const scans = await getUserScans();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
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
        <div className="mt-8 overflow-hidden rounded-lg border border-gray-700">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-700 bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-300">URL</th>
                <th className="px-4 py-3 font-medium text-gray-300">Score</th>
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
      )}
    </main>
  );
}
