import type { CheckResult } from '@hardened/db';
import { safeFetch } from '../utils.js';

interface PathCheck {
  path: string;
  id: string;
  category: 'critical' | 'warning' | 'info';
  label: string;
  positive?: boolean; // true = existence is GOOD (e.g. security.txt)
  contentMatch?: RegExp; // extra validation on response body
  fix: string;
}

const PATHS_TO_CHECK: PathCheck[] = [
  {
    path: '/.env',
    id: 'exposed-env',
    category: 'critical',
    label: '.env File Exposed',
    contentMatch: /[A-Z_]+=.*/,
    fix: 'Your .env file is publicly accessible! It may contain secrets (API keys, DB passwords).\n\nNginx:\n  location ~ /\\.env { deny all; }\n\nApache (.htaccess):\n  <Files .env>\n    Deny from all\n  </Files>\n\nVercel/Netlify: .env files are not served by default — check your custom config.',
  },
  {
    path: '/.git/config',
    id: 'exposed-git',
    category: 'critical',
    label: '.git Directory Exposed',
    contentMatch: /\[core\]/,
    fix: 'Your .git directory is publicly accessible! Attackers can download your entire source code.\n\nNginx:\n  location ~ /\\.git { deny all; }\n\nApache (.htaccess):\n  RedirectMatch 404 /\\.git',
  },
  {
    path: '/debug',
    id: 'exposed-debug',
    category: 'warning',
    label: 'Debug Endpoint Exposed',
    fix: 'A debug endpoint is publicly accessible. Remove or protect it behind authentication in production.',
  },
  {
    path: '/graphql',
    id: 'exposed-graphql',
    category: 'warning',
    label: 'GraphQL Endpoint Exposed',
    fix: 'Your GraphQL endpoint is publicly accessible. Consider adding authentication or disabling introspection in production.\n\nApollo Server:\n  introspection: process.env.NODE_ENV !== "production"',
  },
  {
    path: '/.well-known/security.txt',
    id: 'security-txt',
    category: 'info',
    label: 'security.txt Present',
    positive: true,
    fix: 'No security.txt found. Adding one helps security researchers contact you responsibly.\n\nCreate /.well-known/security.txt with:\n  Contact: mailto:security@yourdomain.com\n  Preferred-Languages: en\n\nSee https://securitytxt.org/',
  },
];

export async function checkExposedPaths(url: string): Promise<CheckResult[]> {
  const baseUrl = url.replace(/\/+$/, '');

  const results = await Promise.all(
    PATHS_TO_CHECK.map(async (check) => {
      try {
        const res = await safeFetch(`${baseUrl}${check.path}`, { timeout: 5000, followRedirects: true });
        const isAccessible = res.status >= 200 && res.status < 300;

        // For content-matched checks, verify body too (avoid false positives on custom 200 pages)
        let confirmed = isAccessible;
        if (isAccessible && check.contentMatch) {
          const text = await res.text();
          confirmed = check.contentMatch.test(text);
        }

        if (check.positive) {
          // Positive check: existence is GOOD
          return {
            id: check.id,
            category: check.category,
            group: 'exposure',
            passed: confirmed,
            label: check.label,
            detail: confirmed
              ? `${check.path} is present.`
              : `${check.path} not found.`,
            fix: confirmed ? null : check.fix,
          } satisfies CheckResult;
        }

        // Negative check: existence is BAD
        return {
          id: check.id,
          category: check.category,
          group: 'exposure',
          passed: !confirmed,
          label: check.label,
          detail: confirmed
            ? `${check.path} is publicly accessible!`
            : `${check.path} is not accessible (${res.status}).`,
          fix: confirmed ? check.fix : null,
        } satisfies CheckResult;
      } catch {
        // Fetch failed (timeout, DNS error) — path is not accessible
        if (check.positive) {
          return {
            id: check.id,
            category: check.category,
            group: 'exposure',
            passed: false,
            label: check.label,
            detail: `Could not reach ${check.path}.`,
            fix: check.fix,
          } satisfies CheckResult;
        }
        return {
          id: check.id,
          category: check.category,
          group: 'exposure',
          passed: true,
          label: check.label,
          detail: `${check.path} is not accessible.`,
          fix: null,
        } satisfies CheckResult;
      }
    }),
  );

  return results;
}
