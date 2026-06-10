'use client';
import { useEffect } from 'react';
import { useCart } from '@/lib/cart-context';

/**
 * Après un paiement accepté, le panier a été converti en commande côté Presta.
 * On retire le token du panier courant et on rafraîchit le contexte (un nouveau
 * panier vide sera créé), pour que le badge panier repasse à 0.
 */
export default function ClearCartOnPaid() {
  const { refresh } = useCart();
  useEffect(() => {
    try {
      localStorage.removeItem('pixfeed_cart_token');
    } catch {}
    refresh();
  }, [refresh]);
  return null;
}
