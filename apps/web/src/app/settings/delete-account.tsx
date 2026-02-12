'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/account', { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      // Sign out and redirect to landing with deleted param
      await signOut({ redirectTo: '/?deleted=true' });
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mt-8 rounded-xl border border-red-500/20 bg-red-950/10 p-6">
        <h2 className="font-semibold text-red-400">Danger Zone</h2>
        <p className="mt-2 text-sm text-gray-400">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
        >
          Delete my account
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-red-400">Delete your account</h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              This will permanently delete your account, all your scans, reports, and monitoring
              data. This action cannot be undone. Payment records will be retained for 6 years as
              required by tax law.
            </p>

            <div className="mt-5">
              <label className="text-sm text-gray-400">
                Type <span className="font-mono font-semibold text-white">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="DELETE"
                className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
              />
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setOpen(false);
                  setConfirm('');
                  setError('');
                }}
                disabled={loading}
                className="flex-1 rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={confirm !== 'DELETE' || loading}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete my account permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
