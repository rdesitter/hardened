'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export function CheckoutSuccessModal() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      setVisible(true);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
          <svg className="h-7 w-7 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>

        <h2 className="mt-5 text-xl font-bold text-white">Welcome to Pro!</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-400">
          Your subscription is active. You now have access to:
        </p>

        <ul className="mt-4 space-y-2 text-left text-sm text-gray-300">
          <li className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Detailed fix instructions for every check
          </li>
          <li className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Score history and trend charts
          </li>
          <li className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Weekly automated monitoring with alerts
          </li>
        </ul>

        <button
          onClick={() => setVisible(false)}
          className="mt-6 w-full rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-gray-950 transition-colors hover:bg-green-400"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
