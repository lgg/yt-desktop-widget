import {
  GatewayError,
  type CompanionGateway,
  type CompanionRawState,
  type DiscoveryInfo,
  type GatewayConnectResult,
  type PlaybackCommand,
} from '@/domain/playback/types';

const TRACKS = [
  {
    id: 'sim-track-1',
    title: 'Night Train Window',
    author: 'Moseca Harbor',
    album: 'Blue Static',
    cover:
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80',
    durationSeconds: 248,
  },
  {
    id: 'sim-track-2',
    title: 'Soft Signal',
    author: 'Kita Vale',
    album: 'Transit Lights',
    cover:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    durationSeconds: 212,
  },
  {
    id: 'sim-track-3',
    title: 'Afterglow Avenue',
    author: 'Lumen Choir',
    album: 'Quiet City',
    cover:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=80',
    durationSeconds: 276,
  },
] as const;

const makeDiscovery = (): DiscoveryInfo => ({
  available: true,
  apiVersions: ['v1'],
  supportsRealtime: true,
  supportsSeek: true,
  usingBrowserBridge: false,
  detail: 'Simulator active for local development and tests.',
});

const buildState = (
  index: number,
  progressRatio: number,
  trackState: number,
): CompanionRawState => {
  const track = TRACKS[index] ?? TRACKS[0];
  return {
    player: {
      trackState,
      videoProgress: progressRatio * 100,
      volume: 55,
      adPlaying: false,
      queue: {
        autoplay: true,
        isGenerating: false,
        isInfinite: true,
        repeatMode: 0,
        selectedItemIndex: index,
        items: TRACKS.map((item, itemIndex) => ({
          author: item.author,
          title: item.title,
          selected: itemIndex === index,
          videoId: item.id,
          thumbnails: [
            {
              url: item.cover,
              width: 600,
              height: 600,
            },
          ],
        })),
      },
    },
    video: {
      id: track.id,
      title: track.title,
      author: track.author,
      album: track.album,
      durationSeconds: track.durationSeconds,
      thumbnails: [
        {
          url: track.cover,
          width: 900,
          height: 900,
        },
      ],
      metadataFilled: true,
      isLive: false,
      videoType: 0,
    },
  };
};

export const createSimulatorGateway = (): CompanionGateway => {
  let intervalId: number | null = null;
  let currentTrackIndex = 0;
  let progressRatio = 0.16;
  let trackState = 1;
  let handlersRef:
    | {
        onState: (state: CompanionRawState) => void;
        onConnected: () => void;
      }
    | null = null;

  const emit = () => {
    handlersRef?.onState(buildState(currentTrackIndex, progressRatio, trackState));
  };

  const sendCommand = (command: PlaybackCommand): Promise<void> => {
    switch (command.type) {
      case 'next':
        currentTrackIndex = (currentTrackIndex + 1) % TRACKS.length;
        progressRatio = 0;
        emit();
        return Promise.resolve();
      case 'previous':
        currentTrackIndex =
          (currentTrackIndex - 1 + TRACKS.length) % TRACKS.length;
        progressRatio = 0;
        emit();
        return Promise.resolve();
      case 'playPause':
        trackState = trackState === 1 ? 0 : 1;
        emit();
        return Promise.resolve();
      case 'play':
        trackState = 1;
        emit();
        return Promise.resolve();
      case 'pause':
        trackState = 0;
        emit();
        return Promise.resolve();
      case 'seekTo': {
        const track = TRACKS[currentTrackIndex] ?? TRACKS[0];
        progressRatio = Math.max(
          0,
          Math.min(command.seconds / track.durationSeconds, 1),
        );
        emit();
        return Promise.resolve();
      }
      default:
        return Promise.reject(new GatewayError('unknown', 'Unknown simulator command.'));
    }
  };

  return {
    kind: 'simulator',
    discover: () => Promise.resolve(makeDiscovery()),
    hasStoredAuth: () => Promise.resolve(true),
    connect: (handlers) => {
      handlersRef = {
        onState: handlers.onState,
        onConnected: handlers.onConnected,
      };

      handlers.onConnected();
      emit();

      if (intervalId == null) {
        intervalId = window.setInterval(() => {
          if (trackState === 1) {
            const track = TRACKS[currentTrackIndex] ?? TRACKS[0];
            progressRatio += 1 / track.durationSeconds;
            if (progressRatio >= 1) {
              currentTrackIndex = (currentTrackIndex + 1) % TRACKS.length;
              progressRatio = 0;
            }
            emit();
          }
        }, 1000);
      }

      return Promise.resolve({
        initialState: buildState(currentTrackIndex, progressRatio, trackState),
        connection: {
          send: sendCommand,
          disconnect: () => {
            if (intervalId != null) {
              window.clearInterval(intervalId);
              intervalId = null;
            }
            handlers.onDisconnected('socket_closed', 'Simulator stopped.');
            return Promise.resolve();
          },
        },
      } satisfies GatewayConnectResult);
    },
    requestAuthCode: () => Promise.resolve({ code: 'DEV-OK' }),
    completeAuth: () => Promise.resolve(),
    clearAuth: () => Promise.resolve(),
  };
};
