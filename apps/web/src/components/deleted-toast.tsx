'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export function DeletedToast() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get('deleted') === 'true') {
      setVisible(true);
      // Clean the URL
      window.history.replaceState({}, '', '/');
      const timer = setTimeout(() => setVisible(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-gray-900 px-5 py-3 shadow-2xl">
        <svg className="h-5 w-5 shrink-0 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <p className="text-sm text-gray-300">
          Your account has been deleted. All your data has been removed.
        </p>
        <button onClick={() => setVisible(false)} className="ml-2 text-gray-500 hover:text-gray-300">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
