import { cache } from 'react';
import { getServerIdLang } from './server-locale';
import { decodeHtmlEntities } from './text-utils';

const PRESTA_BASE = (process.env.PRESTA_API_URL || '').replace(/\/api\/?$/, '');
const API_KEY = process.env.PRESTA_API_KEY || '';

export interface FilterValue {
  id: number | string;
  /** ids complets de la feature_value (Presta peut la dupliquer en BDD) */
  ids?: number[];
  name: string;
  count: number;
  min?: number;
  max?: number;
}

export interface FilterGroup {
  id: number;
  type: string;
  name: string;
  url_identifier: string;
  icon: string;
  display_type: number;
  is_multicriteria: boolean;
  is_combined: boolean;
  is_range: boolean;
  range_sign: string;
  range_interval: string;
  position: number;
  values: FilterValue[];
}

export interface FiltersResponse {
  meta: { id_category: number; id_search?: number; id_lang: number; id_shop?: number };
  groups: FilterGroup[];
  warning?: string;
}

/** Décode les entités HTML dans les libellés de filtres (noms de groupes + valeurs). */
function decodeFilters(data: FiltersResponse): FiltersResponse {
  if (!data?.groups) return data;
  for (const g of data.groups) {
    g.name = decodeHtmlEntities(g.name);
    if (Array.isArray(g.values)) {
      for (const v of g.values) v.name = decodeHtmlEntities(v.name);
    }
  }
  return data;
}

export const fetchFilters = cache(async (idCategory: number, activeFilters?: Record<string, string[]>): Promise<FiltersResponse> => {
  const idLang = await getServerIdLang();
  let url = `${PRESTA_BASE}/index.php?fc=module&module=pixfeed_headless_api&controller=filters&id_category=${idCategory}&id_lang=${idLang}&ws_key=${API_KEY}`;
  if (activeFilters) {
    for (const [type, values] of Object.entries(activeFilters)) {
      if (!values || values.length === 0) continue;
      url += `&filter_${encodeURIComponent(type)}=${encodeURIComponent(values.join(','))}`;
    }
  }
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return { meta: { id_category: idCategory, id_lang: idLang }, groups: [], warning: `HTTP ${res.status}` };
    return decodeFilters(await res.json());
  } catch (e: any) {
    return { meta: { id_category: idCategory, id_lang: idLang }, groups: [], warning: e.message };
  }
});

export const fetchFiltersByManufacturer = cache(async (idManufacturer: number, activeFilters?: Record<string, string[]>): Promise<FiltersResponse> => {
  const idLang = await getServerIdLang();
  let url = `${PRESTA_BASE}/index.php?fc=module&module=pixfeed_headless_api&controller=filters&id_manufacturer=${idManufacturer}&id_lang=${idLang}&ws_key=${API_KEY}`;
  if (activeFilters) {
    for (const [type, values] of Object.entries(activeFilters)) {
      if (!values || values.length === 0) continue;
      url += `&filter_${encodeURIComponent(type)}=${encodeURIComponent(values.join(','))}`;
    }
  }
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return { meta: { id_category: 0, id_lang: idLang }, groups: [], warning: `HTTP ${res.status}` };
    return decodeFilters(await res.json());
  } catch (e: any) {
    return { meta: { id_category: 0, id_lang: idLang }, groups: [], warning: e.message };
  }
});
