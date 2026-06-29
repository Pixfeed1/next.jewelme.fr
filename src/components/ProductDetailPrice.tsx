'use client';
import { useCustomerPrice } from '@/lib/customer-prices-context';

/**
 * Bloc prix de la fiche produit : grand prix + sous-titre TTC/HT.
 * Reprend la surcharge prix-client (mention « HT » + sous-titre adapte).
 */
export default function ProductDetailPrice({
  id,
  defaultPriceWt,
  locale,
}: {
  id: number;
  defaultPriceWt: number;
  locale: string;
}) {
  const cp = useCustomerPrice(id);
  const amount = cp ? cp.amount : defaultPriceWt;
  const isHt = !!cp?.isHt;
  const subtitle = isHt
    ? (locale === 'en' ? 'Excl. VAT, plus shipping costs' : 'HT, hors frais de port')
    : (locale === 'en' ? 'Incl. VAT plus Shipping Costs' : 'TTC, hors frais de port');

  return (
    <>
      <p style={{ fontSize: 30, fontWeight: 700, color: 'var(--or-green)', margin: 0, marginBottom: 4 }}>
        {Number(amount).toFixed(2)} €
        {isHt ? <span style={{ fontSize: 18, marginLeft: 6 }}>HT</span> : null}
      </p>
      <p style={{ fontSize: 12, color: '#888', margin: 0, marginBottom: 24 }}>{subtitle}</p>
    </>
  );
}
