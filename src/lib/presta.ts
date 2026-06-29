/**
 * PrestaShop Webservice client — server-side only.
 *
 * @author PixFeed - Marc Gueffie
 */

import { decodeHtmlEntities } from './text-utils';

const API_URL = process.env.PRESTA_API_URL || 'https://test4.jewelme.fr/api';
const API_KEY = process.env.PRESTA_API_KEY || '5KC84V1MI8YJR54U4HSZWFK4IQG2RS28';

// === TAX RATES (cache 5 min) ===
let _taxRatesCache: { data: { default_rate: number; rates: Record<string, number> } | null; expires: number } = { data: null, expires: 0 };

function cleanStr(v: any): string {
  if (v === false || v === null || v === undefined) return '';
  const s = String(v);
  return s === 'false' ? '' : s;
}

export async function fetchTaxRates(): Promise<{ default_rate: number; rates: Record<string, number> }> {
  const now = Date.now();
  if (_taxRatesCache.data && _taxRatesCache.expires > now) return _taxRatesCache.data;
  const base = API_URL.replace(/\/api\/?$/, '');
  try {
    const res = await fetch(`${base}/headless/tax_rates?ws_key=${API_KEY}`, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    _taxRatesCache = { data, expires: now + 5 * 60 * 1000 };
    return data;
  } catch (e) {
    console.error('[fetchTaxRates] failed:', e);
    return { default_rate: 20, rates: {} };
  }
}

function applyTaxRate(price: number, idTaxRulesGroup: number, taxRates: { default_rate: number; rates: Record<string, number> }): number {
  const rate = taxRates.rates[String(idTaxRulesGroup)] ?? taxRates.default_rate;
  return Math.round(price * (1 + rate / 100) * 100) / 100;
}


export interface PrestaProduct {
  id: number;
  name: string;
  price: number;
  reference: string;
  descriptionShort: string;
  description: string;
  active: boolean;
  idCategoryDefault: number;
  idDefaultImage: number | null;
  dateAdd: string | null;
  onSale: boolean;
  isNew: boolean;
  images: number[];
  manufacturerName: string;
  idManufacturer: number;
  manufacturerLinkRewrite: string;
  linkRewrite: string;
  /** link_rewrite de la catégorie par défaut — segment SEO de l'URL produit Presta */
  categorySlug: string;
  quantity: number;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  condition: string;
  features: Array<{ name: string; value: string }>;
  priceWt: number;
  idTaxRulesGroup: number;
}

export interface PrestaCategory {
  id: number;
  name: string;
  linkRewrite: string;
  idParent: number;
  levelDepth: number;
  active: boolean;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
}

function extractLangValue(field: unknown, defaultLangId = 1): string {
  if (typeof field === 'string') return field;
  if (Array.isArray(field)) {
    const match = field.find((f: { id: string }) => f.id === String(defaultLangId)) || field[0];
    return (match as { value?: string })?.value ?? '';
  }
  return '';
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}


/**
 * Récupère les vraies quantités depuis ps_stock_available
 * (le champ quantity de /api/products est souvent désynchronisé).
 */
async function fetchStocksForProducts(productIds: number[]): Promise<Record<number, number>> {
  if (productIds.length === 0) return {};
  const filter = `[${productIds.join('|')}]`;
  const url = `${API_URL}/stock_availables?ws_key=${API_KEY}&output_format=JSON&display=full&filter[id_product]=${filter}&limit=${productIds.length * 5}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return {};
    const data = await res.json();
    const map: Record<number, number> = {};
    for (const sa of (data.stock_availables || []) as Array<Record<string, unknown>>) {
      // On ne prend que les stocks "produit global" (id_product_attribute = 0)
      if (parseInt(String(sa.id_product_attribute ?? '-1'), 10) === 0) {
        map[parseInt(String(sa.id_product), 10)] = parseInt(String(sa.quantity ?? '0'), 10);
      }
    }
    return map;
  } catch (err) {
    console.error('[Presta] fetchStocksForProducts error:', err);
    return {};
  }
}

/**
 * Stock disponible par ligne panier, en tenant compte des déclinaisons.
 * Retourne une map keyée `${id_product}-${id_product_attribute}` ainsi que
 * `${id_product}-0` (stock global) pour fallback.
 */
export async function fetchStockAvailability(
  items: Array<{ id_product: number; id_product_attribute?: number }>
): Promise<Record<string, number>> {
  const ids = Array.from(new Set(items.map((i) => i.id_product).filter((n) => n > 0)));
  if (ids.length === 0) return {};
  const url = `${API_URL}/stock_availables?ws_key=${API_KEY}&output_format=JSON&display=full&filter[id_product]=[${ids.join('|')}]&limit=${ids.length * 10}`;
  const map: Record<string, number> = {};
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return {};
    const data = await res.json();
    for (const sa of (data.stock_availables || []) as Array<Record<string, unknown>>) {
      const pid = parseInt(String(sa.id_product), 10);
      const attr = parseInt(String(sa.id_product_attribute ?? '0'), 10);
      const qty = parseInt(String(sa.quantity ?? '0'), 10);
      if (pid > 0) map[`${pid}-${attr}`] = qty;
    }
    return map;
  } catch (err) {
    console.error('[Presta] fetchStockAvailability error:', err);
    return {};
  }
}

function normalizeProduct(raw: Record<string, unknown>, taxRates: { default_rate: number; rates: Record<string, number> } = { default_rate: 20, rates: {} }): PrestaProduct {
  const idImg = raw.id_default_image;
  const parsedImg = idImg ? parseInt(String(idImg), 10) : NaN;
  // Parse galerie images via associations.images
  const assocImages = (((raw.associations as Record<string, unknown> | undefined)?.images) as Array<{ id: string }> | undefined) || [];
  const images = assocImages.map((img) => parseInt(String(img.id), 10)).filter((id) => id > 0);
  return {
    id: parseInt(String(raw.id), 10),
    name: decodeHtmlEntities(extractLangValue(raw.name)),
    price: parseFloat(String(raw.price ?? '0')),
    idTaxRulesGroup: parseInt(String(raw.id_tax_rules_group ?? '0'), 10),
    priceWt: applyTaxRate(parseFloat(String(raw.price ?? '0')), parseInt(String(raw.id_tax_rules_group ?? '0'), 10), taxRates),
    reference: decodeHtmlEntities(cleanStr(raw.reference)),
    descriptionShort: decodeHtmlEntities(stripHtml(extractLangValue(raw.description_short))),
    description: extractLangValue(raw.description),
    active: String(raw.active) === '1',
    idCategoryDefault: parseInt(String(raw.id_category_default ?? '0'), 10),
    idDefaultImage: isNaN(parsedImg) || parsedImg <= 0 ? null : parsedImg,
    dateAdd: (raw.date_add as string) || null,
    onSale: Boolean(raw.on_sale && Number(raw.on_sale as string) > 0),
    isNew: (() => {
      const dateStr = raw.date_add;
      if (!dateStr || typeof dateStr !== 'string') return false;
      const added = new Date(dateStr).getTime();
      if (isNaN(added)) return false;
      const days = (Date.now() - added) / (1000 * 60 * 60 * 24);
      return days >= 0 && days < 60;
    })(),
    images,
    manufacturerName: (raw.manufacturer_name && raw.manufacturer_name !== 'false') ? decodeHtmlEntities(String(raw.manufacturer_name)) : '',
    idManufacturer: parseInt(String(raw.id_manufacturer ?? '0'), 10),
    manufacturerLinkRewrite: '',
    linkRewrite: extractLangValue(raw.link_rewrite),
    categorySlug: '',
    quantity: parseInt(String(raw.quantity ?? '0'), 10),
    metaTitle: decodeHtmlEntities(extractLangValue(raw.meta_title)),
    metaDescription: decodeHtmlEntities(extractLangValue(raw.meta_description)),
    metaKeywords: decodeHtmlEntities(extractLangValue(raw.meta_keywords)),
    condition: (() => {
      // Clé brute ('new' | 'used' | 'refurbished') — localisée à l'affichage
      const c = String(raw.condition ?? '').toLowerCase();
      return c === 'new' || c === 'used' || c === 'refurbished' ? c : '';
    })(),
    features: [],
  };
}

function normalizeCategory(c: Record<string, unknown>): PrestaCategory {
  return {
    id: parseInt(String(c.id), 10),
    name: decodeHtmlEntities(extractLangValue(c.name)),
    linkRewrite: extractLangValue(c.link_rewrite),
    metaTitle: decodeHtmlEntities(extractLangValue(c.meta_title)),
    metaDescription: decodeHtmlEntities(extractLangValue(c.meta_description)),
    metaKeywords: decodeHtmlEntities(extractLangValue(c.meta_keywords)),
    idParent: parseInt(String(c.id_parent ?? '0'), 10),
    levelDepth: parseInt(String(c.level_depth ?? '0'), 10),
    active: String(c.active) === '1',
  };
}

export async function fetchProducts(opts: {
  limit?: number;
  language?: number;
  idCategory?: number;
} = {}): Promise<PrestaProduct[]> {
  const params = new URLSearchParams({
    ws_key: API_KEY,
    output_format: 'JSON',
    display: 'full',
    'filter[active]': '1',
    limit: String(opts.limit ?? 20),
    language: String(opts.language ?? 1),
  });
  if (opts.idCategory) {
    params.set('filter[id_category_default]', String(opts.idCategory));
  }
  const url = `${API_URL}/products?${params.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    console.error('[Presta] fetchProducts failed:', res.status);
    return [];
  }
  const data = await res.json();
  const taxRates = await fetchTaxRates();
  const rawProducts = (data.products || []).filter((p: any) => p.active === '1');
  const ids = rawProducts.map((p: any) => parseInt(String(p.id), 10));
  const stocks = await fetchStocksForProducts(ids);
  const normalized = rawProducts.map((raw: any) => {
    const prod = normalizeProduct(raw, taxRates);
    return { ...prod, quantity: stocks[prod.id] ?? prod.quantity };
  });
  return withCategorySlugs(normalized, opts.language ?? 1);
}



/**
 * Résout les features (nom + valeur) à partir des associations product_features
 * de Presta. Nécessite 2 fetchs par feature (feature + feature_value).
 */
async function fetchProductFeatures(
  featureAssocs: Array<{ id: string; id_feature_value: string }>,
  language = 1
): Promise<Array<{ name: string; value: string }>> {
  return Promise.all(
    featureAssocs.map(async (assoc) => {
      try {
        const [fRes, vRes] = await Promise.all([
          fetch(`${API_URL}/product_features/${assoc.id}?ws_key=${API_KEY}&output_format=JSON`, { cache: 'no-store' }),
          fetch(`${API_URL}/product_feature_values/${assoc.id_feature_value}?ws_key=${API_KEY}&output_format=JSON`, { cache: 'no-store' }),
        ]);
        const fData = fRes.ok ? await fRes.json() : null;
        const vData = vRes.ok ? await vRes.json() : null;
        return {
          name: decodeHtmlEntities(extractLangValue(fData?.product_feature?.name, language)),
          value: decodeHtmlEntities(extractLangValue(vData?.product_feature_value?.value, language)),
        };
      } catch {
        return { name: '', value: '' };
      }
    })
  );
}

export async function fetchProduct(id: number, language = 1): Promise<PrestaProduct | null> {
  const url = `${API_URL}/products/${id}?ws_key=${API_KEY}&output_format=JSON&display=full&language=${language}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    if (res.status === 404) return null;
    console.error('[Presta] fetchProduct failed:', res.status);
    return null;
  }
  const data = await res.json();
  const raw = (data.products && data.products[0]) || data.product;
  if (!raw) return null;
  const taxRates = await fetchTaxRates();
  let product = normalizeProduct(raw, taxRates);
  const stocks = await fetchStocksForProducts([product.id]);
  if (stocks[product.id] !== undefined) {
    product = { ...product, quantity: stocks[product.id] };
  }
  // Renseigne le slug de la catégorie par défaut (segment SEO de l'URL produit)
  if (product.idCategoryDefault > 0) {
    const slugMap = await fetchCategorySlugMap([product.idCategoryDefault], language);
    product = { ...product, categorySlug: slugMap[product.idCategoryDefault] ?? '' };
  }
  // Resout les features (Format, Annee, Pays, Genre, etc.) en parallele
  const assocFeatures = (((raw.associations as Record<string, unknown> | undefined)?.product_features) as Array<{ id: string; id_feature_value: string }> | undefined) || [];
  if (assocFeatures.length > 0) {
    const features = await fetchProductFeatures(assocFeatures, language);
    product.features = features.filter((f) => f.name && f.value);
  }
  return product;
}

export async function fetchCategories(language = 1): Promise<PrestaCategory[]> {
  const url = `${API_URL}/categories?ws_key=${API_KEY}&output_format=JSON&display=full&language=${language}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    console.error('[Presta] fetchCategories failed:', res.status);
    return [];
  }
  const data = await res.json();
  return (data.categories || [])
    .map(normalizeCategory)
    .filter((c: PrestaCategory) => c.active && c.id !== 1);
}

