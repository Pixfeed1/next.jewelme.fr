import { fetchCmsBySlug, getCmsValue } from '@/lib/cms';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PowerfulForm from '@/components/PowerfulForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const page = await fetchCmsBySlug(slug);
  const urlFr = `/fr/page/${slug}`;
  const urlEn = `/en/page/${slug}`;
  return {
    title: (page ? getCmsValue(page, 'metaTitle', locale) || getCmsValue(page, 'title', locale) : '') || 'Page',
    description: (page ? getCmsValue(page, 'metaDescription', locale) : '') || '',
    alternates: {
      canonical: `/${locale}/page/${slug}`,
      languages: { fr: urlFr, en: urlEn, 'x-default': urlFr },
    },
  };
}

function parseContent(content: string): Array<{ kind: 'html' | 'form'; data: string | number }> {
  const segments: Array<{ kind: 'html' | 'form'; data: string | number }> = [];
  const regex = /\{powerfulform:(\d+)\}/g;
  let lastIdx = 0;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const before = content.slice(lastIdx, match.index).replace(/<pre><code>\s*$/, '').replace(/^\s*<\/code><\/pre>/, '');
    if (before.trim()) segments.push({ kind: 'html', data: before });
    segments.push({ kind: 'form', data: parseInt(match[1], 10) });
    lastIdx = match.index + match[0].length;
  }
  const tail = content.slice(lastIdx).replace(/^\s*<\/code><\/pre>/, '');
  if (tail.trim()) segments.push({ kind: 'html', data: tail });
  return segments;
}

export default async function CmsPageRoute({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ form?: string }>;
}) {
  const { locale, slug } = await params;
  const sp = await searchParams;
  const extraFormId = sp.form ? parseInt(sp.form, 10) : null;
  const page = await fetchCmsBySlug(slug);
  if (!page) notFound();
  const title = getCmsValue(page, 'title', locale);
  const content = getCmsValue(page, 'content', locale);
  const segments = parseContent(content);
  return (
    <div style={{ maxWidth: 980 }}>
      <p style={{ marginBottom: 24, fontSize: 13 }}>
        <Link href={`/${locale}`} style={{ color: '#888', textDecoration: 'none' }}>Accueil</Link>
        <span style={{ color: '#ccc', margin: '0 8px' }}>›</span>
        <span style={{ color: '#888' }}>{title}</span>
      </p>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, marginBottom: 24, lineHeight: 1.2 }}>
        {title}
      </h1>
      {!extraFormId ? (
        <div className="cms-content typo" style={{ lineHeight: 1.7, fontSize: 14, color: '#333' }}>
          {segments.map((seg, i) =>
            seg.kind === 'html' ? (
              <div key={i} dangerouslySetInnerHTML={{ __html: String(seg.data) }} />
            ) : (
              <PowerfulForm key={i} id={Number(seg.data)} />
            )
          )}
        </div>
      ) : (
        <div style={{ marginTop: 24 }}><PowerfulForm id={extraFormId} /></div>
      )}
    </div>
  );
}
