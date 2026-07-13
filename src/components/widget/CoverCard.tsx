import { memo, type ReactNode } from 'react';

import { useArtworkTransition } from '@/utils/artwork';
import { toCssUrl } from '@/utils/css';

interface CoverCardProps {
  artworkUrl: string | null;
  title: string;
  children?: ReactNode;
  action?:
    | {
        label: string;
        disabled: boolean;
        visible: boolean;
        icon: ReactNode;
        onActivate: () => void;
      }
    | undefined;
}

export const CoverCard = memo(function CoverCard({
  artworkUrl,
  title,
  children,
  action,
}: CoverCardProps) {
  const { currentUrl, previousUrl } = useArtworkTransition(artworkUrl);

  const content = (
    <>
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
      {action ? (
        <span
          className={
            action.visible
              ? 'cover-card__playback-indicator cover-card__playback-indicator--visible'
              : 'cover-card__playback-indicator'
          }
          aria-hidden="true"
        >
          <span className="cover-card__playback-icon">{action.icon}</span>
        </span>
      ) : null}
    </>
  );

  if (action) {
    return (
      <button
        className="cover-card cover-card--interactive no-drag"
        type="button"
        aria-label={action.label}
        disabled={action.disabled}
        onClick={action.onActivate}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="cover-card" aria-label={title}>
      {content}
    </div>
  );
});
