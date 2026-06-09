const PRESTA_API_URL = process.env.PRESTA_API_URL || '';
const PRESTA_API_KEY = process.env.PRESTA_API_KEY || '';
const BASE = PRESTA_API_URL.replace(/\/api\/?$/, '');

export interface PowerfulFormField {
  id: number;
  type: string;
  name: string;
  label: string;
  required: boolean;
  position: number;
  related: string;
  classname: string;
  values: string;
}

export interface PowerfulForm {
  id: number;
  title: string;
  header: string;
  footer: string;
  send_label: string;
  success: string;
  is_only_connected: boolean;
  fields: PowerfulFormField[];
}

export async function fetchPowerfulForm(id: number, idLang: number = 1): Promise<PowerfulForm | null> {
  const url = `${BASE}/headless/powerful_form?id=${id}&id_lang=${idLang}&ws_key=${PRESTA_API_KEY}`;
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
