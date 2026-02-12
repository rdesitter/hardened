import tls from 'node:tls';
import type { CheckResult } from '@shipsafe/db';

const WEAK_CIPHERS = [
  'RC4', 'DES', '3DES', 'MD5', 'NULL', 'EXPORT', 'anon',
];

export async function checkTls(url: string): Promise<CheckResult[]> {
  const hostname = new URL(url).hostname;
  const results: CheckResult[] = [];

  const info = await getTlsInfo(hostname);

  // 1. TLS version
  if (info) {
    const protocol = info.protocol; // e.g. "TLSv1.3", "TLSv1.2"
    const isModern = protocol === 'TLSv1.3' || protocol === 'TLSv1.2';

    results.push({
      id: 'tls-version',
      category: 'critical',
      group: 'transport',
      passed: isModern,
      label: 'TLS Version',
      detail: isModern
        ? `Using ${protocol} (modern).`
        : `Using ${protocol} — outdated and insecure.`,
      fix: isModern
        ? null
        : `Your server uses ${protocol}, which is outdated and vulnerable.\n\nNginx:\n  ssl_protocols TLSv1.2 TLSv1.3;\n\nApache:\n  SSLProtocol -all +TLSv1.2 +TLSv1.3\n\nNode.js:\n  tls.createServer({ minVersion: 'TLSv1.2' })\n\nMost modern hosting (Vercel, Railway, Fly.io) handles this automatically.`,
    });

    // 2. Cipher suite strength
    const cipher = info.cipher;
    const isWeak = WEAK_CIPHERS.some((w) =>
      cipher.name.toUpperCase().includes(w),
    );

    results.push({
      id: 'tls-cipher',
      category: 'warning',
      group: 'transport',
      passed: !isWeak,
      label: 'Cipher Suite Strength',
      detail: isWeak
        ? `Weak cipher suite: ${cipher.name}`
        : `Strong cipher suite: ${cipher.name}`,
      fix: isWeak
        ? `Your server uses a weak cipher suite: ${cipher.name}.\n\nNginx:\n  ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';\n  ssl_prefer_server_ciphers on;\n\nUse Mozilla SSL Configuration Generator:\n  https://ssl-config.mozilla.org/`
        : null,
    });
  } else {
    results.push({
      id: 'tls-version',
      category: 'critical',
      group: 'transport',
      passed: false,
      label: 'TLS Version',
      detail: 'Could not establish a TLS connection.',
      fix: 'Your server does not accept TLS connections on port 443. Ensure HTTPS is properly configured.',
    });
  }

  return results;
}

interface TlsInfo {
  protocol: string;
  cipher: { name: string; version: string };
}

function getTlsInfo(hostname: string): Promise<TlsInfo | null> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      443,
      hostname,
      { servername: hostname, timeout: 5000 },
      () => {
        const protocol = socket.getProtocol() ?? 'unknown';
        const cipher = socket.getCipher() ?? { name: 'unknown', version: 'unknown' };
        socket.destroy();
        resolve({ protocol, cipher: { name: cipher.name, version: cipher.version } });
      },
    );

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
