import type { CheckResult } from '@hardened/db';
import { safeFetch } from '../utils.js';

export async function checkCookies(url: string): Promise<CheckResult[]> {
  const res = await safeFetch(url, { timeout: 5000, followRedirects: true });
  const setCookieHeaders = res.headers.getSetCookie();

  if (!setCookieHeaders || setCookieHeaders.length === 0) {
    return [
      {
        id: 'cookies-secure',
        category: 'critical',
        group: 'cookies',
        passed: true,
        label: 'Cookie Secure Flag',
        detail: 'No cookies detected.',
        fix: null,
      },
      {
        id: 'cookies-httponly',
        category: 'critical',
        group: 'cookies',
        passed: true,
        label: 'Cookie HttpOnly Flag',
        detail: 'No cookies detected.',
        fix: null,
      },
      {
        id: 'cookies-samesite',
        category: 'warning',
        group: 'cookies',
        passed: true,
        label: 'Cookie SameSite Flag',
        detail: 'No cookies detected.',
        fix: null,
      },
    ];
  }

  let missingSecure = false;
  let missingHttpOnly = false;
  let missingSameSite = false;

  for (const cookie of setCookieHeaders) {
    const lower = cookie.toLowerCase();
    if (!lower.includes('secure')) missingSecure = true;
    if (!lower.includes('httponly')) missingHttpOnly = true;
    if (!lower.includes('samesite')) missingSameSite = true;
  }

  const cookieCount = setCookieHeaders.length;

  return [
    {
      id: 'cookies-secure',
      category: 'critical',
      group: 'cookies',
      passed: !missingSecure,
      label: 'Cookie Secure Flag',
      detail: missingSecure
        ? `${cookieCount} cookie(s) found — some are missing the Secure flag.`
        : `All ${cookieCount} cookie(s) have the Secure flag.`,
      fix: missingSecure
        ? `Some cookies are missing the Secure flag. They can be sent over unencrypted HTTP.\n\nExpress:\n  res.cookie('name', 'value', { secure: true, httpOnly: true, sameSite: 'lax' });\n\nHono:\n  setCookie(c, 'name', 'value', { secure: true, httpOnly: true, sameSite: 'Lax' });\n\nNext.js (API route):\n  response.cookies.set('name', 'value', { secure: true, httpOnly: true, sameSite: 'lax' });`
        : null,
    },
    {
      id: 'cookies-httponly',
      category: 'critical',
      group: 'cookies',
      passed: !missingHttpOnly,
      label: 'Cookie HttpOnly Flag',
      detail: missingHttpOnly
        ? `${cookieCount} cookie(s) found — some are missing the HttpOnly flag.`
        : `All ${cookieCount} cookie(s) have the HttpOnly flag.`,
      fix: missingHttpOnly
        ? `Some cookies are missing the HttpOnly flag. JavaScript can access them via document.cookie (XSS risk).\n\nExpress:\n  res.cookie('name', 'value', { httpOnly: true, secure: true, sameSite: 'lax' });\n\nHono:\n  setCookie(c, 'name', 'value', { httpOnly: true, secure: true, sameSite: 'Lax' });\n\nNext.js (API route):\n  response.cookies.set('name', 'value', { httpOnly: true, secure: true, sameSite: 'lax' });`
        : null,
    },
    {
      id: 'cookies-samesite',
      category: 'warning',
      group: 'cookies',
      passed: !missingSameSite,
      label: 'Cookie SameSite Flag',
      detail: missingSameSite
        ? `${cookieCount} cookie(s) found — some are missing the SameSite flag.`
        : `All ${cookieCount} cookie(s) have the SameSite flag.`,
      fix: missingSameSite
        ? `Some cookies are missing the SameSite attribute. They may be sent in cross-site requests (CSRF risk).\n\nExpress:\n  res.cookie('name', 'value', { sameSite: 'lax', secure: true, httpOnly: true });\n\nHono:\n  setCookie(c, 'name', 'value', { sameSite: 'Lax', secure: true, httpOnly: true });\n\nNext.js (API route):\n  response.cookies.set('name', 'value', { sameSite: 'lax', secure: true, httpOnly: true });`
        : null,
    },
  ];
}
