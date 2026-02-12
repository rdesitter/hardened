import type { CheckResult } from '@hardened/db';
import { safeFetch } from '../utils.js';

export async function checkInfoLeakage(url: string): Promise<CheckResult[]> {
  const res = await safeFetch(url, { timeout: 5000, followRedirects: true });
  const results: CheckResult[] = [];

  // 1. Server header
  const server = res.headers.get('server');
  const serverExposed = server !== null && server.length > 0;

  results.push({
    id: 'leak-server',
    category: 'warning',
    group: 'exposure',
    passed: !serverExposed,
    label: 'Server Version Exposed',
    detail: serverExposed
      ? `Server header exposes: ${server}`
      : 'No Server header found (good).',
    fix: serverExposed
      ? `Your server exposes its identity via the Server header: "${server}". This helps attackers fingerprint your stack.\n\nNginx:\n  server_tokens off;\n\nApache:\n  ServerTokens Prod\n  ServerSignature Off\n\nExpress:\n  app.disable('x-powered-by');\n  // Server header is typically set by the reverse proxy, not Express.\n\nCaddy:\n  Does not expose the Server header by default.`
      : null,
  });

  // 2. X-Powered-By header
  const poweredBy = res.headers.get('x-powered-by');
  const poweredByExposed = poweredBy !== null && poweredBy.length > 0;

  results.push({
    id: 'leak-powered-by',
    category: 'warning',
    group: 'exposure',
    passed: !poweredByExposed,
    label: 'X-Powered-By Exposed',
    detail: poweredByExposed
      ? `X-Powered-By header exposes: ${poweredBy}`
      : 'No X-Powered-By header found (good).',
    fix: poweredByExposed
      ? `Your server exposes X-Powered-By: ${poweredBy}. This reveals your tech stack.\n\nExpress:\n  app.disable('x-powered-by');\n\nHono:\n  Not exposed by default.\n\nNext.js (next.config.js):\n  module.exports = {\n    poweredByHeader: false,\n  };`
      : null,
  });

  return results;
}
