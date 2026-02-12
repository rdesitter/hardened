import type { CheckResult } from '@hardened/db';
import { safeFetch } from '../utils.js';

interface HeaderCheck {
  id: string;
  header: string;
  category: 'critical' | 'warning' | 'info';
  label: string;
  fix: string;
}

const HEADER_CHECKS: HeaderCheck[] = [
  {
    id: 'hsts',
    header: 'strict-transport-security',
    category: 'critical',
    label: 'Strict-Transport-Security (HSTS)',
    fix: `No HSTS header found. Browsers can be tricked into using HTTP.\n\nNext.js (next.config.js):\n  headers: [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]\n\nNginx:\n  add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;\n\nExpress/Hono:\n  Use the 'helmet' package.`,
  },
  {
    id: 'csp',
    header: 'content-security-policy',
    category: 'critical',
    label: 'Content-Security-Policy (CSP)',
    fix: `No CSP header found. Your app is vulnerable to XSS attacks.\n\nNext.js (middleware.ts):\n  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");\n\nExpress/Hono:\n  Use the 'helmet' package:\n  import helmet from 'helmet';\n  app.use(helmet());`,
  },
  {
    id: 'x-frame',
    header: 'x-frame-options',
    category: 'warning',
    label: 'X-Frame-Options',
    fix: `No X-Frame-Options header. Your site can be embedded in iframes (clickjacking risk).\n\nAdd header: X-Frame-Options: DENY\nOr use CSP: frame-ancestors 'none';`,
  },
  {
    id: 'x-content-type',
    header: 'x-content-type-options',
    category: 'warning',
    label: 'X-Content-Type-Options',
    fix: `No X-Content-Type-Options header. Browsers may MIME-sniff responses.\n\nAdd header: X-Content-Type-Options: nosniff`,
  },
  {
    id: 'referrer-policy',
    header: 'referrer-policy',
    category: 'info',
    label: 'Referrer-Policy',
    fix: `No Referrer-Policy header. The browser may send full URLs in the Referer header.\n\nAdd header: Referrer-Policy: strict-origin-when-cross-origin`,
  },
  {
    id: 'permissions-policy',
    header: 'permissions-policy',
    category: 'info',
    label: 'Permissions-Policy',
    fix: `No Permissions-Policy header. Browser APIs like camera, microphone, geolocation are unrestricted.\n\nAdd header: Permissions-Policy: camera=(), microphone=(), geolocation=()`,
  },
];

export async function checkSecurityHeaders(url: string): Promise<CheckResult[]> {
  const res = await safeFetch(url, { followRedirects: true });

  return HEADER_CHECKS.map((check) => {
    const value = res.headers.get(check.header);
    const passed = value !== null && value.length > 0;

    return {
      id: check.id,
      category: check.category,
      group: 'headers',
      passed,
      label: check.label,
      detail: passed
        ? `${check.label}: ${value}`
        : `Missing ${check.header} header.`,
      fix: passed ? null : check.fix,
    };
  });
}
