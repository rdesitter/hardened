'use client';

import { useState } from 'react';

export function ScanForm() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(
    'idle',
  );
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;

    setStatus('loading');
    setResult(null);

    try {
      const res = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setResult(data.error ?? 'Something went wrong');
        return;
      }

      setStatus('done');
      setResult(`Scan created: ${data.id} (status: ${data.status})`);
    } catch {
      setStatus('error');
      setResult('Failed to reach the API');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-app.com"
          required
          className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-500 focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-lg bg-green-500 px-6 py-3 font-semibold text-gray-950 transition-colors hover:bg-green-400 disabled:opacity-50"
        >
          {status === 'loading' ? 'Scanning...' : 'Scan'}
        </button>
      </div>
      {result && (
        <p
          className={`text-sm ${status === 'error' ? 'text-red-400' : 'text-green-400'}`}
        >
          {result}
        </p>
      )}
    </form>
  );
}
