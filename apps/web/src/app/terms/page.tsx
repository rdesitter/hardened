import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — ShipSafe',
  description: 'Terms and conditions governing the use of ShipSafe.',
};

const TOC = [
  { id: 'about', label: 'About ShipSafe' },
  { id: 'description', label: 'Description of the Service' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'plans', label: 'Plans and pricing' },
  { id: 'payments', label: 'Payments and billing' },
  { id: 'acceptable-use', label: 'Acceptable use' },
  { id: 'ip', label: 'Intellectual property' },
  { id: 'disclaimer', label: 'Disclaimer and limitation of liability' },
  { id: 'indemnification', label: 'Indemnification' },
  { id: 'termination', label: 'Termination' },
  { id: 'modifications', label: 'Modifications' },
  { id: 'governing-law', label: 'Governing law and disputes' },
  { id: 'severability', label: 'Severability' },
  { id: 'contact', label: 'Contact' },
];

const PROSE = [
  'prose prose-lg prose-invert prose-gray max-w-none',
  'prose-headings:scroll-mt-24',
  'prose-h2:mt-16 prose-h2:border-b prose-h2:border-gray-800/60 prose-h2:pb-4',
  'prose-h3:mt-10',
  'prose-p:leading-relaxed prose-p:text-gray-300',
  'prose-li:text-gray-300 prose-li:leading-relaxed',
  'prose-a:text-green-400 prose-a:no-underline hover:prose-a:underline',
  'prose-strong:text-white prose-strong:font-semibold',
].join(' ');

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 sm:px-8">
      <header className="mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Terms of Service</h1>
        <p className="mt-4 text-base text-gray-500">Last updated: February 12, 2026</p>
      </header>

      {/* Table of contents */}
      <nav className="mb-16 rounded-2xl border border-gray-800/60 bg-gray-900/40 px-7 py-6">
        <p className="mb-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Table of contents</p>
        <ol className="columns-2 gap-x-10 text-sm leading-8 text-gray-400">
          {TOC.map((item, i) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="transition-colors hover:text-green-400">
                {i + 1}. {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className={PROSE}>

        <h2 id="about">1. About ShipSafe</h2>
        <p>
          ShipSafe is an automated security audit tool for web applications, operated by [PRÉNOM NOM], self-employed worker (travailleur autonome) based in Montréal, Québec, Canada.
        </p>
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your use of ShipSafe (the &quot;Service&quot;) available at <a href="https://shipsafe.app">https://shipsafe.app</a>.
        </p>
        <p>
          By using ShipSafe, you agree to these Terms. If you do not agree, please do not use the Service.
        </p>

        <h2 id="description">2. Description of the Service</h2>
        <p>
          ShipSafe analyzes publicly accessible aspects of web applications to identify potential security issues. Our scans include:
        </p>
        <ul>
          <li>HTTP/HTTPS configuration checks</li>
          <li>Security header analysis</li>
          <li>CORS configuration verification</li>
          <li>Cookie security flag checks</li>
          <li>Exposed sensitive paths detection</li>
          <li>DNS security record verification</li>
          <li>TLS/SSL configuration analysis</li>
        </ul>
        <p>
          <strong>Important:</strong> ShipSafe only performs checks that are publicly accessible — equivalent to what any web browser or HTTP client can observe. ShipSafe does <strong>not</strong>:
        </p>
        <ul>
          <li>Access private data or databases</li>
          <li>Attempt to bypass authentication</li>
          <li>Perform penetration testing or exploit vulnerabilities</li>
          <li>Access or store data belonging to users of scanned applications</li>
        </ul>

        <h2 id="accounts">3. Accounts</h2>
        <h3>3.1 Account creation</h3>
        <p>
          You may use ShipSafe&apos;s free scan without creating an account. To access the dashboard, scan history, and paid features, you must create an account with a valid email address.
        </p>
        <h3>3.2 Account security</h3>
        <p>
          You are responsible for maintaining the security of your account. Notify us immediately at <a href="mailto:support@shipsafe.app">support@shipsafe.app</a> if you suspect unauthorized access.
        </p>
        <h3>3.3 Age requirement</h3>
        <p>You must be at least 16 years old to use ShipSafe.</p>

        <h2 id="plans">4. Plans and pricing</h2>
        <h3>4.1 Free plan</h3>
        <ul>
          <li>Unlimited scans with rate limiting</li>
          <li>Full security score and check results</li>
          <li>Shareable public reports</li>
        </ul>
        <h3>4.2 Pro plan (9 USD/month)</h3>
        <ul>
          <li>Everything in Free</li>
          <li>Detailed fix instructions for each security issue</li>
          <li>Weekly automated monitoring</li>
          <li>Email alerts on security regressions</li>
          <li>Score history and trends</li>
        </ul>
        <h3>4.3 Price changes</h3>
        <p>
          We may change our prices with 30 days&apos; notice. Existing subscriptions will continue at their current price until the next renewal after the notice period.
        </p>

        <h2 id="payments">5. Payments and billing</h2>
        <h3>5.1 Payment processing</h3>
        <p>
          Payments are processed securely by Stripe. We do not store your credit card information.
        </p>
        <h3>5.2 Billing cycle</h3>
        <p>
          Pro subscriptions are billed monthly. Your subscription renews automatically unless canceled.
        </p>
        <h3>5.3 Cancellation</h3>
        <p>
          You can cancel your subscription at any time from your account settings or via the Stripe Customer Portal. Cancellation takes effect at the end of your current billing period. You will retain Pro access until then.
        </p>
        <h3>5.4 Refunds</h3>
        <p>
          We offer a full refund within 14 days of your first Pro subscription if you are not satisfied. After this period, no refunds are provided for partial billing periods. To request a refund, contact <a href="mailto:support@shipsafe.app">support@shipsafe.app</a>.
        </p>

        <h2 id="acceptable-use">6. Acceptable use</h2>
        <p>You agree to use ShipSafe only to:</p>
        <ul>
          <li>Scan web applications you own or have authorization to test</li>
          <li>Improve the security of your own applications</li>
        </ul>
        <p>You agree <strong>not</strong> to:</p>
        <ul>
          <li>Scan applications without authorization from their owner</li>
          <li>Use ShipSafe to identify vulnerabilities for malicious purposes</li>
          <li>Attempt to overwhelm or disrupt scanned applications through excessive scanning</li>
          <li>Circumvent rate limits or abuse the Service</li>
          <li>Use the Service for any illegal purpose</li>
          <li>Resell or redistribute scan results commercially without our consent</li>
          <li>Use automated tools to access the Service beyond the provided API</li>
        </ul>

        <h2 id="ip">7. Intellectual property</h2>
        <h3>7.1 Our content</h3>
        <p>
          ShipSafe, including its code, design, documentation, and security check methodologies, is our intellectual property. Scan reports are generated for your use and may be shared freely.
        </p>
        <h3>7.2 Your content</h3>
        <p>
          You retain ownership of the URLs you submit and any data associated with your account.
        </p>

        <h2 id="disclaimer">8. Disclaimer and limitation of liability</h2>
        <h3>8.1 Service provided &quot;as is&quot;</h3>
        <p>
          ShipSafe is provided &quot;as is&quot; without warranty of any kind, express or implied. We do not guarantee that:
        </p>
        <ul>
          <li>Scans will detect all security issues</li>
          <li>Fix recommendations will resolve all vulnerabilities</li>
          <li>The Service will be uninterrupted or error-free</li>
        </ul>
        <h3>8.2 Not a substitute for professional security audit</h3>
        <p>
          ShipSafe is an automated tool that checks common security configurations. It is <strong>not</strong> a comprehensive security audit, penetration test, or compliance assessment. For critical applications, we recommend engaging a professional security firm.
        </p>
        <h3>8.3 Limitation of liability</h3>
        <p>
          To the maximum extent permitted by law, [PRÉNOM NOM] shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service, including but not limited to:
        </p>
        <ul>
          <li>Security incidents on your applications</li>
          <li>Loss of data or profits</li>
          <li>Reliance on scan results or fix recommendations</li>
        </ul>
        <p>
          Our total liability shall not exceed the amount you paid for the Service in the 12 months preceding the claim.
        </p>

        <h2 id="indemnification">9. Indemnification</h2>
        <p>You agree to indemnify and hold us harmless from any claims arising from:</p>
        <ul>
          <li>Your use of the Service</li>
          <li>Your violation of these Terms</li>
          <li>Your scanning of applications you are not authorized to test</li>
        </ul>

        <h2 id="termination">10. Termination</h2>
        <h3>10.1 By you</h3>
        <p>
          You may delete your account at any time from your account settings. This will cancel any active subscription and permanently delete your data within 30 days.
        </p>
        <h3>10.2 By us</h3>
        <p>
          We may suspend or terminate your account if you violate these Terms, abuse the Service, or if required by law. We will notify you by email before termination except in cases of severe abuse.
        </p>

        <h2 id="modifications">11. Modifications</h2>
        <p>
          We may update these Terms from time to time. We will notify you of significant changes by email or by a notice on our website at least 30 days before they take effect. Continued use of the Service after changes constitutes acceptance.
        </p>

        <h2 id="governing-law">12. Governing law and disputes</h2>
        <p>
          These Terms are governed by the laws of the Province of Québec and the federal laws of Canada applicable therein. Any dispute shall be submitted to the exclusive jurisdiction of the courts of Montréal, Québec.
        </p>

        <h2 id="severability">13. Severability</h2>
        <p>
          If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force.
        </p>

        <h2 id="contact">14. Contact</h2>
        <p>For any questions about these Terms:</p>
        <p>
          [PRÉNOM NOM]<br />
          Email: <a href="mailto:support@shipsafe.app">support@shipsafe.app</a><br />
          Location: Montréal, Québec, Canada
        </p>
      </div>
    </main>
  );
}
