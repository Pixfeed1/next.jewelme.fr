import { fetchHomeStructure, HomeStructureBlock, SliderConfig } from '@/lib/headless-api';
import { fetchProductsByIds, PrestaProduct } from '@/lib/presta';
import { getServerIdLang } from '@/lib/server-locale';
import HomeTabs from '@/components/HomeTabs';
import HomeProductSection from '@/components/HomeProductSection';

export const dynamic = 'force-dynamic';

interface ResolvedTab {
  id: number;
  title: string;
  products: PrestaProduct[];
  sliderConfig?: SliderConfig;
  categoryId?: number;
}

interface ResolvedBlock extends HomeStructureBlock {
  resolvedTabs?: ResolvedTab[];
  resolvedProducts?: PrestaProduct[];
}

// Extrait l'id de categorie depuis product_options.selected_category
// (string "17" ou number 17 → 17 ; false ou null ou autre → undefined)

// Construit un slider_config depuis product_options (ZoneTheme stocke ces flags en numerique : "1", "")
function extractSliderConfig(productOptions: unknown): SliderConfig | undefined {
  if (!productOptions || typeof productOptions !== 'object') return undefined;
  const opts = productOptions as Record<string, unknown>;
  const enabled = opts.enable_slider === 1 || opts.enable_slider === '1' || opts.enable_slider === true;
  if (!enabled) return undefined;
  const mobileEnabled = opts.mobile_enable_slider === 1 || opts.mobile_enable_slider === '1' || opts.mobile_enable_slider === true;
  return {
    enabled: true,
    autoplay: opts.auto_scroll === 1 || opts.auto_scroll === '1' || opts.auto_scroll === true,
    columns_desktop: Number(opts.number_column) || 6,
    limit: Number(opts.limit) || 32,
    mobile: {
      enabled: mobileEnabled,
      limit: Number(opts.mobile_limit) || 32,
    },
  };
}

function extractCategoryId(productOptions: unknown): number | undefined {
  if (!productOptions || typeof productOptions !== 'object') return undefined;
  const raw = (productOptions as Record<string, unknown>).selected_category;
  if (typeof raw === 'number' && raw > 0) return raw;
  if (typeof raw === 'string') {
    const n = parseInt(raw, 10);
    return n > 0 ? n : undefined;
  }
  return undefined;
}

export default async function Home() {
  const idLang = await getServerIdLang();
  const structure = await fetchHomeStructure();
  const blocks: ResolvedBlock[] = await Promise.all(
    structure.blocks.map(async (block) => {
      if (block.tabs && block.tabs.length > 0) {
        const resolvedTabs = await Promise.all(
          block.tabs.map(async (tab) => ({
            id: tab.id,
            title: tab.title,
            products: await fetchProductsByIds(tab.product_ids, idLang),
            sliderConfig: extractSliderConfig((tab as unknown as Record<string, unknown>).product_options) || tab.slider_config,
            categoryId: extractCategoryId((tab as unknown as Record<string, unknown>).product_options),
          }))
        );
        return { ...block, resolvedTabs };
      }
      if (block.product_ids && block.product_ids.length > 0) {
        return { ...block, resolvedProducts: await fetchProductsByIds(block.product_ids, idLang) };
      }
      return block;
    })
  );

  return (
    <div>
      {(structure.warning || structure.error) && (
        <div
          style={{
            background: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: 6,
            padding: '12px 16px',
            marginBottom: 24,
            fontSize: 13,
            color: '#7a5e0a',
          }}
        >
          {structure.warning && (
            <p style={{ margin: 0 }}>
              <strong>Note :</strong> {structure.warning}
            </p>
          )}
          {structure.error && (
            <p style={{ margin: 0 }}>
              <strong>Erreur :</strong> {structure.error}
            </p>
          )}
          <p style={{ margin: 0, marginTop: 4, fontSize: 12 }}>
            Branche-toi sur OnlyRoots prod (variables PRESTA_API_URL et PRESTA_API_KEY) pour voir les vraies donnees.
          </p>
        </div>
      )}
      {blocks.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
          <p>Aucun bloc home configure.</p>
        </div>
      ) : (
        blocks.map((block) => {
          if (block.resolvedTabs) {
            return <HomeTabs key={block.id} tabs={block.resolvedTabs} />;
          }
          if (block.resolvedProducts) {
            return (
              <HomeProductSection
                key={block.id}
                title={block.title}
                products={block.resolvedProducts}
                sliderConfig={extractSliderConfig((block as unknown as Record<string, unknown>).product_options) || block.slider_config}
                categoryId={extractCategoryId((block as unknown as Record<string, unknown>).product_options)}
              />
            );
          }
          if (block.static_html) {
            return (
              <section
                key={block.id}
                style={{ marginBottom: 48 }}
                dangerouslySetInnerHTML={{ __html: block.static_html }}
              />
            );
          }
          return null;
        })
      )}
    </div>
  );
}
