'use client';
import { useEffect } from 'react';
import { trackPurchase } from '@/lib/gtag';

interface Item { id_product: number; name: string; quantity: number; price_wt: number; }
interface Props {
  reference: string;
  total: number;
  items: Item[];
}

export default function TrackPurchase({ reference, total, items }: Props) {
  useEffect(() => {
    trackPurchase(
      reference,
      total,
      items.map(it => ({
        item_id: it.id_product,
        item_name: it.name,
        price: it.price_wt,
        quantity: it.quantity,
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
