const PRESTA_API_URL = process.env.PRESTA_API_URL || '';
const PRESTA_API_KEY = process.env.PRESTA_API_KEY || '';
const BASE = PRESTA_API_URL.replace(/\/api\/?$/, '');

export interface ContactInfo {
  name: string;
  address1: string;
  address2: string;
  city: string;
  postcode: string;
  country_id: number;
  country: string;
  email: string;
  phone: string;
  fax: string;
}

export interface ContactSubject {
  id: number;
  name: string;
  description: string;
  email: string;
  customer_service: boolean;
}

export async function fetchContactInfo(): Promise<ContactInfo | null> {
  try {
    const res = await fetch(`${BASE}/headless/contact_info?ws_key=${PRESTA_API_KEY}`, { next: { revalidate: 600 } });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function fetchContactSubjects(): Promise<ContactSubject[]> {
  try {
    const res = await fetch(`${BASE}/headless/contact_subjects?ws_key=${PRESTA_API_KEY}`, { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.subjects || [];
  } catch { return []; }
}
