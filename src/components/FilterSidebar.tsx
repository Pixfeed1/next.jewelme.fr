'use client';
import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { FilterGroup, FilterValue } from '@/lib/filters';
import { useT } from '@/lib/i18n';

interface Props {
  groups: FilterGroup[];
}

export default function FilterSidebar({ groups }: Props) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const openHandler = () => setMobileOpen(true);
    window.addEventListener('open-filter-drawer', openHandler);
    return () => window.removeEventListener('open-filter-drawer', openHandler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Read currently selected filters from URL
  const [selected, setSelected] = useState<Record<string, (string | number)[]>>({});
  useEffect(() => {
    const next: Record<string, (string | number)[]> = {};
    searchParams.forEach((value, key) => {
      if (!key.startsWith('f_')) return;
      const type = key.slice(2);
      next[type] = value.split(',').filter(Boolean);
    });
    setSelected(next);
  }, [searchParams]);

  if (!groups || groups.length === 0) return null;

  const pushFilters = (updated: Record<string, (string | number)[]>) => {
    const params = new URLSearchParams(searchParams.toString());
    // Remove all f_* entries first
    Array.from(params.keys()).forEach(k => { if (k.startsWith('f_')) params.delete(k); });
    // Add the active ones
    for (const [type, values] of Object.entries(updated)) {
      if (values.length > 0) params.set(`f_${type}`, values.join(','));
    }
    params.delete('page'); // reset pagination
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  const toggle = (groupType: string, value: string | number) => {
    setSelected(prev => {
      const arr = (prev[groupType] ?? []).map(String);
      const v = String(value);
      const exists = arr.includes(v);
      const next = exists ? arr.filter(x => x !== v) : [...arr, v];
      const updated = { ...prev, [groupType]: next };
      pushFilters(updated);
      return updated;
    });
  };

  const reset = () => {
    setSelected({});
    pushFilters({});
  };

  const totalSelected = Object.values(selected).reduce((s, arr) => s + arr.length, 0);

  return (
    <>
      {mobileOpen && <div className="filter-backdrop" onClick={() => setMobileOpen(false)} />}
      <aside className={`filter-sidebar${mobileOpen ? ' mobile-open' : ''}`} style={{ opacity: isPending ? 0.6 : 1, transition: 'opacity 0.2s' }}>
        <div className="filter-mobile-header">
          <span>{t('filters')}</span>
          <button type="button" onClick={() => setMobileOpen(false)} aria-label="Fermer">
            <i className="material-icons" style={{ fontSize: 24 }}>close</i>
          </button>
        </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '2px solid #333' }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('filters')} {isPending && '...'}
        </h3>
        {totalSelected > 0 && (
          <button onClick={reset} style={{ background: 'none', border: 0, color: '#888', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
            {t('clear_all')} ({totalSelected})
          </button>
        )}
      </div>

      {groups.map(group => {
        const isOpen = !collapsed[group.id];
        const groupName = group.name.trim() || group.type;
        return (
          <div key={group.id} style={{ borderBottom: '1px solid #e5e0d6', padding: '12px 0' }}>
            <button onClick={() => setCollapsed(p => ({ ...p, [group.id]: isOpen }))}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 0, padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#333', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              <span>{groupName}</span>
              <i className="material-icons" style={{ fontSize: 18, color: '#666' }}>{isOpen ? 'expand_less' : 'expand_more'}</i>
            </button>

            {isOpen && (
              <div style={{ marginTop: 10, maxHeight: 280, overflowY: 'auto' }}>
                {group.values.map((v: FilterValue) => {
                  const isSelected = (selected[group.type] ?? []).map(String).includes(String(v.id));
                  return (
                    <label key={String(v.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 13, color: isSelected ? '#333' : '#666' }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggle(group.type, v.id)}
                        style={{ accentColor: '#333', cursor: 'pointer' }} />
                      <span style={{ flex: 1, fontWeight: isSelected ? 600 : 400 }}>{v.name}</span>
                      <span style={{ color: '#aaa', fontSize: 11 }}>({v.count})</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      </aside>
    </>
  );
}
