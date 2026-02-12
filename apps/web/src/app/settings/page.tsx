import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db, users, eq } from '@hardened/db';
import { PortalButton } from './portal-button';
import { DeleteAccount } from './delete-account';

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const userId = session.user.id;

  const [user] = await db
    .select({ plan: users.plan, stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="mt-8 rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="font-semibold">Account</h2>
        <p className="mt-2 text-sm text-gray-400">{session.user.email}</p>
      </div>

      <div className="mt-4 rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="font-semibold">Plan</h2>
        <p className="mt-2 text-sm text-gray-400">
          Current plan:{' '}
          <span className="font-medium text-white">
            {user?.plan === 'pro' ? 'Pro' : 'Free'}
          </span>
        </p>

        <div className="mt-4">
          {user?.stripeCustomerId ? (
            <PortalButton />
          ) : (
            <a
              href="/pricing"
              className="inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500"
            >
              Upgrade to Pro
            </a>
          )}
        </div>
      </div>

      <DeleteAccount />
    </main>
  );
}
