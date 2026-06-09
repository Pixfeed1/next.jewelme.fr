'use client';
import { useEffect, useState } from 'react';

interface WaveformData {
  sample_id: number;
  duration: number;
  num_peaks: number;
  peaks: number[];
  title?: string;
}

// localStorage memo (cross-session cache)
const LS_KEY = 'orp-waveform-cache-v1';
function loadCache(): Record<number, WaveformData> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}
function saveCache(cache: Record<number, WaveformData>) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(cache)); } catch {}
}

export function useWaveform(sampleId: number | undefined | null) {
  const [data, setData] = useState<WaveformData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sampleId || sampleId <= 0) { setData(null); return; }

    // Check localStorage first
    const cache = loadCache();
    if (cache[sampleId]) {
      setData(cache[sampleId]);
      return;
    }

    // Fetch
    let cancelled = false;
    setLoading(true);
    fetch(`/api/waveform?sample_id=${sampleId}`)
      .then(r => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json && Array.isArray(json.peaks)) {
          setData(json);
          const newCache = loadCache();
          newCache[sampleId] = json;
          // Limit cache size (keep last 100 only)
          const keys = Object.keys(newCache).map(Number);
          if (keys.length > 100) {
            keys.slice(0, keys.length - 100).forEach(k => delete newCache[k]);
          }
          saveCache(newCache);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [sampleId]);

  return { data, loading };
}
