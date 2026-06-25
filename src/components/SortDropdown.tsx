'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { useT } from '@/lib/i18n';

export type SortKey = 'position-asc' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'date_add-desc' | 'relevance-asc';

export default function SortDropdown({ current, mode = 'category' }: { current: SortKey; mode?: 'category' | 'search' }) {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const OPTIONS: { value: SortKey; label: string }[] = mode === 'search'
    ? [
        { value: 'relevance-asc', label: t('sort_relevance') },
        { value: 'name-asc', label: t('sort_name_asc') },
        { value: 'name-desc', label: t('sort_name_desc') },
        { value: 'price-asc', label: t('sort_price_asc') },
        { value: 'price-desc', label: t('sort_price_desc') },
      ]
    : [
        { value: 'date_add-desc', label: t('sort_relevance') },
        { value: 'name-asc', label: t('sort_name_asc') },
        { value: 'name-desc', label: t('sort_name_desc') },
        { value: 'price-asc', label: t('sort_price_asc') },
        { value: 'price-desc', label: t('sort_price_desc') },
      ];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value as SortKey;
    const sp = new URLSearchParams(params.toString());
    if (v === 'date_add-desc' || (mode === 'search' && v === 'relevance-asc')) {
      sp.delete('orderby');
      sp.delete('orderdir');
    } else {
      const [orderby, orderdir] = v.split('-');
      sp.set('orderby', orderby);
      sp.set('orderdir', orderdir);
    }
    sp.delete('page');
    const qs = sp.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
      <span style={{ color: '#666', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>{t('sort_by')}</span>
      <select value={current} onChange={handleChange}
        style={{ padding: '6px 28px 6px 10px', border: '1px solid var(--or-grey-lighter)', borderRadius: 4, background: '#fff', fontSize: 13, cursor: 'pointer', minWidth: 180 }}>
        {OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
