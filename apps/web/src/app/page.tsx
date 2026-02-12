import { ScanForm } from '@/components/scan-form';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          Ship <span className="text-green-400">Safe</span>
        </h1>
        <p className="mt-4 text-lg text-gray-400">
          Automated security audit for AI-generated web apps.
          <br />
          Enter your URL, get your score in seconds.
        </p>
        <div className="mt-10">
          <ScanForm />
        </div>
      </div>
    </main>
  );
}
