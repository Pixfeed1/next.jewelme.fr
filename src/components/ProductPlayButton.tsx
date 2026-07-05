'use client';

import { useState } from 'react';
import { usePlayer, Track } from '@/lib/player-context';

interface Props {
  productId: number;
  productName: string;
  productLink: string;
  coverUrl?: string;
  size?: number;
  variant?: 'overlay' | 'inline';
}

interface ApiSample {
  id: number;
  product_id: number;
  title: string;
  filename: string;
  url: string;
  loop: boolean;
}

export default function ProductPlayButton({
  productId, productName, productLink, coverUrl,
  size = 36, variant = 'overlay',
}: Props) {
  const { state, loadPlaylist, play, pause } = usePlayer();
  const [loading, setLoading] = useState(false);
  const [noSamples, setNoSamples] = useState(false);

  // Détecte si ce produit est actuellement chargé dans le player
  // (les URLs des samples contiennent /upload/{productId}/)
  const urlPattern = `/upload/${productId}/`;
  const isThisLoaded = state.playlist.length > 0 && state.playlist[0].url.includes(urlPattern);
  const isThisPlaying = isThisLoaded && state.isPlaying;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    // Si ce produit est déjà dans le player → toggle play/pause
    if (isThisLoaded) {
      if (state.isPlaying) pause();
      else play();
      return;
    }

    // Sinon on charge les samples
    if (noSamples) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/samples/${productId}`);
      if (!res.ok) {
        setNoSamples(true);
        return;
      }
      const data = await res.json();
      const samples: ApiSample[] = data.samples ?? [];
      if (samples.length === 0) {
        setNoSamples(true);
        return;
      }
      const tracks: Track[] = samples.map((s) => ({
        id: s.id,
        url: s.url,
        title: s.title,
        productName,
        productLink,
        cover: coverUrl,
      }));
      loadPlaylist(tracks);
    } catch (err) {
      console.error('[ProductPlayButton] error:', err);
      setNoSamples(true);
    } finally {
      setLoading(false);
    }
  };

  // Couleurs OnlyRoots player : jaune accent sur noir
  const bgColor = noSamples ? '#555' : '#e8a838';
  const iconColor = noSamples ? '#999' : '#1a1a1a';

  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    flexShrink: 0,
    borderRadius: '50%',
    background: bgColor,
    color: iconColor,
    border: 'none',
    cursor: noSamples ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.15s, background 0.15s',
    opacity: loading ? 0.6 : 1,
    padding: 0,
  };

  const overlayStyle: React.CSSProperties = {
    ...baseStyle,
    position: 'absolute',
    bottom: 8,
    right: 8,
    zIndex: 5,
  };

  let icon = 'play_arrow';
  let label = 'Écouter un extrait';
  if (loading) {
    icon = 'hourglass_empty';
    label = 'Chargement...';
  } else if (noSamples) {
    icon = 'music_off';
    label = 'Pas d\'extrait';
  } else if (isThisPlaying) {
    icon = 'pause';
    label = 'Mettre en pause';
  }

  return (
    <button
      type="button"
      className="product-play-button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      disabled={loading || noSamples}
      style={variant === 'overlay' ? overlayStyle : baseStyle}
    >
      <i className="material-icons" style={{ fontSize: size * 0.6, color: iconColor, lineHeight: 1 }}>{icon}</i>
    </button>
  );
}
