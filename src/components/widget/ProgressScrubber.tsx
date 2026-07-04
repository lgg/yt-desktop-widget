import { useEffect, useRef, useState, type PointerEvent, type PointerEventHandler } from 'react';

import { useSmoothedProgress } from '@/domain/playback/progress';
import type { PlaybackSnapshot } from '@/domain/playback/types';
import { formatDuration } from '@/utils/time';

interface ProgressScrubberProps {
  playback: PlaybackSnapshot;
  disabled: boolean;
  visible: boolean;
  onSeek: (seconds: number) => Promise<void>;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const ProgressScrubber = ({
  playback,
  disabled,
  visible,
  onSeek,
}: ProgressScrubberProps) => {
  const [dragValue, setDragValue] = useState<number | null>(null);
  const [pendingSeek, setPendingSeek] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const smoothedSeconds = useSmoothedProgress(playback, dragValue ?? pendingSeek);
  const durationSeconds = playback.durationSeconds;

  useEffect(() => {
    if (pendingSeek == null) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setPendingSeek(null);
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [pendingSeek]);

  const activeSeconds = dragValue ?? pendingSeek ?? smoothedSeconds;
  const ratio = durationSeconds > 0 ? clamp(activeSeconds / durationSeconds, 0, 1) : 0;

  const valueFromPointer = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || durationSeconds <= 0) {
      return 0;
    }

    const percentage = clamp((clientX - rect.left) / rect.width, 0, 1);
    return percentage * durationSeconds;
  };

  const commitSeek = async (seconds: number) => {
    setPendingSeek(seconds);
    try {
      await onSeek(seconds);
    } catch {
      setPendingSeek(null);
    }
  };

  const handlePointerDown: PointerEventHandler<HTMLDivElement> = (event) => {
    if (disabled || durationSeconds <= 0) {
      return;
    }

    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    setDragValue(valueFromPointer(event.clientX));
  };

  const handlePointerMove: PointerEventHandler<HTMLDivElement> = (event) => {
    if (dragValue == null) {
      return;
    }

    setDragValue(valueFromPointer(event.clientX));
  };

  const handlePointerUp = async (event: PointerEvent<HTMLDivElement>) => {
    if (dragValue == null) {
      return;
    }

    const nextValue = valueFromPointer(event.clientX);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragValue(null);
    await commitSeek(nextValue);
  };

  return (
    <div className={`progress-row ${visible ? 'progress-row--visible' : ''}`}>
      <span className="progress-row__time">{formatDuration(activeSeconds)}</span>
      <div
        ref={trackRef}
        className={`progress-row__track ${disabled ? 'progress-row__track--disabled' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => {
          void handlePointerUp(event);
        }}
        onPointerCancel={() => {
          setDragValue(null);
        }}
        role="slider"
        aria-label="Seek position"
        aria-valuemin={0}
        aria-valuemax={durationSeconds}
        aria-valuenow={Math.floor(activeSeconds)}
      >
        <div className="progress-row__bar" style={{ width: `${ratio * 100}%` }} />
        <div className="progress-row__thumb" style={{ left: `${ratio * 100}%` }} />
      </div>
      <span className="progress-row__time">{formatDuration(durationSeconds)}</span>
    </div>
  );
};

