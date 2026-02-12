import type { CheckResult } from '@hardened/db';
import { safeFetch } from '../utils.js';

const HTTP_RESOURCE_REGEX =
  /(?:src|href|action)\s*=\s*["']http:\/\/[^"']+["']/gi;

export async function checkMixedContent(url: string): Promise<CheckResult[]> {
  // Only relevant for HTTPS pages
  if (!url.startsWith('https://')) {
    return [
      {
        id: 'mixed-content',
        category: 'warning',
        group: 'transport',
        passed: true,
        label: 'Mixed Content',
        detail: 'Site is not served over HTTPS — mixed content check not applicable.',
        fix: null,
      },
    ];
  }

  const res = await safeFetch(url, { timeout: 5000, followRedirects: true });
  const html = await res.text();

  const matches = html.match(HTTP_RESOURCE_REGEX) ?? [];

  // Filter out harmless matches (e.g., http://www.w3.org, http://schema.org)
  const harmless = ['http://www.w3.org', 'http://schema.org', 'http://xmlns'];
  const realMatches = matches.filter(
    (m) => !harmless.some((h) => m.includes(h)),
  );

  const hasMixed = realMatches.length > 0;

  return [
    {
      id: 'mixed-content',
      category: 'warning',
      group: 'transport',
      passed: !hasMixed,
      label: 'Mixed Content',
      detail: hasMixed
        ? `Found ${realMatches.length} HTTP resource(s) on an HTTPS page: ${realMatches.slice(0, 3).join(', ')}${realMatches.length > 3 ? '...' : ''}`
        : 'No HTTP resources found on the HTTPS page.',
      fix: hasMixed
        ? `Your HTTPS page loads resources over HTTP, which browsers may block or warn about.\n\nFix: Replace http:// with https:// in all resource URLs, or use protocol-relative URLs (//example.com/...).\n\nNext.js:\n  Ensure all <Image>, <Script>, and <Link> components use HTTPS URLs.\n\nGeneral:\n  Search your codebase for http:// and replace with https://.\n  Add <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests"> as a fallback.`
        : null,
    },
  ];
}
