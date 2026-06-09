'use client';
/**
 * GA4 e-commerce events helper.
 * Safely no-op si gtag pas chargé (NEXT_PUBLIC_GA_ID vide).
 */

type GtagItem = {
  item_id: string | number;
  item_name: string;
  price?: number;
  quantity?: number;
  item_category?: string;
  item_brand?: string;
};

function track(event: string, params: Record<string, any>) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', event, params);
}

export function trackViewItem(product: { id: number; name: string; price: number; reference?: string }) {
  track('view_item', {
    currency: 'EUR',
    value: product.price,
    items: [{ item_id: product.id, item_name: product.name, price: product.price }],
  });
}

export function trackAddToCart(product: { id: number; name: string; price: number }, qty = 1) {
  track('add_to_cart', {
    currency: 'EUR',
    value: product.price * qty,
    items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: qty }],
  });
}

export function trackRemoveFromCart(product: { id: number; name: string; price: number }, qty = 1) {
  track('remove_from_cart', {
    currency: 'EUR',
    value: product.price * qty,
    items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: qty }],
  });
}

export function trackBeginCheckout(items: GtagItem[], value: number) {
  track('begin_checkout', { currency: 'EUR', value, items });
}

export function trackPurchase(transactionId: string, value: number, items: GtagItem[]) {
  track('purchase', {
    transaction_id: transactionId,
    currency: 'EUR',
    value,
    items,
  });
}
