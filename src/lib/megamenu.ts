import { cache } from 'react';

import { getServerIdLang } from './server-locale';
import { decodeHtmlEntities } from './text-utils';

const PRESTA_BASE = (process.env.PRESTA_API_URL || '').replace(/\/api\/?$/, '');
const API_KEY = process.env.PRESTA_API_KEY || '';
const MEGAMENU_URL = `${PRESTA_BASE}/index.php?fc=module&module=pixfeed_headless_api&controller=megamenu`;

export interface MegaMenuCategory {
  id: number;
  name: string;
  link_rewrite: string;
  parent_id: number;
  url: string;
}

export interface MegaMenuManufacturer {
  id: number;
  name: string;
  url: string;
}

export interface MegaMenuDropdown {
  content_type: 'category' | 'manufacturer' | 'product' | 'static' | string;
  fullwidth: boolean;
  columns: number;
  static_html: string;
  categories?: MegaMenuCategory[];
  manufacturers?: MegaMenuManufacturer[];
  product_ids?: number[];
  options?: Record<string, unknown>;
}

export interface MegaMenuEntry {
  id: number;
  name: string;
  link: string;             // normalised relative path (e.g. /36-onlyroots-records)
  link_external: string;    // original absolute URL
  label: string;
  label_color: string;
  position: number;
  title_image: string;
  link_newtab: boolean;
  custom_class: string;
  has_dropdown: boolean;
  drop_column: number;
  dropdown?: MegaMenuDropdown[];
}

export interface MegaMenu {
  meta: { id_shop: number; id_lang: number };
  entries: MegaMenuEntry[];
  warning?: string;
  error?: string;
}

export const fetchMegaMenu = cache(async (): Promise<MegaMenu> => {
  const idLang = await getServerIdLang();
  const url = `${MEGAMENU_URL}&ws_key=${API_KEY}&id_lang=${idLang}`;
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      console.error('[MegaMenu] HTTP', res.status);
      return emptyMenu(`HTTP ${res.status}`);
    }
    const data: MegaMenu = await res.json();
    // Décode les libellés affichés (entrées + catégories + manufacturers du dropdown)
    for (const entry of data.entries ?? []) {
      if (entry.name) entry.name = decodeHtmlEntities(entry.name);
      for (const group of entry.dropdown ?? []) {
        for (const cat of group.categories ?? []) cat.name = decodeHtmlEntities(cat.name);
        for (const m of group.manufacturers ?? []) m.name = decodeHtmlEntities(m.name);
      }
    }
    return data;
  } catch (err) {
    console.error('[MegaMenu] error:', err);
    return emptyMenu(String(err));
  }
});

function emptyMenu(error?: string): MegaMenu {
  return { meta: { id_shop: 1, id_lang: 1 }, entries: [], error };
}
