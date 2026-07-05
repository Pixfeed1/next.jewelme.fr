'use client';
/**
 * Surcharge des prix pour un client connecte (groupes tarifaires Presta).
 *
 * Principe : les prix publics sont rendus normalement (SSR). Cote client, si un
 * utilisateur est connecte, on interroge `customer_prices` (via /api/customer-prices)
 * avec le token du cart + les ids des produits affiches, puis on remplace le prix
 * affiche. Visiteur non connecte => aucun appel, comportement public inchange.
 */
import {
  createContext, useContext, useState, useRef, useCallback, useEffect, useMemo, ReactNode,
} from 'react';
import { useAuth } from './auth-context';
import { useCart } from './cart-context';

interface PriceEntry { price: number; price_ht: number; }

interface CustomerPricesValue {
  displayHt: boolean;
  prices: Record<number, PriceEntry>;
  requestIds: (ids: number[]) => void;
}

const Ctx = createContext<CustomerPricesValue | null>(null);

export function CustomerPricesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { cart } = useCart();
  const token = cart?.token || '';
  const enabled = !!user;

  const [prices, setPrices] = useState<Record<number, PriceEntry>>({});
  const [displayHt, setDisplayHt] = useState(false);

  const requestedRef = useRef<Set<number>>(new Set()); // tous les ids vus
  const fetchedRef = useRef<Set<number>>(new Set());   // ids deja interroges
  const pendingRef = useRef<Set<number>>(new Set());   // ids en attente d'envoi
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (!user) return;
    const ids = Array.from(pendingRef.current).filter((id) => !fetchedRef.current.has(id));
    pendingRef.current.clear();
    if (ids.length === 0) return;
    ids.forEach((id) => fetchedRef.current.add(id));
    try {
      const res = await fetch('/api/customer-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ids }),
      });
      const data = await res.json();
      if (data?.success && data.prices) {
        if (typeof data.display_ht === 'boolean') setDisplayHt(data.display_ht);
        setPrices((prev) => {
          const next = { ...prev };
          for (const [k, v] of Object.entries(data.prices as Record<string, { price?: unknown; price_ht?: unknown }>)) {
            const id = parseInt(k, 10);
            const price = Number(v?.price) || 0;
            const price_ht = Number(v?.price_ht) || 0;
            // Ignore les entrees a 0 (produit sans correspondance) => prix public conserve
            if (id > 0 && (price > 0 || price_ht > 0)) next[id] = { price, price_ht };
          }
          return next;
        });
      }
    } catch {
      /* echec silencieux : on garde les prix publics */
    }
  }, [user, token]);

  const scheduleFlush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { flush(); }, 60);
  }, [flush]);

  const requestIds = useCallback((ids: number[]) => {
    let added = false;
    for (const id of ids) {
      if (!(id > 0)) continue;
      requestedRef.current.add(id);
      if (!fetchedRef.current.has(id)) { pendingRef.current.add(id); added = true; }
    }
    if (added && enabled) scheduleFlush();
  }, [enabled, scheduleFlush]);

  // Connexion / token pret => (re)interroge tous les ids connus (prix par client).
  // Deconnexion => on efface la surcharge (retour aux prix publics).
  useEffect(() => {
    if (enabled) {
      fetchedRef.current.clear();
      pendingRef.current = new Set(requestedRef.current);
      setPrices({});
      setDisplayHt(false);
      if (requestedRef.current.size > 0) scheduleFlush();
    } else {
      fetchedRef.current.clear();
      pendingRef.current.clear();
      setPrices({});
      setDisplayHt(false);
    }
  }, [enabled, user, token, scheduleFlush]);

  const value = useMemo<CustomerPricesValue>(
    () => ({ displayHt, prices, requestIds }),
    [displayHt, prices, requestIds]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export interface CustomerPriceDisplay { amount: number; isHt: boolean; }

/**
 * Retourne le prix client a afficher pour un produit, ou null si aucun
 * (visiteur, hors provider, ou pas de surcharge => garder le prix public).
 */
export function useCustomerPrice(id: number): CustomerPriceDisplay | null {
  const ctx = useContext(Ctx);
  const requestIds = ctx?.requestIds;
  useEffect(() => {
    if (requestIds && id > 0) requestIds([id]);
  }, [requestIds, id]);
  if (!ctx) return null;
  const e = ctx.prices[id];
  if (!e) return null;
  const amount = ctx.displayHt ? e.price_ht : e.price;
  if (!amount || amount <= 0) return null;
  return { amount, isHt: ctx.displayHt };
}
