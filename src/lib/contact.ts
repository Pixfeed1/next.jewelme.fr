import { decodeHtmlEntities } from './text-utils';

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
    const info: ContactInfo = await res.json();
    if (info?.name) info.name = decodeHtmlEntities(info.name);
    if (info?.city) info.city = decodeHtmlEntities(info.city);
    if (info?.country) info.country = decodeHtmlEntities(info.country);
    return info;
  } catch { return null; }
}

export async function fetchContactSubjects(): Promise<ContactSubject[]> {
  try {
    const res = await fetch(`${BASE}/headless/contact_subjects?ws_key=${PRESTA_API_KEY}`, { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const subjects: ContactSubject[] = data.subjects || [];
    for (const s of subjects) {
      if (s.name) s.name = decodeHtmlEntities(s.name);
      if (s.description) s.description = decodeHtmlEntities(s.description);
    }
    return subjects;
  } catch { return []; }
}
