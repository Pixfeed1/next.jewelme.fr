'use client';
import { usePlayer, Track } from '@/lib/player-context';

interface Props {
  productId: number | string;
  playlist: Track[];
}

export default function InlinePlayButton({ productId, playlist }: Props) {
  const { state, loadPlaylist, togglePlay } = usePlayer();
  const isCurrent = state.visible && state.playlist.length > 0
                    && playlist.length > 0
                    && state.playlist[0].url === playlist[0].url;
  const isPlayingHere = isCurrent && state.isPlaying;

  const handleClick = () => {
    if (isCurrent) togglePlay();
    else loadPlaylist(playlist, 0, true);
  };

  return (
    <button type="button"
            className={`orp-play-btn-inline ${isPlayingHere ? 'orp-playing' : ''}`}
            onClick={handleClick}
            title={isPlayingHere ? 'Pause' : 'Écouter un extrait'}
            data-product-id={productId} />
  );
}
