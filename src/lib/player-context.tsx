'use client';

import {
  createContext, useContext, useState, useRef, useCallback, useEffect,
  ReactNode, RefObject,
} from 'react';

export interface Track {
  id?: number;
  url: string;
  title: string;
  productName?: string;
  productLink?: string;
  cover?: string;
}

export interface PlayerState {
  playlist: Track[];
  currentTrack: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  visible: boolean;
}

interface PlayerAPI {
  state: PlayerState;
  audioRef: RefObject<HTMLAudioElement | null>;
  loadPlaylist: (playlist: Track[], startAt?: number, autoplay?: boolean) => void;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  close: () => void;
}

const STORAGE_KEY = 'orp_state_v1';
const PlayerContext = createContext<PlayerAPI | null>(null);

export function usePlayer(): PlayerAPI {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside <PlayerProvider>');
  return ctx;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingAutoplayRef = useRef(false);

  const [state, setState] = useState<PlayerState>({
    playlist: [], currentTrack: 0, isPlaying: false,
    currentTime: 0, duration: 0, volume: 0.8, muted: false, visible: false,
  });

  const update = useCallback((patch: Partial<PlayerState>) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  const loadTrack = useCallback((index: number, playlist: Track[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    const track = playlist[index];
    if (!track) return;
    audio.src = track.url;
    audio.load();
  }, []);

  const play = useCallback(() => {
    update({ visible: true });
    audioRef.current?.play().catch((err) => {
      console.warn('[ORP] play() rejected:', err.message);
    });
  }, [update]);

  const pause = useCallback(() => { audioRef.current?.pause(); }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) play(); else pause();
  }, [play, pause]);

  const loadPlaylist = useCallback((playlist: Track[], startAt = 0, autoplay = true) => {
    if (!playlist.length) return;
    pendingAutoplayRef.current = autoplay;
    setState((s) => ({
      ...s, playlist, currentTrack: startAt, visible: true,
      isPlaying: false, currentTime: 0, duration: 0,
    }));
    requestAnimationFrame(() => loadTrack(startAt, playlist));
  }, [loadTrack]);

  const next = useCallback(() => {
    setState((s) => {
      if (!s.playlist.length) return s;
      const i = (s.currentTrack + 1) % s.playlist.length;
      pendingAutoplayRef.current = s.isPlaying;
      requestAnimationFrame(() => loadTrack(i, s.playlist));
      return { ...s, currentTrack: i, currentTime: 0, duration: 0 };
    });
  }, [loadTrack]);

  const prev = useCallback(() => {
    setState((s) => {
      if (!s.playlist.length) return s;
      const i = s.currentTrack === 0 ? s.playlist.length - 1 : s.currentTrack - 1;
      pendingAutoplayRef.current = s.isPlaying;
      requestAnimationFrame(() => loadTrack(i, s.playlist));
      return { ...s, currentTrack: i, currentTime: 0, duration: 0 };
    });
  }, [loadTrack]);

  // Fin d'une piste : enchaîne automatiquement la suivante, ou stoppe proprement
  // en fin de playlist. On force l'autoplay (sans dépendre de isPlaying, qui peut
  // déjà avoir basculé à false via un event "pause" émis juste avant "ended").
  const handleEnded = useCallback(() => {
    setState((s) => {
      if (!s.playlist.length) return s;
      const isLast = s.currentTrack >= s.playlist.length - 1;
      if (isLast) {
        pendingAutoplayRef.current = false;
        if (audioRef.current) {
          try { audioRef.current.currentTime = 0; } catch {}
        }
        return { ...s, isPlaying: false, currentTime: 0 };
      }
      const i = s.currentTrack + 1;
      pendingAutoplayRef.current = true;
      requestAnimationFrame(() => loadTrack(i, s.playlist));
      return { ...s, currentTrack: i, currentTime: 0, duration: 0 };
    });
  }, [loadTrack]);

  const seek = useCallback((time: number) => {
    if (audioRef.current && isFinite(time)) audioRef.current.currentTime = time;
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    if (audioRef.current) {
      audioRef.current.volume = clamped;
      if (audioRef.current.muted && clamped > 0) {
        audioRef.current.muted = false;
        update({ muted: false });
      }
    }
    update({ volume: clamped });
  }, [update]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    const newMuted = !audioRef.current.muted;
    audioRef.current.muted = newMuted;
    update({ muted: newMuted });
  }, [update]);

  const close = useCallback(() => {
    pause();
    update({ visible: false });
  }, [pause, update]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => update({ isPlaying: true });
    const onPause = () => update({ isPlaying: false });
    const onTime = () => update({ currentTime: audio.currentTime });
    const onMeta = () => {
      update({ duration: isFinite(audio.duration) ? audio.duration : 0 });
      if (pendingAutoplayRef.current) {
        pendingAutoplayRef.current = false;
        play();
      }
    };
    const onEnded = () => handleEnded();
    const onVolume = () => update({ volume: audio.volume, muted: audio.muted });

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('volumechange', onVolume);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('volumechange', onVolume);
    };
  }, [handleEnded, play, update]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = state.volume;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.visible) document.body.classList.add('orp-player-active');
    else document.body.classList.remove('orp-player-active');
  }, [state.visible]);

  useEffect(() => {
    if (!state.visible || !state.playlist.length) return;
    const interval = setInterval(() => {
      try {
        const snapshot = {
          playlist: state.playlist,
          currentTrack: state.currentTrack,
          currentTime: state.currentTime,
          volume: state.volume,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [state.visible, state.playlist, state.currentTrack, state.currentTime, state.volume]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved.playlist?.length) return;
      setState((s) => ({
        ...s,
        playlist: saved.playlist,
        currentTrack: saved.currentTrack || 0,
        volume: saved.volume ?? 0.8,
        visible: true,
      }));
      requestAnimationFrame(() => {
        if (audioRef.current) {
          const track = saved.playlist[saved.currentTrack || 0];
          if (track) {
            audioRef.current.src = track.url;
            audioRef.current.load();
            audioRef.current.addEventListener('loadedmetadata', () => {
              if (audioRef.current && saved.currentTime) {
                audioRef.current.currentTime = saved.currentTime;
              }
            }, { once: true });
          }
        }
      });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PlayerContext.Provider value={{
      state, audioRef, loadPlaylist, togglePlay, play, pause,
      next, prev, seek, setVolume, toggleMute, close,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}
