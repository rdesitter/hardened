import { auth } from '@/lib/auth';
import { db, users, eq } from '@hardened/db';

const HONO_API_URL = process.env.HONO_API_URL ?? 'http://api:4000';
const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN ?? '';

export async function proxyToHono(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = `${HONO_API_URL}${path}`;

  const headers = new Headers(init?.headers);
  headers.set('X-Internal-Token', INTERNAL_API_TOKEN);
  headers.set('Content-Type', 'application/json');

  // Inject user info when authenticated
  const session = await auth();
  if (session?.user?.id) {
    headers.set('X-User-Id', session.user.id);

    // Fetch plan from DB
    const [user] = await db
      .select({ plan: users.plan })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    headers.set('X-User-Plan', user?.plan ?? 'free');
  }

  return fetch(url, {
    ...init,
    headers,
  });
}