/**
 * Catégories de niveau 2 (sous-catégories directes de Home).
 * C'est ce qu'on affiche dans le menu principal.
 */
export async function fetchTopCategories(language = 1): Promise<PrestaCategory[]> {
  const all = await fetchCategories(language);
  // Sur Presta standard : id=1 = root, id=2 = Home. Les top-level ont idParent=2.
  return all.filter((c) => c.idParent === 2);
}

export async function fetchCategory(id: number, language = 1): Promise<PrestaCategory | null> {
  const url = `${API_URL}/categories/${id}?ws_key=${API_KEY}&output_format=JSON&language=${language}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return data.category ? normalizeCategory(data.category) : null;
}

/**
 * Résout les link_rewrite de catégories par lot (pour construire les URLs
 * produit SEO `/{cat-rewrite}/{id}-{rewrite}.html`).
 * Cache en mémoire process pour éviter de refetcher les mêmes catégories.
 */
const _catSlugCache = new Map<number, string>();

async function fetchCategorySlugMap(ids: number[], language = 1): Promise<Record<number, string>> {
  const out: Record<number, string> = {};
  const missing: number[] = [];
  for (const id of Array.from(new Set(ids.filter((i) => i > 0)))) {
    if (_catSlugCache.has(id)) out[id] = _catSlugCache.get(id)!;
    else missing.push(id);
  }
  if (missing.length === 0) return out;
  // URL construite manuellement pour ne PAS encoder les crochets [] (filtre OR Presta)
  const url = `${API_URL}/categories?ws_key=${API_KEY}&output_format=JSON&display=[id,link_rewrite]&filter[id]=[${missing.join('|')}]&language=${language}&limit=${missing.length}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      for (const c of (data.categories || []) as Array<Record<string, unknown>>) {
        const id = parseInt(String(c.id), 10);
        const slug = extractLangValue(c.link_rewrite);
        if (id > 0 && slug) {
          _catSlugCache.set(id, slug);
          out[id] = slug;
        }
      }
    }
  } catch (e) {
    console.error('[Presta] fetchCategorySlugMap error:', e);
  }
  return out;
}

