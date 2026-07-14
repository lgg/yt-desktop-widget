import { useI18n } from '@/app/i18n';
import { DislikeIcon, LikeIcon } from '@/components/icons';
import type { LikeStatus } from '@/domain/playback/types';

interface RatingControlsProps {
  likeStatus: LikeStatus;
  disabled: boolean;
  visible?: boolean;
  onToggleLike: () => void;
  onToggleDislike: () => void;
}

export const RatingControls = ({
  likeStatus,
  disabled,
  visible = true,
  onToggleLike,
  onToggleDislike,
}: RatingControlsProps) => {
  const { t } = useI18n();

  return (
    <div
      className={
        visible
          ? 'rating-controls'
          : 'rating-controls rating-controls--hidden'
      }
      aria-hidden={!visible}
    >
      <button
        className={
          likeStatus === 'liked'
            ? 'rating-controls__button rating-controls__button--active'
            : 'rating-controls__button'
        }
        type="button"
        disabled={disabled || !visible}
        aria-label={t('widget.rating.like')}
        aria-pressed={likeStatus === 'liked'}
        onClick={onToggleLike}
      >
        <LikeIcon />
      </button>
      <button
        className={
          likeStatus === 'disliked'
            ? 'rating-controls__button rating-controls__button--active'
            : 'rating-controls__button'
        }
        type="button"
        disabled={disabled || !visible}
        aria-label={t('widget.rating.dislike')}
        aria-pressed={likeStatus === 'disliked'}
        onClick={onToggleDislike}
      >
        <DislikeIcon />
      </button>
    </div>
  );
};
