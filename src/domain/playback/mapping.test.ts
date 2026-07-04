import { describe, expect, it } from 'vitest';

import { mapCompanionState } from '@/domain/playback/mapping';

describe('mapCompanionState', () => {
  it('derives playback fields from Companion state', () => {
    const snapshot = mapCompanionState(
      {
        player: {
          trackState: 1,
          videoProgress: 50,
        },
        video: {
          id: 'track-1',
          title: 'Northern Glass',
          author: 'Aster Vale',
          album: 'Quiet City',
          durationSeconds: 200,
          thumbnails: [{ url: 'https://example.com/cover.png', width: 600, height: 600 }],
          metadataFilled: true,
          isLive: false,
        },
      },
      null,
      1234,
    );

    expect(snapshot).not.toBeNull();
    expect(snapshot?.title).toBe('Northern Glass');
    expect(snapshot?.elapsedSeconds).toBe(100);
    expect(snapshot?.playbackState).toBe('playing');
    expect(snapshot?.canSeek).toBe(true);
    expect(snapshot?.coverUrl).toBe('https://example.com/cover.png');
  });

  it('keeps previous metadata when a track update is incomplete', () => {
    const previous = mapCompanionState(
      {
        player: { trackState: 1, videoProgress: 25 },
        video: {
          id: 'track-2',
          title: 'Late Echo',
          author: 'Lumen Choir',
          durationSeconds: 240,
          thumbnails: [{ url: 'https://example.com/original.png', width: 400, height: 400 }],
          metadataFilled: true,
        },
      },
      null,
      500,
    );

    const next = mapCompanionState(
      {
        player: { trackState: 1, videoProgress: 30 },
        video: {
          id: 'track-2',
          durationSeconds: 240,
          metadataFilled: false,
        },
      },
      previous,
      700,
    );

    expect(next?.title).toBe('Late Echo');
    expect(next?.coverUrl).toBe('https://example.com/original.png');
  });
});