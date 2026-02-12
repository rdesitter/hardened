import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-gray-400">
        Welcome, {session.user.email}
      </p>
      <p className="mt-1 text-sm text-gray-500">
        Your scan history will appear here.
      </p>
    </main>
  );
}
