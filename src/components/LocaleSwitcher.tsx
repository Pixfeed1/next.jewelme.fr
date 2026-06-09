'use client';
import { useState, useRef, useEffect } from 'react';
import { useLocale, LOCALES } from '@/lib/locale-context';

function FlagFR({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.66} viewBox="0 0 3 2" style={{ display: 'block', borderRadius: 2, flexShrink: 0 }}>
      <rect width="1" height="2" x="0" fill="#0055A4" />
      <rect width="1" height="2" x="1" fill="#FFFFFF" />
      <rect width="1" height="2" x="2" fill="#EF4135" />
    </svg>
  );
}

function FlagGB({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.66} viewBox="0 0 60 30" style={{ display: 'block', borderRadius: 2, flexShrink: 0 }}>
      <clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
    </svg>
  );
}

function Flag({ code, size }: { code: string; size?: number }) {
  return code === 'en' ? <FlagGB size={size} /> : <FlagFR size={size} />;
}

export default function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = LOCALES.find(l => l.code === locale) ?? LOCALES[0];

  return (
    <div ref={ref} className="locale-switcher" style={{ position: 'relative', display: 'inline-block', marginLeft: 8 }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: 0, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '6px 8px' }}
        aria-label="Langue">
        <Flag code={current.code} size={22} />
        <span className="locale-switcher-iso">{current.iso}</span>
        <i className="material-icons" style={{ fontSize: 16 }}>{open ? 'expand_less' : 'expand_more'}</i>
      </button>
      {open && (
        <div className="locale-switcher-dropdown" style={{ position: 'absolute', top: '100%', right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', minWidth: 160, zIndex: 1000, marginTop: 4 }}>
          {LOCALES.map(l => (
            <button key={l.code} type="button" onClick={() => { setLocale(l.code); setOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: l.code === locale ? '#f5f0e8' : 'transparent', border: 0, cursor: 'pointer', fontSize: 13, color: '#333', textAlign: 'left' }}>
              <Flag code={l.code} size={22} />
              <span>{l.label}</span>
              {l.code === locale && <i className="material-icons" style={{ fontSize: 14, marginLeft: 'auto', color: '#3f6e51' }}>check</i>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
