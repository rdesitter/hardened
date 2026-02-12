import tls from 'node:tls';
import type { CheckResult } from '@hardened/db';
import { safeFetch } from '../utils.js';

export async function checkHttps(url: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname;

  // 1. HTTPS certificate valid
  try {
    const res = await safeFetch(url.replace(/^http:/, 'https:'));
    // Status in 2xx or 3xx means the TLS handshake succeeded
    results.push({
      id: 'https-valid',
      category: 'critical',
      group: 'transport',
      passed: res.status < 500,
      label: 'HTTPS Certificate Valid',
      detail: 'Valid HTTPS certificate detected.',
      fix: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({
      id: 'https-valid',
      category: 'critical',
      group: 'transport',
      passed: false,
      label: 'HTTPS Certificate Valid',
      detail: `HTTPS connection failed: ${message}`,
      fix: 'Your site does not have a valid HTTPS certificate. Use Let\'s Encrypt (free) or your hosting provider\'s SSL feature to enable HTTPS.',
    });
  }

  // 2. HTTP → HTTPS redirect (follow redirect chain up to 5 hops)
  try {
    const httpUrl = url.replace(/^https:/, 'http:');
    let currentUrl = httpUrl;
    let redirectsToHttps = false;
    let hops = 0;
    const maxHops = 5;

    while (hops < maxHops) {
      const res = await safeFetch(currentUrl, { timeout: 5000 });
      const location = res.headers.get('location');

      if ((res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308) && location) {
        // Resolve relative redirects
        const nextUrl = new URL(location, currentUrl).href;
        if (nextUrl.startsWith('https://')) {
          redirectsToHttps = true;
          break;
        }
        currentUrl = nextUrl;
        hops++;
      } else {
        break;
      }
    }

    results.push({
      id: 'https-redirect',
      category: 'critical',
      group: 'transport',
      passed: redirectsToHttps,
      label: 'HTTP to HTTPS Redirect',
      detail: redirectsToHttps
        ? `HTTP redirects to HTTPS (after ${hops + 1} hop${hops > 0 ? 's' : ''}).`
        : `HTTP does not redirect to HTTPS.`,
      fix: redirectsToHttps
        ? null
        : 'Your site is accessible via HTTP without redirecting to HTTPS.\n\nNginx:\n  server {\n    listen 80;\n    return 301 https://$host$request_uri;\n  }\n\nCaddy:\n  Automatic HTTPS by default.\n\nVercel/Netlify:\n  Handled automatically.',
    });
  } catch {
    results.push({
      id: 'https-redirect',
      category: 'critical',
      group: 'transport',
      passed: true,
      label: 'HTTP to HTTPS Redirect',
      detail: 'HTTP port not reachable (HTTPS-only is fine).',
      fix: null,
    });
  }

  // 3. Certificate expiry
  try {
    const certInfo = await getCertificateExpiry(hostname);
    if (certInfo) {
      const daysLeft = Math.floor(
        (certInfo.validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      const isExpiringSoon = daysLeft < 30;

      if (isExpiringSoon) {
        results.push({
          id: 'https-expiry',
          category: 'warning',
          group: 'transport',
          passed: false,
          label: 'Certificate Expiry',
          detail: `Certificate expires in ${daysLeft} days (${certInfo.validTo.toISOString().split('T')[0]}).`,
          fix: 'Your TLS certificate expires soon. Renew it or enable auto-renewal with Let\'s Encrypt / your hosting provider.',
        });
      }
    }
  } catch {
    // Can't check expiry — not critical, skip silently
  }

  return results;
}

function getCertificateExpiry(
  hostname: string,
): Promise<{ validTo: Date } | null> {
  return new Promise((resolve) => {
    const socket = tls.connect(443, hostname, { servername: hostname }, () => {
      const cert = socket.getPeerCertificate();
      socket.destroy();

      if (cert && cert.valid_to) {
        resolve({ validTo: new Date(cert.valid_to) });
      } else {
        resolve(null);
      }
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(null);
    });

    socket.setTimeout(5000, () => {
      socket.destroy();
      resolve(null);
    });
  });
}
