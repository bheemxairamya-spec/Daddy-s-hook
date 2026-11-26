import { useEffect, useRef, useState } from 'react';

/**
 * Observes when an element enters the viewport and sets `visible = true` once.
 * Gracefully falls back to immediately visible if IntersectionObserver is
 * unavailable or prefers-reduced-motion is enabled.
 */
export function useRevealOnScroll<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.12
) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    if (!('IntersectionObserver' in window)) return true;
    return false;
  });

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold, rootMargin: '0px 0px -24px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, threshold]);

  return { ref, visible };
}
