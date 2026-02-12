import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, users, eq } from '@hardened/db';
import { createPortalSession } from '@/lib/stripe';

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user] = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account' }, { status: 400 });
  }

  const portal = await createPortalSession(user.stripeCustomerId);

  return NextResponse.json({ url: portal.url });
}
