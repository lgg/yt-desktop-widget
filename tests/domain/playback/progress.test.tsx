import { renderHook, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSmoothedProgress } from '@/domain/playback/progress';
import type { PlaybackSnapshot } from '@/domain/playback/types';

const makePlayback = (lastSyncedAt: number): PlaybackSnapshot => ({
  id: 'track-1',
  title: 'Track',
  artists: ['Artist'],
  album: null,
  coverUrl: null,
  durationSeconds: 180,
  elapsedSeconds: 30,
  progressRatio: 30 / 180,
  playbackState: 'playing',
  isAdPlaying: false,
  isLive: false,
  canSeek: true,
  metadataFilled: true,
  lastSyncedAt,
});

describe('useSmoothedProgress', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('advances playing tracks using the same clock as Companion snapshots', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    const { result } = renderHook(() => useSmoothedProgress(makePlayback(Date.now())));

    expect(result.current).toBe(30);

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(result.current).toBeCloseTo(32.5, 1);
  });
});
