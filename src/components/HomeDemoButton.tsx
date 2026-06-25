'use client';

import { usePlayer, Track } from '@/lib/player-context';
import { useT } from '@/lib/i18n';

const DEMO_PLAYLIST: Track[] = [
  {
    url: 'https://samplelib.com/lib/preview/mp3/sample-3s.mp3',
    title: 'Demo Track 1 — Reggae Sample',
    productName: 'OnlyRoots Demo',
  },
  {
    url: 'https://samplelib.com/lib/preview/mp3/sample-6s.mp3',
    title: 'Demo Track 2 — Dub Sample',
    productName: 'OnlyRoots Demo',
  },
];

export default function HomeDemoButton() {
  const t = useT();
  const { loadPlaylist } = usePlayer();
  return (
    <div
      style={{
        background: '#fef9e7',
        border: '1px solid #f0c419',
        borderRadius: 8,
        padding: 16,
        marginBottom: 32,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: 14 }}>
        🎧 Tester le lecteur audio persistant (navigue entre les pages, l'audio continue) :
      </span>
      <button
        onClick={() => loadPlaylist(DEMO_PLAYLIST)}
        style={{
          background: '#e8a838',
          color: '#1a1a1a',
          border: 'none',
          padding: '8px 16px',
          fontWeight: 600,
          cursor: 'pointer',
          borderRadius: 4,
          fontSize: 13,
        }}
      >{t('launch_demo')}</button>
    </div>
  );
}
