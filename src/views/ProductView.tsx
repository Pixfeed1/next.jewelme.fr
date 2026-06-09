import { fetchProduct, fetchCategory, fetchExtraFields, getProductImageUrl } from '@/lib/presta';
import ProductGallery from '@/components/ProductGallery';
import ProductBadges from '@/components/ProductBadges';
import ProductSamplePlaylist from '@/components/ProductSamplePlaylist';
import ProductCrossSell from '@/components/ProductCrossSell';
import AddToCartBox from '@/components/AddToCartBox';
import MailAlertForm from '@/components/MailAlertForm';
import ShopExtras from '@/components/ShopExtras';
import Link from 'next/link';
import { categoryUrl, productUrl, manufacturerUrl, homeUrl, idLangFromLocale } from '@/lib/url-builder';
import TrackViewItem from '@/components/TrackViewItem';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export async function productMetadata(productId: number, locale: string): Promise<Metadata> {
  const idLang = idLangFromLocale(locale);
  const product = await fetchProduct(productId, idLang);
  if (!product) return {};
  const url = productUrl(product, locale);
  const metaTitle = product.metaTitle || product.name;
  const metaDescription = product.metaDescription || product.descriptionShort || '';
  const urlFr = productUrl(product, 'fr');
  const urlEn = productUrl(product, 'en');
  return {
    title: metaTitle,
    description: metaDescription,
    keywords: product.metaKeywords || undefined,
    alternates: {
      canonical: url,
      languages: { fr: urlFr, en: urlEn, 'x-default': urlFr },
    },
    openGraph: {
      title: metaTitle, description: metaDescription, type: 'website', url,
      images: product.idDefaultImage ? [{ url: `/api/image/products/${product.id}/${product.idDefaultImage}` }] : [],
    },
  };
}

export default async function ProductView({ id, locale }: { id: number; locale: string }) {
  const idLang = idLangFromLocale(locale);
  const product = await fetchProduct(id, idLang);
  const extras = await fetchExtraFields(product?.id);
  if (!product) notFound();

  const trackingNode = <TrackViewItem id={product.id} name={product.name} price={product.price} />;

  const category = product.idCategoryDefault > 0
    ? await fetchCategory(product.idCategoryDefault, idLang).catch(() => null)
    : null;

  const hasLongDescription = product.description && product.description.trim().length > 0;
  const hasFeatures = product.features && product.features.length > 0;

  return (
    <>
      {trackingNode}
    <div style={{ maxWidth: 1280, paddingLeft: 32, paddingRight: 16 }}>
      <p style={{ marginBottom: 24, fontSize: 13 }}>
        <Link href={homeUrl(locale)} style={{ color: '#888', textDecoration: 'none' }}>Accueil</Link>
        {category && (
          <>
            <span style={{ color: '#ccc', margin: '0 8px' }}>›</span>
            <Link href={categoryUrl({ id: category.id, linkRewrite: category.linkRewrite }, locale)} style={{ color: '#888', textDecoration: 'none' }}>
              {category.name}
            </Link>
          </>
        )}
        <span style={{ color: '#ccc', margin: '0 8px' }}>›</span>
        <span style={{ color: '#888' }}>{product.name}</span>
      </p>

      <div style={{ padding: '32px', border: '1px solid #e5e0d6', borderRadius: 4, background: '#fff', marginBottom: 32 }}>
        <div className="product-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 480px) minmax(0, 1fr)', gap: 40, alignItems: 'start' }}>
        <ProductGallery
          productId={product.id}
          productName={product.name}
          images={product.images}
          fallbackImageId={product.idDefaultImage}
          badges={<ProductBadges product={product} />}
        />

        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, marginBottom: 12, lineHeight: 1.3 }}>
            {product.name}
          </h1>
          {product.manufacturerName && (
            <p style={{ color: '#666', fontSize: 14, marginBottom: 8, marginTop: 0 }}>
              Label : {product.idManufacturer > 0 ? (
                <Link href={manufacturerUrl({ id: product.idManufacturer, name: product.manufacturerName }, locale)} style={{ color: 'var(--or-text)', fontWeight: 500, textDecoration: 'none', borderBottom: '1px solid currentColor' }}>{product.manufacturerName}</Link>
              ) : (
                <span style={{ color: 'var(--or-text)', fontWeight: 500 }}>{product.manufacturerName}</span>
              )}
            </p>
          )}
          <p style={{ color: '#888', fontSize: 13, marginBottom: 4, marginTop: 0 }}>
            Référence : {product.reference || '-'}
          </p>
          {product.condition && (
            <p style={{ color: '#888', fontSize: 13, marginBottom: 20, marginTop: 0 }}>
              État : <span style={{ color: 'var(--or-text)', fontWeight: 500 }}>{product.condition}</span>
            </p>
          )}
          <ProductSamplePlaylist
            productId={product.id}
            productName={product.name}
            productLink={productUrl(product, locale)}
            coverUrl={product.idDefaultImage ? getProductImageUrl(product.id, product.idDefaultImage) : undefined}
            variant="button-only"
          />
          <p style={{ fontSize: 30, fontWeight: 700, color: 'var(--or-green)', margin: 0, marginBottom: 4 }}>
            {product.priceWt.toFixed(2)} €
          </p>
          <p style={{ fontSize: 12, color: '#888', margin: 0, marginBottom: 24 }}>
            {locale === 'en' ? 'Incl. VAT plus Shipping Costs' : 'TTC, hors frais de port'}
          </p>
          {product.descriptionShort && (
            <p style={{ color: '#444', lineHeight: 1.6, marginBottom: 24, fontSize: 14 }}>
              {product.descriptionShort}
            </p>
          )}
          <AddToCartBox product={product} />
          {(product.quantity ?? 0) <= 0 && (
            <MailAlertForm idProduct={product.id} productName={product.name} />
          )}
          <ShopExtras extras={extras} />
          {hasFeatures && (
            <section style={{ marginTop: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Détails de l&apos;article
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <tbody>
                  {product.features.map((f, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#f7f5f0' : '#fff' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 500, color: '#555', width: '45%', borderBottom: '1px solid #e5e0d6' }}>
                        {f.name}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#333', borderBottom: '1px solid #e5e0d6' }}>
                        {f.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>
        </div>
      </div>

      {hasLongDescription && (
        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Plus d&apos;informations
          </h2>
          <div
            style={{ lineHeight: 1.7, fontSize: 14, color: '#333', padding: '20px 24px', border: '1px solid #e5e0d6', borderRadius: 4, background: '#fff' }}
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </section>
      )}

      <section style={{ marginTop: 32, marginBottom: 32 }}>
        <ProductSamplePlaylist
          productId={product.id}
          productName={product.name}
          productLink={productUrl(product, locale)}
          coverUrl={product.idDefaultImage ? getProductImageUrl(product.id, product.idDefaultImage) : undefined}
          variant="list-only"
        />
      </section>
      <ProductCrossSell productId={product.id} />
    </div>
    </>
  );
}
