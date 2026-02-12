'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

export default function PricingPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Pricing</h1>
        <p className="mt-3 text-gray-400">
          Find vulnerabilities for free. Fix them with Pro.
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {/* Free plan */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8">
          <h2 className="text-xl font-bold">Free</h2>
          <p className="mt-1 text-3xl font-bold">
            $0<span className="text-base font-normal text-gray-500">/month</span>
          </p>
          <ul className="mt-6 space-y-3 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              Full security scan with score
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              All checks visible (pass/fail)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              Shareable report URL
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-600">✗</span>
              <span className="text-gray-600">Copy-paste fixes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-600">✗</span>
              <span className="text-gray-600">Weekly monitoring</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-600">✗</span>
              <span className="text-gray-600">Email alerts</span>
            </li>
          </ul>
          <div className="mt-8">
            <Link
              href="/"
              className="block w-full rounded-lg border border-gray-700 py-2.5 text-center text-sm font-medium text-white hover:bg-gray-800"
            >
              Scan for free
            </Link>
          </div>
        </div>

        {/* Pro plan */}
        <div className="rounded-xl border border-green-800 bg-gray-900 p-8 ring-1 ring-green-800">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">Pro</h2>
            <span className="rounded-full bg-green-900 px-2.5 py-0.5 text-xs font-medium text-green-400">
              Popular
            </span>
          </div>
          <p className="mt-1 text-3xl font-bold">
            $9<span className="text-base font-normal text-gray-500">/month</span>
          </p>
          <ul className="mt-6 space-y-3 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              Everything in Free
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              Copy-paste fixes for every failed check
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              Weekly automated monitoring
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              Email alerts on regressions
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              Score history
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              50 scans/hour
            </li>
          </ul>
          <div className="mt-8">
            {session ? (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="block w-full rounded-lg bg-green-600 py-2.5 text-center text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50"
              >
                {loading ? 'Redirecting...' : 'Upgrade to Pro'}
              </button>
            ) : (
              <Link
                href="/auth/signin"
                className="block w-full rounded-lg bg-green-600 py-2.5 text-center text-sm font-medium text-white hover:bg-green-500"
              >
                Sign in to upgrade
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
