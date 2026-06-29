'use client';
import { useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import { useCart } from './cart-context';

export interface CustomerAddress {
  id_address: number;
  alias: string;
  firstname: string;
  lastname: string;
  address1: string;
  address2: string;
  postcode: string;
  city: string;
  id_country: number;
  phone: string;
  phone_mobile: string;
}

function normalize(a: Record<string, unknown>): CustomerAddress {
  return {
    id_address: parseInt(String(a.id_address ?? '0'), 10),
    alias: String(a.alias ?? ''),
    firstname: String(a.firstname ?? ''),
    lastname: String(a.lastname ?? ''),
    address1: String(a.address1 ?? ''),
    address2: String(a.address2 ?? ''),
    postcode: String(a.postcode ?? ''),
    city: String(a.city ?? ''),
    id_country: parseInt(String(a.id_country ?? '0'), 10),
    phone: String(a.phone ?? ''),
    phone_mobile: String(a.phone_mobile ?? ''),
  };
}

/**
 * Adresses enregistrees du client connecte (via le token du cart rattache).
 * Visiteur => liste vide, aucun appel.
 */
export function useCustomerAddresses() {
  const { user } = useAuth();
  const { cart } = useCart();
  const token = cart?.token || '';
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      setAddresses([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch('/api/customer-addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setAddresses(d?.success && Array.isArray(d.addresses) ? d.addresses.map(normalize) : []);
      })
      .catch(() => { if (!cancelled) setAddresses([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, token]);

  return { addresses, loading };
}
