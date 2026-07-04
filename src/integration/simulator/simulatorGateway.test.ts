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

    vi.advanceTimersByTime(1_000);

    expect(onState).toHaveBeenCalled();
    await connection.send({ type: 'next' });
    expect(onState.mock.calls.at(-1)?.[0]?.video?.id).not.toBe(initialState?.video?.id);

    await connection.disconnect();
    vi.useRealTimers();
  });
});
