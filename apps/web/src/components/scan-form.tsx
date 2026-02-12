'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ScanForm() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;

    setStatus('loading');
    setError(null);

    try {
      const res = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setError(data.error ?? 'Something went wrong');
        return;
      }

      router.push(`/scan/${data.id}`);
    } catch {
      setStatus('error');
      setError('Failed to reach the API');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-app.com"
          required
          className="flex-1 rounded-xl border border-gray-700 bg-gray-900 px-4 py-3.5 text-white placeholder-gray-500 transition-colors focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-xl bg-green-500 px-8 py-3.5 font-semibold text-gray-950 transition-all hover:bg-green-400 disabled:opacity-50"
        >
          {status === 'loading' ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-950 border-t-transparent" />
              Scanning...
            </span>
          ) : (
            'Scan now'
          )}
        </button>
      </div>
      {error && <p className="text-center text-sm text-red-400">{error}</p>}
    </form>
  );
}