/** Renseigne `categorySlug` sur une liste de produits (mutation immuable). */
async function withCategorySlugs(products: PrestaProduct[], language = 1): Promise<PrestaProduct[]> {
  if (products.length === 0) return products;
  const slugMap = await fetchCategorySlugMap(
    products.map((p) => p.idCategoryDefault),
    language
  );
  return products.map((p) => ({ ...p, categorySlug: slugMap[p.idCategoryDefault] ?? '' }));
}

export function getProductImageUrl(idProduct: number, idImage: number): string {
  return `/api/image/products/${idProduct}/${idImage}`;
}

/**
 * Retourne l'URL d'une image produit. La taille (cover, home_default, thumb) est
 * gérée par le proxy /api/image/products qui peut passer un suffixe.
 */
export function getProductImageUrlSized(productId: number, imageId: number, _size?: string): string {
  return `/api/image/products/${productId}/${imageId}`;
}

/**
 * Fetch plusieurs produits par leurs IDs, en préservant l'ordre.
 * Utilise le filtre OR (|) de l'API Presta : filter[id]=[1|2|3].
 */
export async function fetchProductsByIds(ids: number[], language = 1): Promise<PrestaProduct[]> {
  const uniqueIds = Array.from(new Set(ids.filter((id) => id > 0)));
  if (uniqueIds.length === 0) return [];

  const params = new URLSearchParams({
    ws_key: API_KEY,
    output_format: 'JSON',
    display: 'full',
    'filter[id]': `[${uniqueIds.join('|')}]`,
    'filter[active]': '1',
    limit: String(uniqueIds.length),
    language: String(language),
  });
  const url = `${API_URL}/products?${params.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    console.error('[Presta] fetchProductsByIds failed:', res.status);
    return [];
  }
  const data = await res.json();
  const taxRates = await fetchTaxRates();
  const rawProducts = (data.products || []).filter((p: any) => p.active === '1');
  const productIds = rawProducts.map((p: any) => parseInt(String(p.id), 10));
  const stocks = await fetchStocksForProducts(productIds);
  const products: PrestaProduct[] = rawProducts.map((raw: any) => {
    const prod = normalizeProduct(raw, taxRates);
    return { ...prod, quantity: stocks[prod.id] ?? prod.quantity };
  });

  // Préserve l'ordre des IDs en entrée (Presta peut retourner dans un ordre arbitraire)
  const orderMap = new Map(uniqueIds.map((id, i) => [id, i]));
  products.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
  return withCategorySlugs(products, language);
}

/**
 * Fetch IDs des produits associés à une catégorie via ps_category_product
 * (table de jointure, pas juste id_category_default).
 * Reverse pour avoir les plus récents en premier (associations triées asc).
 */
export async function fetchCategoryProductIds(
  idCat: number,
  page = 1,
  perPage = 30
): Promise<{ ids: number[]; total: number }> {
  const url = `${API_URL}/categories/${idCat}?ws_key=${API_KEY}&output_format=JSON&display=full&language=1`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return { ids: [], total: 0 };
  const data = await res.json();
  const cat = (data.categories && data.categories[0]) || data.category;
  if (!cat) return { ids: [], total: 0 };
  const products = (cat.associations && cat.associations.products) || [];
  const reversed = [...products].reverse();
  const start = (page - 1) * perPage;
  const ids = reversed
    .slice(start, start + perPage)
    .map((p: { id: string }) => parseInt(p.id, 10))
    .filter((id: number) => id > 0);
  return { ids, total: reversed.length };
}


// ─── Extra fields (banniere "Expedition offerte" etc. via zoneproductadditional) ───
export interface ExtraField {
  id: number;
  hook: string;
  scope: string;
  title: string;
  content: string;
  customClass: string;
  position: number;
}

export async function fetchExtraFields(idProduct?: number): Promise<ExtraField[]> {
  const key = process.env.PRESTA_API_KEY || '5KC84V1MI8YJR54U4HSZWFK4IQG2RS28';
  const apiUrl = process.env.PRESTA_API_URL || 'https://test4.jewelme.fr/api';
  const base = apiUrl.replace(/\/api\/?$/, '');
  const params = new URLSearchParams({ ws_key: key });
  if (idProduct) params.set('id_product', String(idProduct));
  const url = `${base}/headless/extra_fields?${params}`;
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.extra_fields || []).map((f: any) => ({
      id: f.id,
      hook: f.hook,
      scope: f.scope,
      title: f.title || '',
      content: f.content || '',
      customClass: f.custom_class || '',
      position: f.position,
    }));
  } catch {
    return [];
  }
}

export interface PrestaManufacturer {
  id: number;
  name: string;
  linkRewrite: string;
  description: string;
  shortDescription: string;
  active: boolean;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
}

export async function fetchManufacturer(id: number, language: number = 1): Promise<PrestaManufacturer | null> {
  const url = `${API_URL}/manufacturers/${id}?ws_key=${API_KEY}&output_format=JSON&display=full&language=${language}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = (data.manufacturers && data.manufacturers[0]) || data.manufacturer;
    if (!raw) return null;
    return {
      id: parseInt(String(raw.id), 10),
      name: decodeHtmlEntities(String(raw.name ?? '')),
      linkRewrite: String(raw.link_rewrite ?? ''),
      description: extractLangValue(raw.description),
      shortDescription: decodeHtmlEntities(extractLangValue(raw.short_description)),
      active: String(raw.active) === '1',
      metaTitle: decodeHtmlEntities(extractLangValue(raw.meta_title)),
      metaDescription: decodeHtmlEntities(extractLangValue(raw.meta_description)),
      metaKeywords: decodeHtmlEntities(extractLangValue(raw.meta_keywords)),
    };
  } catch (e) {
    console.error('[fetchManufacturer] failed:', e);
    return null;
  }
}

