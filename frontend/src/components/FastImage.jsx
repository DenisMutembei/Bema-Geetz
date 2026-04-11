import { useState, useEffect, useRef, memo } from 'react';

// Preload image utility for instant display
const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = reject;
    img.src = src;
  });
};

// Image cache to prevent re-loading
const imageCache = new Map();

const FastImage = memo(function FastImage({ 
  src, 
  alt, 
  className = '', 
  priority = false,
  fallback = '/placeholder.jpg',
  onLoad,
  ...props 
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  const imgRef = useRef(null);

  useEffect(() => {
    // Reset state when src changes
    setIsLoaded(false);
    setHasError(false);
    setImageSrc(src);

    if (!src) {
      setHasError(true);
      return;
    }

    // Check cache first
    if (imageCache.has(src)) {
      setIsLoaded(true);
      onLoad?.();
      return;
    }

    // Priority images load immediately
    if (priority) {
      preloadImage(src)
        .then(() => {
          imageCache.set(src, true);
          setIsLoaded(true);
          onLoad?.();
        })
        .catch(() => {
          setHasError(true);
          setImageSrc(fallback);
        });
    }
  }, [src, priority, fallback, onLoad]);

  const handleLoad = () => {
    if (!isLoaded) {
      imageCache.set(src, true);
      setIsLoaded(true);
      onLoad?.();
    }
  };

  const handleError = () => {
    if (!hasError && imageSrc !== fallback) {
      setHasError(true);
      setImageSrc(fallback);
    }
  };

  // Inline placeholder SVG - no external requests
  const placeholderSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23141414' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%232A2A2A' font-size='16'%3E${encodeURIComponent(alt || 'Image')}%3C/text%3E%3C/svg%3E`;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Instant placeholder while loading */}
      {!isLoaded && !priority && (
        <div className="absolute inset-0 bg-dark-card">
          <img
            src={placeholderSvg}
            alt=""
            className="w-full h-full object-cover opacity-50"
          />
        </div>
      )}
      
      {/* Main image */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        className={`
          w-full h-full object-cover
          transition-opacity duration-200
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
          ${className}
        `}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      
      {/* Subtle loading indicator */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-dark-card flex items-center justify-center">
          <div className="text-center p-4">
            <svg className="w-10 h-10 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2z" />
            </svg>
            <p className="text-xs text-gray-500">No image</p>
          </div>
        </div>
      )}
    </div>
  );
});

export default FastImage;

// Preload multiple images for instant display
export function preloadImages(srcs) {
  return Promise.all(
    srcs.filter(Boolean).map(src => {
      if (imageCache.has(src)) return Promise.resolve(src);
      return preloadImage(src).then(() => {
        imageCache.set(src, true);
        return src;
      }).catch(() => null);
    })
  );
}

// Clear image cache
export function clearImageCache() {
  imageCache.clear();
}
