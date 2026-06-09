/**
 * Client pour le module Presta pixfeed_headless_api.
 *
 * @author PixFeed - Marc Gueffie
 */
import { getServerIdLang } from './server-locale';
import { decodeHtmlEntities } from './text-utils';

const PRESTA_BASE = (process.env.PRESTA_API_URL || 'https://test4.jewelme.fr/api').replace(/\/api\/?$/, '');
const API_KEY = process.env.PRESTA_API_KEY || '5KC84V1MI8YJR54U4HSZWFK4IQG2RS28';
const HOME_STRUCTURE_URL =
  `${PRESTA_BASE}/index.php?fc=module&module=pixfeed_headless_api&controller=home`;

export interface SliderConfig {
  enabled: boolean;
  autoplay: boolean;
  columns_desktop: number;
  limit: number;
  mobile: { enabled: boolean; limit: number };
}

export interface HomeStructureTab {
  id: number;
  title: string;
  type: string;
  position: number;
  product_filter: string;
  product_options: Record<string, unknown>;
  slider_config?: SliderConfig;
  static_html: string;
  product_ids: number[];
}

export interface HomeStructureBlock {
  id: number;
  title: string;
  type: string;
  hook: string;
  position: number;
  custom_class: string;
  product_filter: string;
  product_options: Record<string, unknown>;
  slider_config?: SliderConfig;
  static_html: string;
  product_ids?: number[];
  tabs?: HomeStructureTab[];
}

export interface HomeStructure {
  meta: { id_shop: number; id_lang: number; lang_iso: string };
  blocks: HomeStructureBlock[];
  warning?: string;
  error?: string;
}

export async function fetchHomeStructure(): Promise<HomeStructure> {
  const idLang = await getServerIdLang();
  const url = `${HOME_STRUCTURE_URL}&ws_key=${API_KEY}&id_lang=${idLang}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.error('[Headless API] fetchHomeStructure HTTP', res.status);
      return emptyStructure(`HTTP ${res.status}`);
    }
    const data: HomeStructure = await res.json();
    // Décode les titres affichés (blocs + onglets)
    for (const block of data.blocks ?? []) {
      if (block.title) block.title = decodeHtmlEntities(block.title);
      for (const tab of block.tabs ?? []) {
        if (tab.title) tab.title = decodeHtmlEntities(tab.title);
      }
    }
    return data;
  } catch (err) {
    console.error('[Headless API] fetchHomeStructure error:', err);
    return emptyStructure(String(err));
  }
}

function emptyStructure(error?: string): HomeStructure {
  return {
    meta: { id_shop: 1, id_lang: 1, lang_iso: 'fr' },
    blocks: [],
    error,
  };
}

export async function fetchCrossSellIds(idProduct: number): Promise<number[]> {
  if (idProduct <= 0) return [];
  const url = `${PRESTA_BASE}/index.php?fc=module&module=pixfeed_headless_api&controller=product_cross_sell&id_product=${idProduct}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.product_ids) ? data.product_ids.filter((x: any) => typeof x === 'number' && x > 0) : [];
  } catch (err) {
    console.error('[Headless API] fetchCrossSellIds error:', err);
    return [];
  }
}

