import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { Header } from '@/components/header';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hardened — Security Audit for AI-Generated Apps',
  description:
    'Automated security scanning for web apps built with AI. Get your security score in seconds.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-white antialiased">
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
