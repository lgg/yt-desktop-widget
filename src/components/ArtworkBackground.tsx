import { memo } from 'react';
import clsx from 'clsx';

import { useArtworkTransition } from '@/utils/artwork';
import { toCssUrl } from '@/utils/css';

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
          style={{ backgroundImage: toCssUrl(previousUrl) }}
        />
      ) : null}
      {currentUrl ? (
        <div
          className="artwork-background__layer artwork-background__layer--current"
          style={{ backgroundImage: toCssUrl(currentUrl) }}
        />
      ) : null}
      <div className="artwork-background__veil" />
    </div>
  );
});
