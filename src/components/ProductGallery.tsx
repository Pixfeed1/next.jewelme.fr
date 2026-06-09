'use client';
import { useState, useEffect } from 'react';
import { getProductImageUrl } from '@/lib/presta';

interface Props {
  productId: number;
  productName: string;
  images: number[];
  fallbackImageId: number | null;
  badges?: React.ReactNode;
}

export default function ProductGallery({ productId, productName, images, fallbackImageId, badges }: Props) {
  const imgs = images.length > 0 ? images : (fallbackImageId ? [fallbackImageId] : []);
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // ESC pour fermer le lightbox + fleches pour naviguer
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') setActiveIdx((i) => (i + 1) % imgs.length);
      if (e.key === 'ArrowLeft') setActiveIdx((i) => (i - 1 + imgs.length) % imgs.length);
    };
    window.addEventListener('keydown', onKey);
    // Lock body scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [lightboxOpen, imgs.length]);

  if (imgs.length === 0) {
    return (
      <div style={{ aspectRatio: '1', background: '#f5f5f5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" opacity="0.4">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="2.5" fill="#fff"/>
        </svg>
      </div>
    );
  }

  const activeId = imgs[activeIdx];

  return (
    <>
      <div>
        {/* Image principale avec bouton expand */}
        <div style={{ position: 'relative', aspectRatio: '1', background: '#f0f0f0', borderRadius: 8, overflow: 'hidden', marginBottom: imgs.length > 1 ? 12 : 0 }}>
          {badges}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getProductImageUrl(productId, activeId)}
            alt={productName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'zoom-in' }}
            onClick={() => setLightboxOpen(true)}
          />
          {/* Bouton expand en bas à droite (style OnlyRoots) */}
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="Agrandir l'image"
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              width: 32,
              height: 32,
              border: 0,
              background: 'rgba(255,255,255,0.85)',
              borderRadius: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.85)')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
          </button>
        </div>

        {imgs.length > 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 80px))', gap: 8 }}>
            {imgs.map((id, idx) => (
              <button key={id} type="button" onClick={() => setActiveIdx(idx)}
                aria-label={`Voir l'image ${idx + 1}`}
                style={{ appearance: 'none', padding: 0, border: idx === activeIdx ? '2px solid var(--or-green)' : '2px solid transparent', borderRadius: 6, cursor: 'pointer', background: '#f0f0f0', aspectRatio: '1', overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getProductImageUrl(productId, id)} alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
          }}
        >
          {/* Bouton fermer */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
            aria-label="Fermer"
            style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, border: 0, background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: '50%', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
          >
            ✕
          </button>

          {/* Fleche precedente */}
          {imgs.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i - 1 + imgs.length) % imgs.length); }}
              aria-label="Image precedente"
              style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, border: 0, background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: '50%', cursor: 'pointer', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            >
              ‹
            </button>
          )}

          {/* Image agrandie */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getProductImageUrl(productId, imgs[activeIdx])}
            alt={productName}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
          />

          {/* Fleche suivante */}
          {imgs.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i + 1) % imgs.length); }}
              aria-label="Image suivante"
              style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, border: 0, background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: '50%', cursor: 'pointer', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            >
              ›
            </button>
          )}

          {/* Compteur */}
          {imgs.length > 1 && (
            <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 13, padding: '6px 14px', background: 'rgba(0,0,0,0.5)', borderRadius: 20 }}>
              {activeIdx + 1} / {imgs.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
