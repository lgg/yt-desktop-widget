import { useEffect, useRef, useState } from 'react';

import type { PlaybackSnapshot } from '@/domain/playback/types';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const useSmoothedProgress = (
  playback: PlaybackSnapshot | null,
  overrideSeconds?: number | null,
): number => {
  const [frameNow, setFrameNow] = useState(() => performance.now());
  const animationFrameRef = useRef<number | null>(null);
  const playbackId = playback?.id;
  const playbackState = playback?.playbackState;
  const lastSyncedAt = playback?.lastSyncedAt;

  useEffect(() => {
    if (playbackState !== 'playing' || overrideSeconds != null) {
      return undefined;
    }

    const tick = () => {
      setFrameNow(performance.now());
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current != null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [lastSyncedAt, overrideSeconds, playbackId, playbackState]);

  if (overrideSeconds != null) {
    return overrideSeconds;
  }

  if (!playback) {
    return 0;
  }

  const deltaSeconds =
    playback.playbackState === 'playing'
      ? Math.max(0, (frameNow - playback.lastSyncedAt) / 1000)
      : 0;

  return clamp(
    playback.elapsedSeconds + deltaSeconds,
    0,
    playback.durationSeconds || Number.MAX_SAFE_INTEGER,
  );
};
