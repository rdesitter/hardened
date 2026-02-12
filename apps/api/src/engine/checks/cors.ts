import type { CheckResult } from '@shipsafe/db';
import { safeFetch } from '../utils.js';

export async function checkCors(url: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  const res = await safeFetch(url, {
    timeout: 5000,
    followRedirects: true,
    method: 'OPTIONS',
    headers: {
      Origin: 'https://evil.com',
      'Access-Control-Request-Method': 'GET',
    },
  });

  const acao = res.headers.get('access-control-allow-origin');
  const acac = res.headers.get('access-control-allow-credentials');

  // 1. Wildcard origin
  const isWildcard = acao === '*';
  results.push({
    id: 'cors-wildcard',
    category: 'warning',
    group: 'cors',
    passed: !isWildcard,
    label: 'CORS Wildcard Origin',
    detail: isWildcard
      ? 'Access-Control-Allow-Origin is set to * (any origin can make requests).'
      : acao
        ? `CORS origin restricted to: ${acao}`
        : 'No Access-Control-Allow-Origin header (CORS not enabled).',
    fix: isWildcard
      ? `Your server allows requests from any origin.\n\nExpress:\n  const cors = require('cors');\n  app.use(cors({ origin: 'https://yourdomain.com' }));\n\nHono:\n  import { cors } from 'hono/cors';\n  app.use(cors({ origin: 'https://yourdomain.com' }));\n\nNext.js (route handler):\n  Set the Access-Control-Allow-Origin header to your specific domain.`
      : null,
  });

  // 2. Credentials with wildcard
  const credentialsWithWildcard = isWildcard && acac === 'true';
  // Also check if the server reflects the evil origin back with credentials
  const reflectsOriginWithCreds = acao === 'https://evil.com' && acac === 'true';
  const isCritical = credentialsWithWildcard || reflectsOriginWithCreds;

  results.push({
    id: 'cors-credentials-wildcard',
    category: 'critical',
    group: 'cors',
    passed: !isCritical,
    label: 'CORS Credentials with Wildcard',
    detail: isCritical
      ? 'CORS allows credentials with a permissive origin — any site can send authenticated requests.'
      : 'CORS credentials are not combined with a wildcard or reflected origin.',
    fix: isCritical
      ? `Your server allows credentials with a permissive origin. This lets any website make authenticated requests on behalf of your users.\n\nExpress:\n  app.use(cors({\n    origin: 'https://yourdomain.com',\n    credentials: true\n  }));\n\nHono:\n  app.use(cors({\n    origin: 'https://yourdomain.com',\n    credentials: true\n  }));\n\nNever use Access-Control-Allow-Origin: * with Access-Control-Allow-Credentials: true.`
      : null,
  });

  return results;
}
