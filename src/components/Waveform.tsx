'use client';
import { useEffect, useRef, useCallback } from 'react';

interface Props {
  peaks: number[];
  progress: number;          // 0..1
  onSeek?: (ratio: number) => void;
  isPlaying?: boolean;
  height?: number;
  /** Color of the unplayed bars */
  baseColor?: string;
  /** Color of the played bars */
  playedColor?: string;
  /** Hover color shown over the played portion */
  hoverColor?: string;
}

export default function Waveform({
  peaks,
  progress,
  onSeek,
  isPlaying = false,
  height = 56,
  baseColor = 'rgba(255,255,255,0.35)',
  playedColor = '#e8a838',
  hoverColor = 'rgba(255,255,255,0.55)',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const hoverXRef = useRef<number | null>(null);
  const animRef = useRef<number | null>(null);

  // Render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = wrap.clientWidth;
    const cssH = height;
    if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const n = peaks.length;
    if (n === 0) return;

    const gap = 1;
    const totalGap = gap * (n - 1);
    const barW = Math.max(1, (cssW - totalGap) / n);
    const cy = cssH / 2;
    const playedUntil = Math.floor(progress * n);
    const hoverUntil = hoverXRef.current != null
      ? Math.floor(Math.min(1, Math.max(0, hoverXRef.current / cssW)) * n)
      : -1;

    for (let i = 0; i < n; i++) {
      const v = Math.max(0.04, peaks[i] ?? 0); // floor for visual
      const h = Math.max(2, v * (cssH * 0.92));
      const x = i * (barW + gap);
      const y = cy - h / 2;

      let color: string;
      if (i <= playedUntil) {
        color = playedColor;
      } else if (hoverUntil > playedUntil && i <= hoverUntil) {
        color = hoverColor;
      } else {
        color = baseColor;
      }
      ctx.fillStyle = color;
      ctx.fillRect(x, y, barW, h);
    }
  }, [peaks, progress, height, baseColor, playedColor, hoverColor]);

  // Repaint loop while playing (for smooth progress) + on prop changes
  useEffect(() => {
    render();
    if (isPlaying) {
      const loop = () => {
        render();
        animRef.current = requestAnimationFrame(loop);
      };
      animRef.current = requestAnimationFrame(loop);
      return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }
  }, [isPlaying, render]);

  // Resize
  useEffect(() => {
    const onResize = () => render();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [render]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio);
  };

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    hoverXRef.current = e.clientX - rect.left;
    render();
  };
  const handleLeave = () => {
    hoverXRef.current = null;
    render();
  };

  return (
    <div
      ref={wrapRef}
      onClick={handleClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        width: '100%',
        height,
        cursor: onSeek ? 'pointer' : 'default',
        position: 'relative',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
