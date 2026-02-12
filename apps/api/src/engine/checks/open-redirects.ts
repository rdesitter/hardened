import type { CheckResult } from '@shipsafe/db';
import { safeFetch } from '../utils.js';

const REDIRECT_PARAMS = ['redirect', 'next', 'url', 'return', 'returnTo', 'redirect_uri', 'continue'];
const EVIL_URL = 'https://evil.com';

export async function checkOpenRedirects(url: string): Promise<CheckResult[]> {
  let vulnerable = false;
  let vulnerableParam = '';

  for (const param of REDIRECT_PARAMS) {
    try {
      const testUrl = `${url}${url.includes('?') ? '&' : '?'}${param}=${encodeURIComponent(EVIL_URL)}`;
      const res = await safeFetch(testUrl, { timeout: 5000 });
      const location = res.headers.get('location');

      if (
        (res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308) &&
        location &&
        location.startsWith(EVIL_URL)
      ) {
        vulnerable = true;
        vulnerableParam = param;
        break;
      }
    } catch {
      // Timeout or network error — skip this param
    }
  }

  return [
    {
      id: 'open-redirect',
      category: 'warning',
      group: 'exposure',
      passed: !vulnerable,
      label: 'Open Redirect',
      detail: vulnerable
        ? `Open redirect found via ?${vulnerableParam}= parameter — server redirects to arbitrary URLs.`
        : 'No open redirect detected via common redirect parameters.',
      fix: vulnerable
        ? `Your server follows the ?${vulnerableParam}= parameter to redirect to external URLs. Attackers can use this for phishing.\n\nExpress/Hono:\n  // Validate redirect URLs against an allowlist\n  const allowedHosts = ['yourdomain.com'];\n  const target = new URL(req.query.${vulnerableParam}, 'https://yourdomain.com');\n  if (!allowedHosts.includes(target.hostname)) {\n    return res.redirect('/');\n  }\n  return res.redirect(target.href);\n\nNext.js:\n  // In your redirect handler, validate the destination:\n  const url = new URL(destination, request.url);\n  if (url.origin !== request.nextUrl.origin) {\n    return NextResponse.redirect(new URL('/', request.url));\n  }`
        : null,
    },
  ];
}
