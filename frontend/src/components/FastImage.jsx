import { useState, memo } from 'react';

// Simple, reliable image component
const FastImage = memo(function FastImage({ 
  src, 
  alt, 
  className = '', 
  priority = false,
  fallback = '/placeholder.jpg',
  ...props 
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use fallback if error or no src
  const imageSrc = hasError || !src ? fallback : src;

  return (
    <div className={`relative overflow-hidden bg-dark-card ${className}`}>
      {/* Loading spinner */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      )}
      
      {/* Main image - always visible, no opacity tricks */}
      <img
        src={imageSrc}
        alt={alt || 'Image'}
        loading={priority ? 'eager' : 'lazy'}
        className={`w-full h-full object-cover ${className}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        {...props}
      />
    </div>
  );
});

export default FastImage;

// Preload utility (kept for compatibility)
export function preloadImages(srcs) {
  return Promise.all(
    srcs.filter(Boolean).map(src => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = () => resolve(null);
        img.src = src;
      });
    })
  );
}

// No-op for compatibility
export function clearImageCache() {}
