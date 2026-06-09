import { getServerIdLang } from './server-locale';

const PRESTA_BASE = (process.env.PRESTA_API_URL || '').replace(/\/api\/?$/, '');
const API_KEY = process.env.PRESTA_API_KEY || '';

export type Filters = Record<string, string[]>;

export async function fetchCategoryProductIdsWithFilters(
  idCategory: number,
  page: number,
  perPage: number,
  filters: Filters,
  orderby: string = 'date_add',
  orderdir: string = 'desc'
): Promise<{ ids: number[]; total: number }> {
  const idLang = await getServerIdLang();
  let url = `${PRESTA_BASE}/index.php?fc=module&module=pixfeed_headless_api&controller=category_products&id_category=${idCategory}&page=${page}&per_page=${perPage}&id_lang=${idLang}&orderby=${encodeURIComponent(orderby)}&orderdir=${encodeURIComponent(orderdir)}&ws_key=${API_KEY}`;
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
  } catch {
    return { ids: [], total: 0 };
  }
}

export async function fetchManufacturerProductIdsWithFilters(
  idManufacturer: number,
  page: number,
  perPage: number,
  filters: Filters,
  orderby: string = 'date_add',
  orderdir: string = 'desc'
): Promise<{ ids: number[]; total: number }> {
  const idLang = await getServerIdLang();
  let url = `${PRESTA_BASE}/index.php?fc=module&module=pixfeed_headless_api&controller=category_products&id_manufacturer=${idManufacturer}&page=${page}&per_page=${perPage}&id_lang=${idLang}&orderby=${encodeURIComponent(orderby)}&orderdir=${encodeURIComponent(orderdir)}&ws_key=${API_KEY}`;
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
  } catch {
    return { ids: [], total: 0 };
  }
}

export function parseFiltersFromSearchParams(sp: Record<string, string | string[] | undefined>): Filters {
  const out: Filters = {};
  for (const [key, value] of Object.entries(sp)) {
    if (!key.startsWith('f_')) continue;
    const type = key.slice(2);
    const raw = Array.isArray(value) ? value.join(',') : (value ?? '');
    const arr = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (arr.length > 0) out[type] = arr;
  }
  return out;
}
