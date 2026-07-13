import { useI18n } from '@/app/i18n';
import {
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
} from '@/components/icons';
import type { PlaybackState } from '@/domain/playback/types';

interface TransportControlsProps {
  playbackState: PlaybackState;
  disabled: boolean;
  visible?: boolean;
  onPrevious: () => void;
  onPlayPause: () => void;
  onNext: () => void;
}

export const TransportControls = ({
  playbackState,
  disabled,
  visible = true,
  onNext,
  onPlayPause,
  onPrevious,
}: TransportControlsProps) => {
  const { t } = useI18n();

  return (
    <div
      className={
        visible
          ? 'transport-controls'
          : 'transport-controls transport-controls--hidden'
      }
      aria-hidden={!visible}
    >
      <button
        className="transport-controls__button"
        type="button"
        onClick={onPrevious}
        disabled={disabled || !visible}
        aria-label={t('widget.transport.previous')}
      >
        <PreviousIcon />
      </button>
      <button
        className="transport-controls__button transport-controls__button--primary"
        type="button"
        onClick={onPlayPause}
        disabled={disabled || !visible}
        aria-label={
          playbackState === 'playing'
            ? t('widget.transport.pause')
            : t('widget.transport.play')
        }
      >
        {playbackState === 'playing' ? <PauseIcon /> : <PlayIcon />}
      </button>
      <button
        className="transport-controls__button"
        type="button"
        onClick={onNext}
        disabled={disabled || !visible}
        aria-label={t('widget.transport.next')}
      >
        <NextIcon />
      </button>
    </div>
  );
};
