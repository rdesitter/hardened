import dns from 'node:dns/promises';
import type { CheckResult } from '@shipsafe/db';

export async function checkDns(url: string): Promise<CheckResult[]> {
  const domain = new URL(url).hostname;
  const results: CheckResult[] = [];

  // 1. SPF record
  let spfFound = false;
  let spfDetail = '';
  try {
    const records = await dns.resolveTxt(domain);
    const spfRecord = records.flat().find((r) => r.startsWith('v=spf1'));
    spfFound = !!spfRecord;
    spfDetail = spfFound
      ? `SPF record found: ${spfRecord}`
      : 'No SPF record found.';
  } catch {
    spfDetail = 'Could not resolve TXT records for SPF.';
  }

  results.push({
    id: 'dns-spf',
    category: 'warning',
    group: 'dns',
    passed: spfFound,
    label: 'SPF Record',
    detail: spfDetail,
    fix: spfFound
      ? null
      : `No SPF record found for ${domain}. Without SPF, attackers can send emails pretending to be from your domain.\n\nAdd a TXT record to your DNS:\n  Name: @\n  Value: v=spf1 include:_spf.google.com ~all\n\nReplace the include with your email provider (e.g., Resend, SendGrid, Mailgun).\n\nExample for Resend:\n  v=spf1 include:amazonses.com ~all`,
  });

  // 2. DMARC record
  let dmarcFound = false;
  let dmarcDetail = '';
  try {
    const records = await dns.resolveTxt(`_dmarc.${domain}`);
    const dmarcRecord = records.flat().find((r) => r.startsWith('v=DMARC1'));
    dmarcFound = !!dmarcRecord;
    dmarcDetail = dmarcFound
      ? `DMARC record found: ${dmarcRecord}`
      : 'No DMARC record found.';
  } catch {
    dmarcDetail = 'No DMARC record found.';
    dmarcFound = false;
  }

  results.push({
    id: 'dns-dmarc',
    category: 'warning',
    group: 'dns',
    passed: dmarcFound,
    label: 'DMARC Record',
    detail: dmarcDetail,
    fix: dmarcFound
      ? null
      : `No DMARC record found for ${domain}. DMARC tells email servers how to handle messages that fail SPF/DKIM.\n\nAdd a TXT record to your DNS:\n  Name: _dmarc\n  Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}\n\nStart with p=none for monitoring, then move to p=quarantine or p=reject.`,
  });

  return results;
}
