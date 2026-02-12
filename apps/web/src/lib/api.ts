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

  return fetch(url, {
    ...init,
    headers,
  });
}
