import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy — ShipSafe',
  description: 'How ShipSafe uses cookies and how to manage them.',
};

const PROSE = [
  'prose prose-lg prose-invert prose-gray max-w-none',
  'prose-headings:scroll-mt-24',
  'prose-h2:mt-16 prose-h2:border-b prose-h2:border-gray-800/60 prose-h2:pb-4',
  'prose-p:leading-relaxed prose-p:text-gray-300',
  'prose-li:text-gray-300 prose-li:leading-relaxed',
  'prose-a:text-green-400 prose-a:no-underline hover:prose-a:underline',
  'prose-strong:text-white prose-strong:font-semibold',
  'prose-th:text-left prose-th:text-gray-400 prose-th:font-medium prose-th:py-3',
  'prose-td:py-3 prose-td:text-gray-300',
  'prose-table:text-base',
  'prose-code:text-green-400 prose-code:font-normal',
].join(' ');

export default function CookiesPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 sm:px-8">
      <header className="mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Cookie Policy</h1>
        <p className="mt-4 text-base text-gray-500">Last updated: February 12, 2026</p>
      </header>

      <div className={PROSE}>

        <h2>What are cookies?</h2>
        <p>
          Cookies are small text files stored on your device when you visit a website. They serve various purposes such as keeping you logged in or remembering your preferences.
        </p>

        <h2>Cookies we use</h2>
        <p>
          ShipSafe uses only <strong>strictly necessary cookies</strong>. These cookies are essential for the Service to function and cannot be disabled.
        </p>
        <table>
          <thead>
            <tr><th>Cookie</th><th>Purpose</th><th>Duration</th><th>Provider</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><code>authjs.session-token</code></td>
              <td>Keeps you logged in to your account</td>
              <td>30 days</td>
              <td>ShipSafe (Auth.js)</td>
            </tr>
            <tr>
              <td><code>authjs.csrf-token</code></td>
              <td>Protects against cross-site request forgery</td>
              <td>Session</td>
              <td>ShipSafe (Auth.js)</td>
            </tr>
            <tr>
              <td><code>authjs.callback-url</code></td>
              <td>Redirects you after login</td>
              <td>Session</td>
              <td>ShipSafe (Auth.js)</td>
            </tr>
            <tr>
              <td><code>__stripe_mid</code></td>
              <td>Fraud prevention during payment</td>
              <td>1 year</td>
              <td>Stripe</td>
            </tr>
            <tr>
              <td><code>__stripe_sid</code></td>
              <td>Fraud prevention during payment</td>
              <td>30 minutes</td>
              <td>Stripe</td>
            </tr>
          </tbody>
        </table>

        <h2>Cookies we do NOT use</h2>
        <p>ShipSafe does <strong>not</strong> use:</p>
        <ul>
          <li>Analytics cookies (Google Analytics, Mixpanel, etc.)</li>
          <li>Advertising or tracking cookies</li>
          <li>Social media cookies</li>
          <li>Third-party marketing cookies</li>
        </ul>

        <h2>Why no consent banner?</h2>
        <p>
          Since ShipSafe only uses strictly necessary cookies (required for the Service to function), no consent is required under:
        </p>
        <ul>
          <li><strong>GDPR</strong> — Article 5(3) of the ePrivacy Directive exempts strictly necessary cookies from consent requirements</li>
          <li><strong>Loi 25 (Québec)</strong> — Consent is not required for cookies necessary for the provision of a service explicitly requested by the user</li>
        </ul>
        <p>
          If we add non-essential cookies in the future, we will implement a consent mechanism and update this policy before deploying them.
        </p>

        <h2>How to manage cookies</h2>
        <p>
          You can configure your browser to block or delete cookies. Note that blocking strictly necessary cookies may prevent you from using ShipSafe&apos;s authenticated features.
        </p>
        <ul>
          <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome</a></li>
          <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer">Firefox</a></li>
          <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
          <li><a href="https://support.microsoft.com/en-us/microsoft-edge/manage-cookies-in-microsoft-edge-0f14e734-b256-4503-83ec-c1de35ee0fbb" target="_blank" rel="noopener noreferrer">Edge</a></li>
        </ul>

        <h2>Contact</h2>
        <p>
          For questions about our cookie practices:<br />
          Email: <a href="mailto:privacy@shipsafe.app">privacy@shipsafe.app</a>
        </p>
      </div>
    </main>
  );
}
