import { memo, type ReactNode } from 'react';

import { useArtworkTransition } from '@/utils/artwork';
import { toCssUrl } from '@/utils/css';

interface CoverCardProps {
  artworkUrl: string | null;
  title: string;
  children?: ReactNode;
}

export const CoverCard = memo(function CoverCard({
  artworkUrl,
  title,
  children,
}: CoverCardProps) {
  const { currentUrl, previousUrl } = useArtworkTransition(artworkUrl);

  return (
    <div className="cover-card" aria-label={title}>
      {previousUrl ? (
        <div
          className="cover-card__image cover-card__image--previous"
          style={{ backgroundImage: toCssUrl(previousUrl) }}
        />
      ) : null}
      {currentUrl ? (
        <div
          className="cover-card__image cover-card__image--current"
          style={{ backgroundImage: toCssUrl(currentUrl) }}
        />
      ) : (
        <div className="cover-card__placeholder" />
      )}
      <div className="cover-card__shine" />
      {children ? <div className="cover-card__overlay">{children}</div> : null}
    </div>
  );
});
