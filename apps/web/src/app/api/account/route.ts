import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, users, eq } from '@shipsafe/db';
import { getStripe } from '@/lib/stripe';
import { proxyToHono } from '@/lib/api';

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Check if user has an active Stripe subscription
  const [user] = await db
    .select({
      stripeSubscriptionId: users.stripeSubscriptionId,
      stripeCustomerId: users.stripeCustomerId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.stripeSubscriptionId) {
    try {
      await getStripe().subscriptions.cancel(user.stripeSubscriptionId, {
        prorate: true,
      });
    } catch (err) {
      console.error('[ACCOUNT_DELETE] Stripe cancellation failed:', err);
      return NextResponse.json(
        {
          error:
            'Failed to cancel your subscription. Please resolve any payment issues before deleting your account, or contact support@shipsafe.app.',
        },
        { status: 502 },
      );
    }
  }

  // Delete data via Hono
  const res = await proxyToHono('/api/account', { method: 'DELETE' });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: (body as { error?: string }).error ?? 'Deletion failed' },
      { status: res.status },
    );
  }

  return NextResponse.json({ status: 'deleted' });
}
