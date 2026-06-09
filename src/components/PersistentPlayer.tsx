'use client';
import { usePlayer } from '@/lib/player-context';
import { useEffect, useRef } from 'react';
import Waveform from './Waveform';
import { useWaveform } from '@/lib/use-waveform';

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

export default function PersistentPlayer() {
  const { state, audioRef, togglePlay, next, prev, seek, setVolume, toggleMute, close } = usePlayer();
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const volumeBarRef = useRef<HTMLDivElement | null>(null);

  const track = state.playlist[state.currentTrack];
  const { data: waveform } = useWaveform(track?.id);

  // Ajuste body padding-bottom selon visibility (norme SoundCloud / Spotify)
  useEffect(() => {
    if (state.visible) {
      const isMobile = window.matchMedia('(max-width: 480px)').matches;
      document.body.style.paddingBottom = isMobile ? '64px' : '80px';
    } else {
      document.body.style.paddingBottom = '';
    }
    return () => { document.body.style.paddingBottom = ''; };
  }, [state.visible]);
  const progressPct = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;
  const volumePct = state.muted ? 0 : state.volume * 100;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || state.duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(ratio * state.duration);
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeBarRef.current) return;
    const rect = volumeBarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(ratio);
  };

  return (
    <div id="orp-player" className="orp-player"
         style={state.visible ? undefined : { display: 'none' }}
         data-playing={state.isPlaying ? 'true' : 'false'}
         role="region" aria-label="Lecteur audio">
      <div className="orp-player-inner">
        <div className="orp-cover">
          {track?.cover ? (
            <img src={track.cover} alt={track.productName || ''} />
          ) : (
            <div className="orp-cover-placeholder">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none"/>
                <circle cx="10" cy="10" r="3" fill="rgba(255,255,255,0.3)"/>
              </svg>
            </div>
          )}
        </div>
        <div className="orp-controls">
          <button className="orp-btn orp-btn-prev" type="button" onClick={prev} title="Piste précédente">
            <svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="2" width="2" height="10" fill="currentColor"/><polygon points="13,2 13,12 5,7" fill="currentColor"/></svg>
          </button>
          <button className="orp-btn orp-btn-play" type="button" onClick={togglePlay} title="Lecture / Pause">
            {state.isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 16 16"><rect x="3" y="2" width="3.5" height="12" fill="currentColor"/><rect x="9.5" y="2" width="3.5" height="12" fill="currentColor"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16"><polygon points="4,2 4,14 13,8" fill="currentColor"/></svg>
            )}
          </button>
          <button className="orp-btn orp-btn-next" type="button" onClick={next} title="Piste suivante">
            <svg width="14" height="14" viewBox="0 0 14 14"><polygon points="1,2 1,12 9,7" fill="currentColor"/><rect x="11" y="2" width="2" height="10" fill="currentColor"/></svg>
          </button>
        </div>
        <div className="orp-info">
          <div className="orp-info-text">
            {track?.productLink ? (
              <a href={track.productLink} className="orp-track-name" title={track.title}><span>{track?.title || '-'}</span></a>
            ) : (
              <span className="orp-track-name">{track?.title || '-'}</span>
            )}
            <span className="orp-track-meta">
              <span>{track?.productName || '-'}</span>
              {state.playlist.length > 0 && (
                <>
                  <span className="orp-track-sep">&middot;</span>
                  <span>{state.currentTrack + 1}/{state.playlist.length}</span>
                </>
              )}
            </span>
          </div>
          <div className="orp-progress-wrap">
            {waveform && waveform.peaks && waveform.peaks.length > 0 ? (
              <Waveform
                peaks={waveform.peaks}
                progress={state.duration > 0 ? state.currentTime / state.duration : 0}
                isPlaying={state.isPlaying}
                onSeek={(r) => seek(r * state.duration)}
                height={42}
              />
            ) : (
              <div ref={progressBarRef} className="orp-progress-bar" onClick={handleProgressClick}>
                <div className="orp-progress-fill" style={{ width: `${progressPct}%` }} />
                <div className="orp-progress-handle" style={{ left: `${progressPct}%` }} />
              </div>
            )}
            <div className="orp-time">
              <span>{formatTime(state.currentTime)}</span>
              <span>{formatTime(state.duration)}</span>
            </div>
          </div>
        </div>
        <div className="orp-volume-wrap">
          <button className="orp-btn orp-btn-vol" type="button" onClick={toggleMute} title="Volume">
            {state.muted || state.volume === 0 ? (
              <svg width="16" height="16" viewBox="0 0 16 16"><polygon points="1,5 1,11 4,11 8,14 8,2 4,5" fill="currentColor"/><line x1="10" y1="5" x2="15" y2="11" stroke="currentColor" strokeWidth="1.5"/><line x1="15" y1="5" x2="10" y2="11" stroke="currentColor" strokeWidth="1.5"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16"><polygon points="1,5 1,11 4,11 8,14 8,2 4,5" fill="currentColor"/><path d="M10,5 Q13,8 10,11" stroke="currentColor" fill="none" strokeWidth="1.5"/></svg>
            )}
          </button>
          <div className="orp-volume-bar-wrap">
            <div ref={volumeBarRef} className="orp-volume-bar" onClick={handleVolumeClick}>
              <div className="orp-volume-fill" style={{ width: `${volumePct}%` }} />
            </div>
          </div>
        </div>
        <button className="orp-btn orp-btn-close" type="button" onClick={close} title="Fermer">
          <svg width="12" height="12" viewBox="0 0 12 12"><line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5"/><line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5"/></svg>
        </button>
      </div>
      <audio ref={audioRef} id="orp-audio" preload="none" />
    </div>
  );
}
