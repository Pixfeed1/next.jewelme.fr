import { cache } from 'react';

const PRESTA_BASE = (process.env.PRESTA_API_URL || '').replace(/\/api\/?$/, '');
const API_KEY = process.env.PRESTA_API_KEY || '';

export interface SearchResult {
  id: number;
  name: string;
  reference: string;
  manufacturer: string;
  slug: string;
  category_id: number;
  category_slug: string;
  price: number;
  image_url: string;
}

export interface SearchResponse {
  query: string;
  count: number;
  results: SearchResult[];
  error?: string;
}

export const fetchSearchResults = cache(async (q: string, limit = 30, idLang = 1): Promise<SearchResponse> => {
  if (!q || q.trim().length < 2) {
    return { query: q, count: 0, results: [] };
  }
  const url = `${PRESTA_BASE}/index.php?fc=module&module=pixfeed_headless_api&controller=search_suggest&q=${encodeURIComponent(q)}&limit=${limit}&id_lang=${idLang}&ws_key=${API_KEY}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return { query: q, count: 0, results: [], error: `HTTP ${res.status}` };
    return await res.json();
  } catch (e: any) {
    return { query: q, count: 0, results: [], error: e.message };
  }
});

export function productUrlFromResult(r: SearchResult): string {
  return `/${r.category_id}-${r.category_slug}/${r.id}-${r.slug}.html`;
}

// ========================================================================
// Mode recherche complet (avec filtres, sort, pagination)
// Utilise category_products (etendu avec param q) et filters (etendu avec param q)
// ========================================================================
import type { Filters } from './category-products';
import type { FiltersResponse } from './filters';
import { decodeHtmlEntities } from './text-utils';
import { getServerIdLang } from './server-locale';

export async function fetchSearchProductIds(
  q: string,
  page: number,
  perPage: number,
  filters: Filters,
  orderby = 'relevance',
  orderdir = 'asc'
): Promise<{ ids: number[]; total: number }> {
  const idLang = await getServerIdLang();
  let url = `${PRESTA_BASE}/index.php?fc=module&module=pixfeed_headless_api&controller=category_products&q=${encodeURIComponent(q)}&page=${page}&per_page=${perPage}&id_lang=${idLang}&orderby=${encodeURIComponent(orderby)}&orderdir=${encodeURIComponent(orderdir)}&ws_key=${API_KEY}`;
  for (const [type, values] of Object.entries(filters)) {
    if (values.length > 0) {
      url += `&filter_${encodeURIComponent(type)}=${encodeURIComponent(values.join(','))}`;
    }
  }
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return { ids: [], total: 0 };
    const data = await res.json();
    return { ids: data.ids ?? [], total: data.meta?.total ?? 0 };
  } catch { return { ids: [], total: 0 }; }
}

function decodeSearchFilters(data: FiltersResponse): FiltersResponse {
  if (!data?.groups) return data;
  for (const g of data.groups) {
    g.name = decodeHtmlEntities(g.name);
    if (Array.isArray(g.values)) {
      for (const v of g.values) v.name = decodeHtmlEntities(v.name);
    }
  }
  return data;
}

export async function fetchSearchFilters(q: string, activeFilters?: Filters): Promise<FiltersResponse> {
  const idLang = await getServerIdLang();
  let url = `${PRESTA_BASE}/index.php?fc=module&module=pixfeed_headless_api&controller=filters&q=${encodeURIComponent(q)}&id_lang=${idLang}&ws_key=${API_KEY}`;
  if (activeFilters) {
    for (const [type, values] of Object.entries(activeFilters)) {
      if (!values || values.length === 0) continue;
      url += `&filter_${encodeURIComponent(type)}=${encodeURIComponent(values.join(','))}`;
    }
  }
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return { meta: { id_category: 0, id_lang: idLang }, groups: [], warning: `HTTP ${res.status}` };
    return decodeSearchFilters(await res.json());
  } catch (e: any) {
    return { meta: { id_category: 0, id_lang: idLang }, groups: [], warning: e.message };
  }
}
