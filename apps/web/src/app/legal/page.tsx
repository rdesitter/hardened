import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legal Notice — Hardened',
  description: 'Legal notice and mentions légales for Hardened.',
};

const PROSE = [
  'prose prose-lg prose-invert prose-gray max-w-none',
  'prose-headings:scroll-mt-24',
  'prose-h2:mt-16 prose-h2:border-b prose-h2:border-gray-800/60 prose-h2:pb-4',
  'prose-p:leading-relaxed prose-p:text-gray-300',
  'prose-a:text-green-400 prose-a:no-underline hover:prose-a:underline',
  'prose-strong:text-white prose-strong:font-semibold',
].join(' ');

export default function LegalPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 sm:px-8">
      <header className="mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Legal Notice</h1>
        <p className="mt-4 text-base text-gray-500">Mentions légales</p>
      </header>

      <div className={PROSE}>

        <h2>Editor / Éditeur</h2>
        <p>
          R&amp;D Solutions Numériques<br />
          R&amp;D Solutions Numériques, entreprise individuelle enregistrée au Québec<br />
          4388 R. Saint-Denis #200<br />
          Montréal, QC H2J 2L1<br />
          Canada<br />
          NEQ : 2280685357
        </p>
        <p>
          Email: <a href="mailto:contact@hardened.app">contact@hardened.app</a>
        </p>
        <p>
          Publication Director / Directeur de la publication: R&amp;D Solutions Numériques
        </p>

        <h2>Hosting / Hébergement</h2>
        <p>
          DigitalOcean, LLC<br />
          101 Avenue of the Americas, New York, NY 10013<br />
          États-Unis / United States
        </p>

        <h2>Privacy Officer / Responsable de la protection des renseignements personnels</h2>
        <p>
          R&amp;D Solutions Numériques<br />
          Email: <a href="mailto:privacy@hardened.app">privacy@hardened.app</a>
        </p>
        <p>
          This designation is made in accordance with Québec&apos;s Loi 25 (Act respecting the protection of personal information in the private sector).
        </p>

        <h2>Applicable law / Droit applicable</h2>
        <p>
          This website is governed by the laws of the Province of Québec and the federal laws of Canada.
        </p>
        <p>
          Ce site est régi par les lois de la province de Québec et les lois fédérales du Canada.
        </p>

        <h2>Intellectual property / Propriété intellectuelle</h2>
        <p>
          All content on this website (text, graphics, logos, software) is the property of R&amp;D Solutions Numériques and is protected by applicable intellectual property laws. Reproduction without authorization is prohibited.
        </p>
        <p>
          Tout le contenu de ce site (textes, graphismes, logos, logiciels) est la propriété de R&amp;D Solutions Numériques et est protégé par les lois applicables en matière de propriété intellectuelle. Toute reproduction sans autorisation est interdite.
        </p>
      </div>
    </main>
  );
}
