import { cache } from 'react';
import { getServerIdLang } from './server-locale';

const PRESTA_BASE = (process.env.PRESTA_API_URL || '').replace(/\/api\/?$/, '');
const API_KEY = process.env.PRESTA_API_KEY || '';

export interface FilterValue {
  id: number | string;
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

export const fetchFilters = cache(async (idCategory: number): Promise<FiltersResponse> => {
  const idLang = await getServerIdLang();
  const url = `${PRESTA_BASE}/index.php?fc=module&module=pixfeed_headless_api&controller=filters&id_category=${idCategory}&id_lang=${idLang}&ws_key=${API_KEY}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return { meta: { id_category: idCategory, id_lang: idLang }, groups: [], warning: `HTTP ${res.status}` };
    return await res.json();
  } catch (e: any) {
    return { meta: { id_category: idCategory, id_lang: idLang }, groups: [], warning: e.message };
  }
});

export const fetchFiltersByManufacturer = cache(async (idManufacturer: number): Promise<FiltersResponse> => {
  const idLang = await getServerIdLang();
  const url = `${PRESTA_BASE}/index.php?fc=module&module=pixfeed_headless_api&controller=filters&id_manufacturer=${idManufacturer}&id_lang=${idLang}&ws_key=${API_KEY}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return { meta: { id_category: 0, id_lang: idLang }, groups: [], warning: `HTTP ${res.status}` };
    return await res.json();
  } catch (e: any) {
    return { meta: { id_category: 0, id_lang: idLang }, groups: [], warning: e.message };
  }
});
