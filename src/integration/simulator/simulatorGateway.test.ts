import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CompanionRawState } from '@/domain/playback/types';
import { createSimulatorGateway } from '@/integration/simulator/simulatorGateway';

describe('createSimulatorGateway', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('emits an initial state and advances progress while playing', async () => {
    const gateway = createSimulatorGateway();
    const onState = vi.fn<(state: CompanionRawState) => void>();
    const onConnected = vi.fn<() => void>();

    const { connection, initialState } = await gateway.connect({
      onState,
      onConnected,
      onDisconnected: vi.fn(),
      onError: vi.fn(),
    });

    expect(onConnected).toHaveBeenCalledTimes(1);
    expect(initialState?.video?.title).toBeTruthy();
    const initialProgress = initialState?.player?.videoProgress ?? 0;

    vi.advanceTimersByTime(1_000);

    expect(onState).toHaveBeenCalled();
    const nextProgress = onState.mock.calls.at(-1)?.[0]?.player?.videoProgress ?? 0;
    expect(nextProgress - initialProgress).toBeCloseTo(1);
    await connection.send({ type: 'next' });
    expect(onState.mock.calls.at(-1)?.[0]?.video?.id).not.toBe(initialState?.video?.id);

    await connection.disconnect();
    vi.useRealTimers();
  });

  it('simulates mute restoration and like/dislike toggles through the typed command surface', async () => {
    const gateway = createSimulatorGateway();
    const onState = vi.fn<(state: CompanionRawState) => void>();
    const { connection, initialState } = await gateway.connect({
      onState,
      onConnected: vi.fn(),
      onDisconnected: vi.fn(),
      onError: vi.fn(),
    });

    expect(initialState?.player?.volume).toBe(55);
    expect(initialState?.video?.likeStatus).toBe(1);

    await connection.send({ type: 'mute' });
    expect(onState.mock.calls.at(-1)?.[0].player?.volume).toBe(0);
    await connection.send({ type: 'unmute' });
    expect(onState.mock.calls.at(-1)?.[0].player?.volume).toBe(55);

    await connection.send({ type: 'toggleLike' });
    expect(onState.mock.calls.at(-1)?.[0].video?.likeStatus).toBe(2);
    await connection.send({ type: 'toggleLike' });
    expect(onState.mock.calls.at(-1)?.[0].video?.likeStatus).toBe(1);
    await connection.send({ type: 'toggleDislike' });
    expect(onState.mock.calls.at(-1)?.[0].video?.likeStatus).toBe(0);

    await connection.disconnect();
    vi.useRealTimers();
  });
});
