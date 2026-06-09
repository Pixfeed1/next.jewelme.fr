'use client';
import { useT } from '@/lib/i18n';

export default function FilterToolbarButton() {
  const t = useT();
  return (
    <button
      type="button"
      className="filter-toolbar-button"
      onClick={() => window.dispatchEvent(new Event('open-filter-drawer'))}
      aria-label={t('filters')}
    >
      <i className="material-icons" style={{ fontSize: 18 }}>tune</i>
      <span>{t('filters')}</span>
    </button>
  );
}
