/**
 * @file src/components/ui/LazyImage.jsx
 * @description Lazy-loading image component with blur-up placeholder effect.
 * Shows a blurred low-res placeholder while the full image loads, then
 * smoothly transitions to the sharp version.
 * @importedBy src/pages/Menu.jsx, Events.jsx, AdminInventory.jsx
 */

import { useState, useRef, useEffect } from 'react';

/**
 * LazyImage — loads images lazily with a blur-up transition.
 *
 * @param {object} props
 * @param {string} props.src - Image URL
 * @param {string} props.alt - Alt text
 * @param {string} props.className - Container classes
 * @param {string} props.fallbackIcon - Fallback JSX when no src is provided
 * @returns {JSX.Element}
 */
export default function LazyImage({ src, alt, className = '', fallbackIcon }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef(null);

  // IntersectionObserver for lazy loading
  useEffect(() => {
    if (!src) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Start loading 200px before visible
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [src]);

  if (!src || error) {
    return (
      <div ref={imgRef} className={`bg-noir-700 flex items-center justify-center ${className}`}>
        {fallbackIcon}
      </div>
    );
  }

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Blurred placeholder background */}
      <div
        className={`absolute inset-0 bg-noir-700 transition-opacity duration-500 ${loaded ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Actual image — only loads when in viewport */}
      {inView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-all duration-500 ${
            loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
        />
      )}
    </div>
  );
}
