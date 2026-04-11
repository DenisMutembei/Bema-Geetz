import { useState, useEffect, useCallback } from 'react';

// Image cache
const cache = new Map();

// Preload a single image
const preloadImage = (src) => {
  if (cache.has(src)) {
    return Promise.resolve(src);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      cache.set(src, true);
      resolve(src);
    };
    img.onerror = reject;
    img.src = src;
  });
};

// Preload multiple images in parallel
const preloadImages = async (srcs, onProgress) => {
  const validSrcs = srcs.filter(src => src && src.startsWith('http'));
  const total = validSrcs.length;
  let loaded = 0;

  if (total === 0) return [];

  const promises = validSrcs.map(src =>
    preloadImage(src)
      .then(() => {
        loaded++;
        onProgress?.(loaded, total);
        return src;
      })
      .catch(() => null)
  );

  return Promise.all(promises);
};

// Hook for preloading listing images
export function useListingPreloader(listings) {
  const [preloadedCount, setPreloadedCount] = useState(0);
  const [isPreloading, setIsPreloading] = useState(false);

  const preload = useCallback(async (priorityCount = 4) => {
    if (!listings?.length) return;

    setIsPreloading(true);
    
    // Get first N listing images for priority loading
    const priorityImages = listings
      .slice(0, priorityCount)
      .map(l => l.images?.[0])
      .filter(Boolean);

    // Preload priority images first
    await preloadImages(priorityImages, (loaded, total) => {
      setPreloadedCount(loaded);
    });

    // Then preload remaining images
    const remainingImages = listings
      .slice(priorityCount)
      .map(l => l.images?.[0])
      .filter(Boolean);

    // Preload in background
    preloadImages(remainingImages);

    setIsPreloading(false);
  }, [listings]);

  useEffect(() => {
    if (listings?.length > 0) {
      preload();
    }
  }, [listings, preload]);

  return { preloadedCount, isPreloading, preload };
}

// Hook for lazy loading images as they enter viewport
export function useLazyImage(src) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) {
      setHasError(true);
      return;
    }

    if (cache.has(src)) {
      setIsLoaded(true);
      return;
    }

    const img = new Image();
    img.onload = () => {
      cache.set(src, true);
      setIsLoaded(true);
    };
    img.onerror = () => setHasError(true);
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { isLoaded, hasError };
}

// Clear image cache
export function clearImageCache() {
  cache.clear();
}

// Get cache size
export function getCacheSize() {
  return cache.size;
}