export async function fetchProductsByManufacturer(idManufacturer: number, language: number = 1): Promise<PrestaProduct[]> {
  // URL construite manuellement pour ne PAS encoder les crochets [] que Presta veut litteraux
  const url = `${API_URL}/products?ws_key=${API_KEY}&output_format=JSON&display=full&language=${language}&filter[id_manufacturer]=${idManufacturer}&filter[active]=1&sort=[id_DESC]&limit=500`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    const taxRates = await fetchTaxRates();
    const rawProducts = (data.products || []).filter((p: { active?: string }) => p.active === '1');
    const ids = rawProducts.map((p: Record<string, unknown>) => parseInt(String(p.id), 10));
    const stocks = await fetchStocksForProducts(ids);
    const normalized = rawProducts.map((raw: Record<string, unknown>) => {
      const prod = normalizeProduct(raw, taxRates);
      return { ...prod, quantity: stocks[prod.id] ?? prod.quantity };
    });
    return withCategorySlugs(normalized, language);
  } catch (e) {
    console.error('[fetchProductsByManufacturer] failed:', e);
    return [];
  }
}

export interface PrestaSupplier {
  id: number;
  name: string;
  linkRewrite: string;
  description: string;
  active: boolean;
  metaTitle: string;
  metaDescription: string;
}

