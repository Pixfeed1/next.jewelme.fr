'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { useT } from '@/lib/i18n';

export type ViewMode = 'grid' | 'list' | 'table';

export default function ViewSwitcher({ current }: { current: ViewMode }) {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const setView = (v: ViewMode) => {
    const sp = new URLSearchParams(params.toString());
    if (v === 'grid') sp.delete('view'); else sp.set('view', v);
    const qs = sp.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  const btnStyle = (active: boolean): React.CSSProperties => ({
    background: 'none',
    border: 0,
    padding: 6,
    cursor: 'pointer',
    color: active ? '#333' : '#bbb',
    transition: 'color 0.15s',
    display: 'flex',
    alignItems: 'center',
  });

  return (
    <div className="view-switcher" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 13, color: '#666', marginRight: 8, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>{t('view')}</span>
      <button onClick={() => setView('grid')} style={btnStyle(current === 'grid')} title={t("view_grid")} aria-label={t("view_grid")}>
        <i className="material-icons">view_comfy</i>
      </button>
      <button onClick={() => setView('table')} style={btnStyle(current === 'table')} title={t("view_table")} aria-label={t("view_table")}>
        <i className="material-icons">view_headline</i>
      </button>
    </div>
  );
}
