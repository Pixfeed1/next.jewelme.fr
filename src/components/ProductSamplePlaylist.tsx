'use client';
import { useEffect, useState } from 'react';
import { usePlayer } from '@/lib/player-context';
import { useT } from '@/lib/i18n';
import type { Track } from '@/lib/player-context';

interface Sample {
  id?: number;
  url?: string;
  filename?: string;
  title?: string;
  duration?: number;
}

interface Props {
  productId: number;
  productName?: string;
  productLink?: string;
  coverUrl?: string;
  variant?: 'full' | 'button-only' | 'list-only';
}

export default function ProductSamplePlaylist({ productId, productName, productLink, coverUrl, variant = 'full' }: Props) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const { state, loadPlaylist, togglePlay } = usePlayer();
  const t = useT();

  useEffect(() => {
    fetch(`/api/samples/${productId}`)
      .then((r) => r.json())
      .then((d) => {
        const items: Sample[] = d.samples || d.data || (Array.isArray(d) ? d : []);
        setSamples(items);
      })
      .catch(() => setSamples([]))
      .finally(() => setLoading(false));
  }, [productId]);

  // Map des samples → tracks du player global
  const buildTracks = (): Track[] => samples.map((s) => ({
    id: typeof s.id === 'number' ? s.id : undefined,
    url: s.url || '',
    title: s.title || s.filename || '',
    productName,
    productLink,
    cover: coverUrl,
  }));

  // Index courant : si le track joué actuellement par le player est dans notre playlist, on le détecte
  const currentTrack = state.playlist[state.currentTrack];
  const currentIdx = currentTrack
    ? samples.findIndex((s) => s.url === currentTrack.url)
    : -1;

  const playIndex = (idx: number) => {
    const tracks = buildTracks();
    if (tracks.length === 0 || !tracks[idx]?.url) return;
    loadPlaylist(tracks, idx, true);
  };

  const handleToggle = (idx: number) => {
    // Si cette piste joue déjà, toggle pause/play
    if (currentIdx === idx) {
      togglePlay();
      return;
    }
    playIndex(idx);
  };

  if (loading) return <p style={{ color: '#888', fontSize: 13, marginTop: 16 }}>Chargement…</p>;
  if (samples.length === 0) return null;

  const isAnyPlaying = currentIdx >= 0 && state.isPlaying;

  const showButton = variant !== 'list-only';
  const showList = variant !== 'button-only';

  return (
    <div style={{ marginTop: 20, maxWidth: 640 }}>
      {showButton ? (<button
        type="button"
        onClick={() => isAnyPlaying ? togglePlay() : playIndex(currentIdx >= 0 ? currentIdx : 0)}
        style={{
          appearance: 'none', background: '#1a1a1a', color: '#fff', border: 0,
          padding: '10px 22px', fontSize: 13, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.05em', cursor: 'pointer', borderRadius: 4,
          display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20,
          transition: 'background 0.2s',
        }}
        aria-label={isAnyPlaying ? 'Pause' : t('listen')}
      >
        {isAnyPlaying ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        )}
        {isAnyPlaying ? 'Pause' : t('listen')}
      </button>) : null}

      {showList ? (<ul style={{ listStyle: 'none', padding: 0, margin: 0, background: 'var(--or-bg-soft, #f5f5f5)', borderRadius: 6 }}>
        {samples.map((s, idx) => {
          const isActive = idx === currentIdx;
          const isPlaying = isActive && state.isPlaying;
          const title = s.title || s.filename || `Piste ${idx + 1}`;
          const num = String(idx + 1).padStart(2, '0');
          return (
            <li
              key={s.id ?? idx}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                borderBottom: idx < samples.length - 1 ? '1px solid var(--or-grey-lighter)' : 'none',
                background: isActive ? 'rgba(63, 110, 81, 0.08)' : 'transparent',
              }}
            >
              <button
                type="button"
                onClick={() => handleToggle(idx)}
                aria-label={isPlaying ? 'Pause' : 'Lecture'}
                style={{
                  appearance: 'none', border: 0, width: 34, height: 34,
                  borderRadius: '50%',
                  background: isPlaying ? 'var(--or-green)' : '#1a1a1a',
                  color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                {isPlaying ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                )}
              </button>
              <span style={{ color: 'var(--or-grey)', fontSize: 13, fontWeight: 500, minWidth: 22 }}>{num}</span>
              <span style={{ fontSize: 14, fontWeight: isActive ? 600 : 400, color: 'var(--or-text)' }}>{title}</span>
            </li>
          );
        })}
      </ul>) : null}
    </div>
  );
}
