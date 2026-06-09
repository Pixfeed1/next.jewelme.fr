import { getServerIdLang } from './server-locale';
import { cache } from 'react';
import { decodeHtmlEntities } from './text-utils';

const PRESTA_BASE = (process.env.PRESTA_API_URL || '').replace(/\/api\/?$/, '');
const API_KEY = process.env.PRESTA_API_KEY || '';
const SHOP_CONFIG_URL = `${PRESTA_BASE}/index.php?fc=module&module=pixfeed_headless_api&controller=shop_config`;

export interface ShopInfo {
  name: string;
  logo: string; logo_url: string;
  favicon: string; favicon_url: string;
  email: string; phone: string; mobile_phone: string;
  address1: string; address2: string; zip: string; city: string;
  country_id: number;
  siret: string;
}

export interface SocialLinks {
  facebook?: string; twitter?: string; youtube?: string; instagram?: string;
  pinterest?: string; tiktok?: string; linkedin?: string; rss?: string; vimeo?: string;
}

export interface CmsPage {
  id: number; title: string; link_rewrite: string; url: string;
  meta_description: string; position: number;
}

export interface ShopConfig {
  meta: { id_shop: number; id_lang: number; base_url: string };
  shop: ShopInfo;
  social: SocialLinks;
  cms_pages: CmsPage[];
}

export const fetchShopConfig = cache(async (): Promise<ShopConfig> => {
  const url = `${SHOP_CONFIG_URL}&ws_key=${API_KEY}&id_lang=${await getServerIdLang()}`;
  try {
    // Revalidate every 5 min — la config change rarement
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      console.error('[ShopConfig] HTTP', res.status);
      return emptyConfig();
    }
    const data: ShopConfig = await res.json();
    if (data.shop?.name) data.shop.name = decodeHtmlEntities(data.shop.name);
    for (const page of data.cms_pages ?? []) {
      if (page.title) page.title = decodeHtmlEntities(page.title);
    }
    return data;
  } catch (err) {
    console.error('[ShopConfig] error:', err);
    return emptyConfig();
  }
});

function emptyConfig(): ShopConfig {
  return {
    meta: { id_shop: 1, id_lang: 1, base_url: '' },
    shop: {
      name: 'Shop', logo: '', logo_url: '', favicon: '', favicon_url: '',
      email: '', phone: '', mobile_phone: '',
      address1: '', address2: '', zip: '', city: '',
      country_id: 0, siret: '',
    },
    social: {},
    cms_pages: [],
  };
}
