import type { CheckResult } from '@shipsafe/db';

const DEFAULT_TIMEOUT = 10_000;

export async function safeFetch(
  url: string,
  init?: RequestInit & { timeout?: number; followRedirects?: boolean },
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, followRedirects = false, ...fetchInit } = init ?? {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, {
      ...fetchInit,
      signal: controller.signal,
      redirect: followRedirects ? 'follow' : 'manual',
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function safeCheck(
  fn: () => Promise<CheckResult[]>,
): Promise<CheckResult[]> {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return [
      {
        id: 'check-error',
        category: 'info',
        group: 'system',
        passed: true,
        label: 'Check Error',
        detail: `Could not complete this check: ${message}`,
        fix: null,
      },
    ];
  }
}
