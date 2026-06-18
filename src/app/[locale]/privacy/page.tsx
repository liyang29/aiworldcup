import type { Metadata } from 'next';
import { getDictionary } from '@/i18n/dictionaries';
import type { Locale } from '@/i18n/config';
import { altLinks, ogMeta } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const dict = await getDictionary(params.locale);
  const p = dict.privacy;
  return {
    title: p.title,
    description: p.intro.slice(0, 160),
    alternates: altLinks(params.locale, '/privacy'),
    ...ogMeta(params.locale, {
      siteName: dict.meta.siteName,
      title: p.title,
      description: p.intro.slice(0, 160),
      path: '/privacy',
      image: `/${params.locale}/opengraph-image`,
    }),
  };
}

export default async function PrivacyPage({ params }: { params: { locale: Locale } }) {
  const p = (await getDictionary(params.locale)).privacy;

  return (
    <main className="mx-auto max-w-2xl px-4 pb-20 pt-8 sm:px-6">
      <h1 className="text-2xl font-medium text-ink">{p.title}</h1>
      <p className="mt-1 text-xs text-mute">
        {p.updatedLabel}: {p.updated}
      </p>
      <p className="mt-5 text-sm leading-relaxed text-body">{p.intro}</p>

      <div className="mt-8 space-y-7">
        {p.sections.map((s, i) => (
          <section key={i}>
            <h2 className="mb-2 text-lg font-medium text-ink">{s.h}</h2>
            <div className="space-y-2">
              {s.p.map((para, j) => (
                <p key={j} className="text-sm leading-relaxed text-body">
                  {para}
                </p>
              ))}
            </div>
          </section>
        ))}

        <p className="text-sm text-body">
          <a href={`mailto:${p.contactEmail}`} className="text-sunset hover:underline">
            {p.contactEmail}
          </a>
        </p>
      </div>
    </main>
  );
}
