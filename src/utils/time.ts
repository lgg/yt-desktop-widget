export const formatDuration = (totalSeconds: number) => {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return '0:00';
  }

  const rounded = Math.floor(totalSeconds);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const formatArtistLine = (artists: string[]) => artists.filter(Boolean).join(' • ');