export async function fetchSupplier(id: number, language: number = 1): Promise<PrestaSupplier | null> {
  const url = `${API_URL}/suppliers/${id}?ws_key=${API_KEY}&output_format=JSON&display=full&language=${language}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = (data.suppliers && data.suppliers[0]) || data.supplier;
    if (!raw) return null;
    return {
      id: parseInt(String(raw.id), 10),
      name: decodeHtmlEntities(String(raw.name ?? '')),
      linkRewrite: String(raw.link_rewrite ?? ''),
      description: extractLangValue(raw.description),
      active: String(raw.active) === '1',
      metaTitle: decodeHtmlEntities(extractLangValue(raw.meta_title)),
      metaDescription: decodeHtmlEntities(extractLangValue(raw.meta_description)),
    };
  } catch (e) {
    console.error('[fetchSupplier] failed:', e);
    return null;
  }
}

export async function fetchProductsBySupplier(idSupplier: number, language: number = 1): Promise<PrestaProduct[]> {
  const url = `${API_URL}/products?ws_key=${API_KEY}&output_format=JSON&display=full&language=${language}&filter[id_supplier]=${idSupplier}&filter[active]=1&sort=[id_DESC]&limit=500`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    const taxRates = await fetchTaxRates();
    const rawProducts = (data.products || []).filter((p: { active?: string }) => p.active === '1');
    const ids = rawProducts.map((p: Record<string, unknown>) => parseInt(String(p.id), 10));
    const stocks = await fetchStocksForProducts(ids);
    const normalized = rawProducts.map((raw: Record<string, unknown>) => {
      const prod = normalizeProduct(raw, taxRates);
      return { ...prod, quantity: stocks[prod.id] ?? prod.quantity };
    });
    return withCategorySlugs(normalized, language);
  } catch (e) {
    console.error('[fetchProductsBySupplier] failed:', e);
    return [];
  }
}
