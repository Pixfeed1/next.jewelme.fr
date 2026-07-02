'use client';
import { useCustomerPrice } from '@/lib/customer-prices-context';

/**
 * Affiche le prix d'un produit en intégrant l'éventuelle surcharge prix-client.
 * Visiteur / pas de surcharge => prix public (`defaultPriceWt`).
 * Client en groupe HT => price_ht + mention « HT ».
 */
export default function ProductPrice({
  id,
  defaultPriceWt,
  htStyle,
}: {
  id: number;
  defaultPriceWt: number;
  htStyle?: React.CSSProperties;
}) {
  const cp = useCustomerPrice(id);
  const amount = cp ? cp.amount : defaultPriceWt;
  return (
    <span style={{ whiteSpace: 'nowrap' }}>
      {Number(amount).toFixed(2)} €
      {cp?.isHt ? (
        <span style={htStyle ?? { fontSize: '0.72em', fontWeight: 600, marginLeft: 4 }}>HT</span>
      ) : null}
    </span>
  );
}
