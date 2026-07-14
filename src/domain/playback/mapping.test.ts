import { describe, expect, it } from 'vitest';

import { mapCompanionState } from '@/domain/playback/mapping';

describe('mapCompanionState', () => {
  it('derives playback fields from Companion state', () => {
    const snapshot = mapCompanionState(
      {
        player: {
          trackState: 1,
          videoProgress: 50,
          volume: 0,
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
          likeStatus: 2,
        },
      },
      null,
      1234,
    );

    expect(snapshot).not.toBeNull();
    expect(snapshot?.title).toBe('Northern Glass');
    expect(snapshot?.elapsedSeconds).toBe(50);
    expect(snapshot?.progressRatio).toBe(0.25);
    expect(snapshot?.playbackState).toBe('playing');
    expect(snapshot?.canSeek).toBe(true);
    expect(snapshot?.coverUrl).toBe('https://example.com/cover.png');
    expect(snapshot?.volume).toBe(0);
    expect(snapshot?.isMuted).toBe(true);
    expect(snapshot?.likeStatus).toBe('liked');
  });

  it('treats Companion videoProgress as elapsed seconds instead of a percentage', () => {
    const snapshot = mapCompanionState(
      {
        player: {
          trackState: 1,
          videoProgress: 4,
        },
        video: {
          id: 'track-timing',
          title: 'Real Clock',
          durationSeconds: 248,
        },
      },
      null,
      1_000,
    );

    expect(snapshot?.elapsedSeconds).toBe(4);
    expect(snapshot?.progressRatio).toBeCloseTo(4 / 248);
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

  it('preserves mute and rating presentation when a same-track update omits them', () => {
    const previous = mapCompanionState(
      {
        player: { trackState: 1, videoProgress: 20, volume: 37 },
        video: {
          id: 'track-actions',
          title: 'Action State',
          durationSeconds: 180,
          likeStatus: 0,
        },
      },
      null,
      100,
    );

    const next = mapCompanionState(
      {
        player: { trackState: 1, videoProgress: 21 },
        video: {
          id: 'track-actions',
          title: 'Action State',
          durationSeconds: 180,
          likeStatus: -1,
        },
      },
      previous,
      200,
    );

    expect(next?.volume).toBe(37);
    expect(next?.isMuted).toBe(false);
    expect(next?.likeStatus).toBe('disliked');
  });
});
