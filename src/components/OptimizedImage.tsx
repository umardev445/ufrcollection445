import React, { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Generate WebP URL if possible
  const getOptimizedUrl = (url: string) => {
    if (url.includes('unsplash.com')) {
      // Add unsplash optimization params
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}w=${width || 800}&q=80&fm=webp`;
    }
    return url;
  };

  const optimizedSrc = getOptimizedUrl(src);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } w-full h-full object-cover`}
      />
    </div>
  );
};

export default OptimizedImage;