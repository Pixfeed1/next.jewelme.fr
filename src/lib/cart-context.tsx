'use client';
import { trackAddToCart, trackRemoveFromCart } from './gtag';
import { decodeHtmlEntities } from './text-utils';
import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';

export interface CartItem {
  id_product: number;
  id_product_attribute: number;
  name: string;
  reference: string;
  price: number;
  price_wt: number;
  quantity: number;
  total: number;
  total_wt: number;
  attributes: string;
  link_rewrite: string;
  image_id: number | null;
  in_stock?: boolean;
  /** stock disponible (rempli par /api/cart*) pour borner la quantité */
  quantity_available?: number;
}

export interface CartTotals {
  subtotal: number;
  subtotal_wt: number;
  shipping: number;
  total: number;
  tax?: number;
  display_ht?: boolean;
  discounts?: number;
}

export interface CartState {
  token: string;
  id_cart: number | null;
  items: CartItem[];
  totals: CartTotals;
  item_count: number;
  vouchers_applied?: Array<{ id_cart_rule: number; code: string; name: string; value_real: number; value_tax_exc: number }>;
  currency: { iso: string; symbol: string };
}

interface CartContextValue {
  cart: CartState | null;
  loading: boolean;
  error: string;
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  addItem: (id_product: number, qty?: number, id_product_attribute?: number) => Promise<boolean>;
  updateItem: (id_product: number, qty: number, id_product_attribute?: number) => Promise<boolean>;
  removeItem: (id_product: number, id_product_attribute?: number) => Promise<boolean>;
  applyVoucher: (code: string) => Promise<{ ok: boolean; error?: string }>;
  removeVoucher: (id_cart_rule: number) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const CartCtx = createContext<CartContextValue | null>(null);
const TOKEN_KEY = 'pixfeed_cart_token';

/** Décode les entités HTML (`&amp;` → `&`) dans les noms affichés du panier. */
function decodeCart(c: CartState | null): CartState | null {
  if (!c) return c;
  if (Array.isArray(c.items)) {
    for (const it of c.items) if (it.name) it.name = decodeHtmlEntities(it.name);
  }
  if (Array.isArray(c.vouchers_applied)) {
    for (const v of c.vouchers_applied) if (v.name) v.name = decodeHtmlEntities(v.name);
  }
  return c;
}

function genToken(): string {
  // Presta secure_key max 32 chars : on supprime les tirets de l'UUID (=32 chars)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '');
  // Fallback : 32 chars hex
  return (Date.now().toString(36) + Math.random().toString(36).slice(2)).slice(0, 32).padEnd(32, '0');
}

function getOrCreateToken(): string {
  if (typeof window === 'undefined') return '';
  let t = localStorage.getItem(TOKEN_KEY);
  if (!t) {
    t = genToken();
    localStorage.setItem(TOKEN_KEY, t);
  }
  return t;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCartRaw] = useState<CartState | null>(null);
  // Décode les entités HTML des noms (produits, bons de réduction) renvoyés par Presta
  const setCart: typeof setCartRaw = (value) => {
    if (typeof value === 'function') { setCartRaw(value); return; }
    setCartRaw(decodeCart(value));
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);

  // Miroir du panier courant pour pouvoir restaurer l'état précédent
  // (évite que la ligne disparaisse si Presta refuse une qty > stock).
  const cartRef = useRef<CartState | null>(cart);
  useEffect(() => { cartRef.current = cart; }, [cart]);

