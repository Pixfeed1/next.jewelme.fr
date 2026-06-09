'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/lib/locale-context';
import type { PrestaProduct } from '@/lib/presta';
import type { SliderConfig } from '@/lib/headless-api';
import ProductCard from './ProductCard';
import ProductCarousel from './ProductCarousel';

interface TabData {
  id: number;
  title: string;
  products: PrestaProduct[];
  sliderConfig?: SliderConfig;
  categoryId?: number;
}

interface Props { tabs: TabData[]; }

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="14" fill="currentColor" aria-hidden="true" style={{ marginLeft: 6 }}>
    <path d="M22 12l-4-4v3H3v2h15v3z"/>
  </svg>
);

export default function HomeTabs({ tabs }: Props) {
  const { locale } = useLocale();
  const [activeId, setActiveId] = useState<number>(tabs[0]?.id ?? 0);
  if (tabs.length === 0) return null;
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];
  const useCarousel = active.sliderConfig?.enabled === true;

  return (
    <section style={{ marginBottom: 48 }}>
      <div style={{ marginBottom: 4 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveId(tab.id)}
              className="home-tab-btn"
              style={{
                padding: '8px 4px',
                border: 'none',
                background: 'transparent',
                color: activeId === tab.id ? '#1a1a1a' : '#999',
                fontSize: 18,
                fontWeight: 700,
                fontFamily: '"Roboto Condensed", "Roboto", sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                cursor: 'pointer',
                transition: 'color 0.2s ease',
              }}
            >
              {tab.title}
            </button>
          ))}
        </div>
      </div>
      {active.products.length === 0 ? (
        <p style={{ color: '#888', fontStyle: 'italic', padding: 16 }}>Aucun produit dans cet onglet.</p>
      ) : (
        <>
          {useCarousel ? (
            <ProductCarousel products={active.products} config={active.sliderConfig!} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
              {active.products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

        </>
      )}
    </section>
  );
}
