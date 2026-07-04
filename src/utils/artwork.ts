import { useEffect, useRef, useState } from 'react';

const artworkCache = new Map<string, Promise<void>>();

const preloadArtwork = (url: string) => {
  const cached = artworkCache.get(url);
  if (cached) {
    return cached;
  }

  const promise = new Promise<void>((resolve) => {
    const image = new Image();
    image.src = url;
    image.onload = () => resolve();
    image.onerror = () => resolve();
  });

  artworkCache.set(url, promise);
  return promise;
};

export const useArtworkTransition = (artworkUrl: string | null) => {
  const [currentUrl, setCurrentUrl] = useState<string | null>(artworkUrl);
  const [previousUrl, setPreviousUrl] = useState<string | null>(null);
  const clearPreviousRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (clearPreviousRef.current != null) {
        window.clearTimeout(clearPreviousRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!artworkUrl || artworkUrl === currentUrl) {
      return undefined;
    }

    let cancelled = false;
    if (clearPreviousRef.current != null) {
      window.clearTimeout(clearPreviousRef.current);
      clearPreviousRef.current = null;
    }

    void preloadArtwork(artworkUrl).then(() => {
      if (cancelled) {
        return;
      }

      setPreviousUrl(currentUrl);
      setCurrentUrl(artworkUrl);
      clearPreviousRef.current = window.setTimeout(() => {
        clearPreviousRef.current = null;
        if (!cancelled) {
          setPreviousUrl(null);
        }
      }, 520);
    });

    return () => {
      cancelled = true;
    };
  }, [artworkUrl, currentUrl]);

  return {
    currentUrl,
    previousUrl,
  };
};
