'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="flex items-center justify-between px-6 py-4">
      <Link href="/" className="text-lg font-bold">
        Ship<span className="text-green-400">Safe</span>
      </Link>
      <nav className="flex items-center gap-4">
        {status === 'authenticated' ? (
          <>
            <Link
              href="/dashboard"
              className="text-sm text-gray-400 hover:text-white"
            >
              Dashboard
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
