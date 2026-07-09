export type ThemeMode = 'dark' | 'system';
export type DataSourceMode = 'auto' | 'real' | 'simulator';
export type CloseButtonAction = 'exit' | 'hideToTray';
export type ConnectionStatus =
  | 'disconnected'
  | 'discovering'
  | 'auth_required'
  | 'authenticating'
  | 'connected'
  | 'reconnecting'
  | 'error';
export type PlaybackState = 'unknown' | 'paused' | 'playing' | 'buffering';

export interface ConnectionSettings {
  host: string;
  port: number;
  sourceMode: DataSourceMode;
}

export interface UiSettings {
  hidePlaybackControls: boolean;
  hideProgressBar: boolean;
  hideSettingsButton: boolean;
  hideCloseButton: boolean;
  themeMode: ThemeMode;
}

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSettings {
  alwaysOnTop: boolean;
  launchOnStartup: boolean;
  closeButtonAction: CloseButtonAction;
  mainPosition: WindowPosition | null;
  settingsPosition: WindowPosition | null;
}

export interface AppSettings {
  api: ConnectionSettings;
  ui: UiSettings;
  window: WindowSettings;
}

export interface DiscoveryInfo {
  available: boolean;
  apiVersions: string[];
  supportsRealtime: boolean;
  supportsSeek: boolean;
  usingBrowserBridge: boolean;
  detail?: string | undefined;
}

export interface CompanionThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface CompanionQueueItem {
  thumbnails?: CompanionThumbnail[];
  title?: string;
  author?: string;
  duration?: string;
  selected?: boolean;
  videoId?: string;
}

export interface CompanionRawState {
  player?: {
    trackState?: number;
    videoProgress?: number;
    volume?: number;
    adPlaying?: boolean;
    queue?: {
      autoplay?: boolean;
      items?: CompanionQueueItem[];
      automixItems?: CompanionQueueItem[];
      isGenerating?: boolean;
      isInfinite?: boolean;
      repeatMode?: number;
      selectedItemIndex?: number;
    } | null;
  };
  video?: {
    author?: string;
    channelId?: string;
    title?: string;
    album?: string | null;
    albumId?: string | null;
    likeStatus?: number | null;
    thumbnails?: CompanionThumbnail[];
    durationSeconds?: number;
    id?: string;
    isLive?: boolean;
    videoType?: number;
    metadataFilled?: boolean;
  } | null;
  playlistId?: string | null;
}

export interface PlaybackSnapshot {
  id: string;
  title: string;
  artists: string[];
  album: string | null;
  coverUrl: string | null;
  durationSeconds: number;
  elapsedSeconds: number;
  progressRatio: number;
  playbackState: PlaybackState;
  isAdPlaying: boolean;
  isLive: boolean;
  canSeek: boolean;
  metadataFilled: boolean;
  lastSyncedAt: number;
}

export interface ConnectionState {
  status: ConnectionStatus;
  detail?: string | undefined;
  authCode?: string | null | undefined;
  hasStoredAuth: boolean;
  discovery?: DiscoveryInfo | undefined;
  retryAttempt: number;
  retryAt?: number | null | undefined;
  lastError?: string | undefined;
}

export interface PlaybackSessionState {
  connection: ConnectionState;
  playback: PlaybackSnapshot | null;
  lastKnownPlayback: PlaybackSnapshot | null;
}

export type PlaybackCommand =
  | { type: 'playPause' }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'seekTo'; seconds: number };

export type GatewayDisconnectReason =
  | 'socket_closed'
  | 'socket_error'
  | 'api_unavailable'
  | 'not_running';

export interface GatewayDisconnectOptions {
  closeBackend?: boolean;
}

export class GatewayError extends Error {
  readonly code:
    | 'auth_required'
    | 'authorization_disabled'
    | 'credential_storage'
    | 'not_running'
    | 'api_unavailable'
    | 'network'
    | 'unknown';

  constructor(
    code: GatewayError['code'],
    message: string,
  ) {
    super(message);
    this.code = code;
  }
}

export interface GatewayEventHandlers {
  onState: (state: CompanionRawState) => void;
  onDisconnected: (reason: GatewayDisconnectReason, detail?: string) => void;
  onError: (detail: string) => void;
  onConnected: () => void;
}

export interface GatewayConnection {
  send: (command: PlaybackCommand) => Promise<void>;
  disconnect: (options?: GatewayDisconnectOptions) => Promise<void>;
}

export interface GatewayConnectResult {
  connection: GatewayConnection;
  initialState: CompanionRawState | null;
}

export interface CompanionGateway {
  readonly kind: 'real' | 'simulator';
  discover: () => Promise<DiscoveryInfo>;
  hasStoredAuth: () => Promise<boolean>;
  connect: (handlers: GatewayEventHandlers) => Promise<GatewayConnectResult>;
  requestAuthCode: () => Promise<{ code: string }>;
  completeAuth: (code: string) => Promise<void>;
  clearAuth: () => Promise<void>;
}