  const refresh = useCallback(async (forcedToken?: string) => {
    const token = forcedToken ?? getOrCreateToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cart?token=${encodeURIComponent(token)}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // A la deconnexion : on abandonne le panier courant en generant un nouveau
  // token (= panier vide) puis on resynchronise. Le panier ne suit donc pas
  // d'un compte a l'autre sur le meme navigateur.
  const resetCart = useCallback(() => {
    let fresh = '';
    if (typeof window !== 'undefined') {
      fresh = genToken();
      localStorage.setItem(TOKEN_KEY, fresh);
    }
    setCart(null);
    setPanelOpen(false);
    refresh(fresh || undefined);
  }, [refresh]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onLogout = () => resetCart();
    window.addEventListener('pixfeed:logout', onLogout);
    return () => window.removeEventListener('pixfeed:logout', onLogout);
  }, [resetCart]);

  const addItem = useCallback(async (id_product: number, qty = 1, id_product_attribute = 0): Promise<boolean> => {
    const token = getOrCreateToken();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, id_product, id_product_attribute, qty }),
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        setCart(data);
        setPanelOpen(true);
        return true;
      }
      setError(data.error || 'Erreur ajout panier');
      return false;
    } catch (e) {
      setError(String(e));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateItem = useCallback(async (id_product: number, qty: number, id_product_attribute = 0): Promise<boolean> => {
    const token = getOrCreateToken();

    // Snapshot avant modif (pour restaurer si le serveur refuse une hausse de qty)
    const prevCart = cartRef.current;
    const prevItem = prevCart?.items.find(
      (it) => it.id_product === id_product && it.id_product_attribute === id_product_attribute
    );
    const isIncrease = !!prevItem && qty > prevItem.quantity;

    // 1. OPTIMISTIC : update UI immediately
    setCart((prev) => {
      if (!prev) return prev;
      const items = prev.items
        .map((it) => {
          if (it.id_product === id_product && it.id_product_attribute === id_product_attribute) {
            if (qty <= 0) return null; // remove
            const newTotal = it.price * qty;
            const newTotalWt = it.price_wt * qty;
            return { ...it, quantity: qty, total: newTotal, total_wt: newTotalWt };
          }
          return it;
        })
        .filter(Boolean) as typeof prev.items;

      const newItemCount = items.reduce((s, it) => s + it.quantity, 0);
      const newSubtotalWt = items.reduce((s, it) => s + it.total_wt, 0);
      const newSubtotal = items.reduce((s, it) => s + it.total, 0);
      const newTotal = newSubtotalWt + prev.totals.shipping - (prev.totals.discounts ?? 0);

      return {
        ...prev,
        items,
        item_count: newItemCount,
        totals: {
          ...prev.totals,
          subtotal: newSubtotal,
          subtotal_wt: newSubtotalWt,
          total: newTotal,
        },
      };
    });

    // 2. Server sync en arriere-plan
    try {
      const res = await fetch('/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, id_product, id_product_attribute, qty }),
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        setCart(data); // remplace par les vrais totaux serveur (TVA, etc.)
        return true;
      }
      // Échec sur une HAUSSE de quantité (stock insuffisant) : on NE supprime pas
      // la ligne — on restaure l'état précédent du panier tel quel.
      if (isIncrease && prevCart) {
        setCart(prevCart);
        setError(data.error || 'Stock maximum atteint');
        return false;
      }
      // Autres cas : refresh pour resynchroniser sur la vérité serveur
      const refreshRes = await fetch(`/api/cart?token=${encodeURIComponent(token)}`);
      const refreshData = await refreshRes.json();
      if (refreshRes.ok) setCart(refreshData);
      setError(data.error || 'Erreur update panier');
      return false;
    } catch (e) {
      setError(String(e));
      return false;
    }
  }, []);

  const removeItem = useCallback((id_product: number, id_product_attribute = 0) => {
    return updateItem(id_product, 0, id_product_attribute);
  }, [updateItem]);


  const applyVoucher = useCallback(async (code: string): Promise<{ ok: boolean; error?: string }> => {
    const token = getOrCreateToken();
    try {
      const res = await fetch('/api/cart/voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, code }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.cart) {
        setCart(data.cart);
        return { ok: true };
      }
      return { ok: false, error: data.error || 'Code invalide' };
    } catch (e: any) {
      return { ok: false, error: e.message || 'Erreur reseau' };
    }
  }, []);

  const removeVoucher = useCallback(async (id_cart_rule: number): Promise<boolean> => {
    const token = getOrCreateToken();
    try {
      const res = await fetch('/api/cart/voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, code: String(id_cart_rule), remove: true, id_cart_rule }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.cart) {
        setCart(data.cart);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return (
    <CartCtx.Provider value={{ cart, loading, error, panelOpen, openPanel: () => setPanelOpen(true), closePanel: () => setPanelOpen(false), addItem, updateItem, removeItem, applyVoucher, removeVoucher, refresh }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart(): CartContextValue {
  const v = useContext(CartCtx);
  if (!v) {
    // Fallback : when called outside provider (SSG of _not-found etc.)
    return {
      cart: null,
      loading: false,
      error: '',
      panelOpen: false,
      openPanel: () => {},
      closePanel: () => {},
      addItem: async () => false,
      updateItem: async () => false,
      removeItem: async () => false,
      applyVoucher: async () => ({ ok: false }),
      removeVoucher: async () => false,
      refresh: async () => {},
    };
  }
  return v;
}
