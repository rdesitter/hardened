'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="flex items-center justify-between px-6 py-4">
      <Link href="/" className="flex items-center text-lg font-bold">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-7 w-7">
          <defs>
            <linearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00c951" stopOpacity="1"/>
              <stop offset="100%" stopColor="#00a040" stopOpacity="1"/>
            </linearGradient>
            <linearGradient id="innerGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00c951" stopOpacity="0.15"/>
              <stop offset="100%" stopColor="#00c951" stopOpacity="0.02"/>
            </linearGradient>
          </defs>
          <circle cx="256" cy="256" r="256" fill="#030712"/>
          <path d="M256 72 L400 136 L400 264 C400 348 336 420 256 448 C176 420 112 348 112 264 L112 136 Z" fill="none" stroke="url(#shieldGrad)" strokeWidth="16" strokeLinejoin="round"/>
          <path d="M256 88 L388 148 L388 264 C388 340 328 408 256 434 C184 408 124 340 124 264 L124 148 Z" fill="url(#innerGlow)"/>
          <line x1="160" y1="248" x2="352" y2="248" stroke="#00c951" strokeWidth="3" strokeOpacity="0.25" strokeDasharray="8 6"/>
          <polyline points="196,256 236,304 316,208" fill="none" stroke="#00c951" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Harden<span className="text-green-400">ed</span>
      </Link>
      <nav className="flex items-center gap-4">
        <Link
          href="/pricing"
          className="text-sm text-gray-400 hover:text-white"
        >
          Pricing
        </Link>
        {status === 'authenticated' ? (
          <>
            <Link
              href="/dashboard"
              className="text-sm text-gray-400 hover:text-white"
            >
              Dashboard
            </Link>
            <Link
              href="/settings"
              className="text-sm text-gray-400 hover:text-white"
            >
              Settings
            </Link>
            <span className="text-sm text-gray-500">{session.user?.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-sm text-gray-400 hover:text-white"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/auth/signin"
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700"
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
