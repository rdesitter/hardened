import { Suspense } from 'react';
import { ScanForm } from '@/components/scan-form';
import { DeletedToast } from '@/components/deleted-toast';

const BENEFITS = [
  {
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    title: 'Security Score',
    desc: 'Get a 0-100 score covering HTTPS, headers, CORS, cookies, DNS, TLS, and more.',
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.049.58.025 1.193-.14 1.743" />
      </svg>
    ),
    title: 'Detailed Fixes',
    desc: 'Copy-paste code snippets for Next.js, Express, and Hono to fix every issue.',
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    title: 'Weekly Monitoring',
    desc: 'Pro users get automatic weekly re-scans with email alerts on regressions.',
  },
];

const SAMPLE_CHECKS = [
  { passed: true, label: 'HTTPS Certificate', category: 'critical', detail: 'Valid certificate, expires in 84 days' },
  { passed: true, label: 'TLS Version', category: 'critical', detail: 'Using TLSv1.3 (modern).' },
  { passed: false, label: 'Content Security Policy', category: 'critical', detail: 'No CSP header found.' },
  { passed: false, label: 'HSTS', category: 'critical', detail: 'Strict-Transport-Security header missing.' },
  { passed: true, label: 'X-Frame-Options', category: 'warning', detail: 'X-Frame-Options: SAMEORIGIN' },
  { passed: false, label: 'Referrer-Policy', category: 'warning', detail: 'No Referrer-Policy header found.' },
  { passed: true, label: 'SPF Record', category: 'warning', detail: 'SPF record found: v=spf1 include:...' },
  { passed: true, label: 'CORS', category: 'warning', detail: 'No wildcard Access-Control-Allow-Origin.' },
];

function categoryColor(category: string): string {
  if (category === 'critical') return 'text-red-400';
  if (category === 'warning') return 'text-yellow-400';
  return 'text-blue-400';
}

export default function HomePage() {
  return (
    <>
      <Suspense>
        <DeletedToast />
      </Suspense>

      {/* Hero */}
      <section className="flex flex-col items-center px-4 pb-24 pt-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/5 px-4 py-1.5 text-sm text-green-400">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
          Free security audit — no signup required
        </div>
        <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
          Is your AI-built app{' '}
          <span className="text-green-400">secure</span>?
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-gray-400">
          Find out in 15 seconds. Get a detailed security score with
          copy-paste fixes for every vulnerability. Free.
        </p>
        <div className="mt-10 w-full max-w-lg">
          <ScanForm />
        </div>
        <p className="mt-4 text-xs text-gray-600">
          26 checks across HTTPS, headers, CORS, cookies, DNS, TLS, and more
        </p>
      </section>

      {/* Benefits */}
      <section className="border-t border-gray-800/50 bg-gray-900/30 px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold">
            Everything you need to ship with confidence
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gray-800 text-green-400">
                  {b.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Report */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold">
            See what you get
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Example scan result for a typical AI-generated app
          </p>
          <div className="mt-10 rounded-2xl border border-gray-800 bg-gray-900/80 p-6">
            {/* Score */}
            <div className="mb-6 flex items-center gap-4">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="2.5" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke="#facc15" strokeWidth="2.5"
                    strokeDasharray={`${62 * (Math.PI * 2 * 15.9) / 100}, ${Math.PI * 2 * 15.9}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xl font-bold text-yellow-400">62</span>
              </div>
              <div>
                <p className="text-lg font-semibold">example-app.vercel.app</p>
                <p className="text-sm text-gray-400">5 passed, 3 failed — scanned in 1.2s</p>
              </div>
            </div>
            {/* Checks */}
            <div className="space-y-1.5">
              {SAMPLE_CHECKS.map((c) => (
                <div
                  key={c.label}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
                >
                  <span className={c.passed ? 'text-green-400' : 'text-red-400'}>
                    {c.passed ? '✓' : '✗'}
                  </span>
                  <span className="flex-1 text-gray-300">{c.label}</span>
                  <span className={`text-xs ${categoryColor(c.category)}`}>
                    {c.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 px-4 py-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between text-xs text-gray-500">
          <p>ShipSafe — Security audit for AI-generated apps</p>
          <div className="flex gap-4">
            <a href="/pricing" className="hover:text-gray-300">Pricing</a>
            <a href="/privacy" className="hover:text-gray-300">Privacy</a>
            <a href="/terms" className="hover:text-gray-300">Terms</a>
            <a href="/legal" className="hover:text-gray-300">Legal</a>
            <a href="/cookies" className="hover:text-gray-300">Cookies</a>
          </div>
        </div>
      </footer>
    </>
  );
}
