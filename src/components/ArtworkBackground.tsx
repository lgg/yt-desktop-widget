import { memo } from 'react';
import clsx from 'clsx';

import { useArtworkTransition } from '@/utils/artwork';

interface ArtworkBackgroundProps {
  artworkUrl: string | null;
  fallbackClassName?: string;
}

export const ArtworkBackground = memo(function ArtworkBackground({
  artworkUrl,
  fallbackClassName,
}: ArtworkBackgroundProps) {
  const { currentUrl, previousUrl } = useArtworkTransition(artworkUrl);

  return (
    <div className={clsx('artwork-background', fallbackClassName)} aria-hidden="true">
      {previousUrl ? (
        <div
          className="artwork-background__layer artwork-background__layer--previous"
          style={{ backgroundImage: `url(${previousUrl})` }}
        />
      ) : null}
      {currentUrl ? (
        <div
          className="artwork-background__layer artwork-background__layer--current"
          style={{ backgroundImage: `url(${currentUrl})` }}
        />
      ) : null}
      <div className="artwork-background__veil" />
    </div>
  );
});
