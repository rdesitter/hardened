'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signIn('resend', { email, callbackUrl: '/dashboard' });
    setSent(true);
  }

  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="mt-2 text-gray-400">
            We sent a magic link to <span className="text-white">{email}</span>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center">Sign in to ShipSafe</h1>
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-500 focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
          />
          <label className="flex items-start gap-3 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-600 bg-gray-800 text-green-500 focus:ring-green-400 focus:ring-offset-0"
            />
            <span>
              I agree to the{' '}
              <a href="/terms" target="_blank" className="text-green-400 hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" target="_blank" className="text-green-400 hover:underline">Privacy Policy</a>
            </span>
          </label>
          <button
            type="submit"
            disabled={!consent}
            className="rounded-lg bg-green-500 px-6 py-3 font-semibold text-gray-950 transition-colors hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send magic link
          </button>
        </form>
      </div>
    </main>
  );
}
