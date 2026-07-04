import { NextIcon, PauseIcon, PlayIcon, PreviousIcon } from '@/components/icons';
import type { PlaybackState } from '@/domain/playback/types';

interface TransportControlsProps {
  playbackState: PlaybackState;
  disabled: boolean;
  visible: boolean;
  onPrevious: () => void;
  onPlayPause: () => void;
  onNext: () => void;
}

export const TransportControls = ({
  playbackState,
  disabled,
  visible,
  onNext,
  onPlayPause,
  onPrevious,
}: TransportControlsProps) => (
  <div className={`transport-controls ${visible ? 'transport-controls--visible' : ''}`}>
    <button
      className="transport-controls__button"
      type="button"
      onClick={onPrevious}
      disabled={disabled}
      aria-label="Previous"
    >
      <PreviousIcon />
    </button>
    <button
      className="transport-controls__button transport-controls__button--primary"
      type="button"
      onClick={onPlayPause}
      disabled={disabled}
      aria-label={playbackState === 'playing' ? 'Pause' : 'Play'}
    >
      {playbackState === 'playing' ? <PauseIcon /> : <PlayIcon />}
    </button>
    <button
      className="transport-controls__button"
      type="button"
      onClick={onNext}
      disabled={disabled}
      aria-label="Next"
    >
      <NextIcon />
    </button>
  </div>
);
