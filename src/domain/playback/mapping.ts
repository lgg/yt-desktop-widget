import type {
  CompanionQueueItem,
  CompanionRawState,
  CompanionThumbnail,
  PlaybackSnapshot,
  PlaybackState,
} from '@/domain/playback/types';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const pickLargestThumbnail = (thumbnails: CompanionThumbnail[] | undefined): string | null => {
  if (!thumbnails || thumbnails.length === 0) {
    return null;
  }

  let largestUrl: string | null = null;
  let largestArea = -1;

  for (const thumbnail of thumbnails) {
    const area = thumbnail.width * thumbnail.height;
    if (area > largestArea) {
      largestArea = area;
      largestUrl = thumbnail.url;
    }
  }

  return largestUrl;
};

const pickSelectedItemFromList = (
  items: CompanionQueueItem[] | undefined,
  selectedIndex: number | undefined,
  offset = 0,
): CompanionQueueItem | undefined => {
  if (!items || items.length === 0) {
    return undefined;
  }

  const explicitSelected = items.find((item) => item.selected);
  if (explicitSelected) {
    return explicitSelected;
  }

  if (typeof selectedIndex !== 'number') {
    return undefined;
  }

  const relativeIndex = selectedIndex - offset;
  return relativeIndex >= 0 ? items[relativeIndex] : undefined;
};

const getSelectedQueueItem = (state: CompanionRawState): CompanionQueueItem | undefined => {
  const queue = state.player?.queue;
  if (!queue) {
    return undefined;
  }

  const queueItems = queue.items ?? [];
  const automixItems = queue.automixItems ?? [];
  const selectedIndex = queue.selectedItemIndex;

  return (
    pickSelectedItemFromList(queueItems, selectedIndex) ??
    pickSelectedItemFromList(automixItems, selectedIndex, queueItems.length)
  );
};

const mapTrackState = (trackState: number | undefined): PlaybackState => {
  switch (trackState) {
    case 0:
      return 'paused';
    case 1:
      return 'playing';
    case 2:
      return 'buffering';
    default:
      return 'unknown';
  }
};

const splitArtists = (author: string | undefined): string[] => {
  if (!author) {
    return [];
  }

  return author
    .split(/,|•| feat\.| ft\./i)
    .map((artist) => artist.trim())
    .filter(Boolean);
};

export const mapCompanionState = (
  rawState: CompanionRawState,
  previous: PlaybackSnapshot | null,
  now = Date.now(),
): PlaybackSnapshot | null => {
  const video = rawState.video;
  if (!video?.id && !video?.title) {
    return null;
  }

  const queueItem = getSelectedQueueItem(rawState);
  const coverUrl =
    pickLargestThumbnail(video?.thumbnails) ?? pickLargestThumbnail(queueItem?.thumbnails);
  const rawDurationSeconds = video?.durationSeconds ?? 0;
  const durationSeconds = Number.isFinite(rawDurationSeconds)
    ? clamp(rawDurationSeconds, 0, Number.MAX_SAFE_INTEGER)
    : 0;
  const rawElapsedSeconds = rawState.player?.videoProgress ?? 0;
  const elapsedSeconds = Number.isFinite(rawElapsedSeconds)
    ? clamp(
        rawElapsedSeconds,
        0,
        durationSeconds || Number.MAX_SAFE_INTEGER,
      )
    : 0;
  const progressRatio = durationSeconds ? elapsedSeconds / durationSeconds : 0;
  const nextId = video?.id ?? previous?.id ?? 'unknown-track';
  const metadataFilled = video?.metadataFilled ?? true;
  const canSeek = !video?.isLive && durationSeconds > 0;
  const artistCandidates = splitArtists(video?.author);
  const queueArtists = splitArtists(queueItem?.author);

  const snapshot: PlaybackSnapshot = {
    id: nextId,
    title: video?.title?.trim() || queueItem?.title?.trim() || previous?.title || 'Unknown track',
    artists:
      artistCandidates.length > 0
        ? artistCandidates
        : queueArtists.length > 0
          ? queueArtists
          : previous?.artists ?? [],
    album: video?.album ?? previous?.album ?? null,
    coverUrl: coverUrl ?? previous?.coverUrl ?? null,
    durationSeconds,
    elapsedSeconds,
    progressRatio,
    playbackState: mapTrackState(rawState.player?.trackState),
    isAdPlaying: rawState.player?.adPlaying ?? false,
    isLive: video?.isLive ?? false,
    canSeek,
    metadataFilled,
    lastSyncedAt: now,
  };

  if (!previous || previous.id !== snapshot.id || metadataFilled) {
    return snapshot;
  }

  return {
    ...snapshot,
    title: snapshot.title === 'Unknown track' ? previous.title : snapshot.title,
    artists: snapshot.artists.length > 0 ? snapshot.artists : previous.artists,
    album: snapshot.album ?? previous.album,
    coverUrl: snapshot.coverUrl ?? previous.coverUrl,
  };
};
