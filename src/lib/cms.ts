import { getServerIdLang } from './server-locale';

function extractAllLangValues(field: unknown): Record<string, string> {
  if (typeof field === 'string') return { '1': field };
  if (Array.isArray(field)) {
    const out: Record<string, string> = {};
    for (const f of field as Array<{ id: string; value: string }>) {
      out[String(f.id)] = String(f.value || '');
    }
    return out;
  }
  return {};
}

const PRESTA_API_URL = process.env.PRESTA_API_URL || 'https://www.onlyroots-reggae.com/api';
const PRESTA_API_KEY = process.env.PRESTA_API_KEY || '';

export interface CmsPage {
  id: number;
  title: string;
  metaDescription: string;
  metaTitle: string;
  slug: string;
  slugByLang: Record<string, string>;
  titleByLang: Record<string, string>;
  contentByLang: Record<string, string>;
  metaTitleByLang: Record<string, string>;
  metaDescriptionByLang: Record<string, string>;
  content: string;
  active: boolean;
}

function extractLangValue(field: unknown, idLang = 1): string {
  if (typeof field === 'string') return field;
  if (Array.isArray(field)) {
    const match = field.find((f: { id: string }) => String(f?.id) === String(idLang));
    return match ? String((match as { value: string }).value || '') : String((field[0] as { value: string } | undefined)?.value || '');
  }
  if (field && typeof field === 'object' && 'value' in (field as { value: unknown })) {
    return String((field as { value: unknown }).value || '');
  }
  return '';
}

function normalize(raw: Record<string, unknown>): CmsPage {
  const titleByLang = extractAllLangValues(raw.meta_title);
  const metaTitleByLang = extractAllLangValues(raw.head_seo_title);
  const metaDescriptionByLang = extractAllLangValues(raw.meta_description);
  const contentByLang = extractAllLangValues(raw.content);
  return {
    id: parseInt(String(raw.id), 10),
    title: titleByLang['1'] || '',
    metaDescription: metaDescriptionByLang['1'] || '',
    metaTitle: metaTitleByLang['1'] || titleByLang['1'] || '',
    slug: extractLangValue(raw.link_rewrite),
    slugByLang: extractAllLangValues(raw.link_rewrite),
    content: contentByLang['1'] || '',
    titleByLang,
    contentByLang,
    metaTitleByLang,
    metaDescriptionByLang,
    active: raw.active === '1' || raw.active === 1 || raw.active === true,
  };
}

export function getCmsValue(page: CmsPage, field: 'title' | 'content' | 'metaTitle' | 'metaDescription', locale: string): string {
  const map: Record<string, string> = {
    title: '', content: '', metaTitle: '', metaDescription: '',
  }[field] !== undefined ? (
    field === 'title' ? page.titleByLang :
    field === 'content' ? page.contentByLang :
    field === 'metaTitle' ? page.metaTitleByLang :
    page.metaDescriptionByLang
  ) : {};
  const langId = locale === 'en' ? '2' : '1';
  return map[langId] || map['1'] || page[field] || '';
}

export async function fetchCmsPages(): Promise<CmsPage[]> {
  const url = `${PRESTA_API_URL}/content_management_system?ws_key=${PRESTA_API_KEY}&output_format=JSON&display=full&filter[active]=1`;
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.content_management_system || []).map(normalize);
  } catch {
    return [];
  }
}

export async function fetchCmsBySlug(slug: string): Promise<CmsPage | null> {
  const pages = await fetchCmsPages();
  return pages.find((p) => p.active && Object.values(p.slugByLang).includes(slug)) || null;
}

export async function fetchCmsById(id: number): Promise<CmsPage | null> {
  const pages = await fetchCmsPages();
  return pages.find((p) => p.active && p.id === id) || null;
}
