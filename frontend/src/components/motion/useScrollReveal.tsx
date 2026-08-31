'use client';

import React, { useRef, useState, useEffect } from 'react';

interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export function useScrollReveal({
  threshold = 0.15,
  rootMargin = '0px 0px -10% 0px',
  once = true,
}: ScrollRevealOptions = {}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // If prefers-reduced-motion is enabled, make visible immediately
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, once]);

  return { ref, isVisible };
}

interface RevealItemProps {
  children: React.ReactNode;
  isVisible: boolean;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'depth' | 'scale';
  className?: string;
}

export const RevealItem: React.FC<RevealItemProps> = ({
  children,
  isVisible,
  delay = 0,
  direction = 'up',
  className = '',
}) => {
  let initialTransform = 'translate3d(0, 48px, 0)';

  if (direction === 'down') {
    initialTransform = 'translate3d(0, -48px, 0)';
  } else if (direction === 'left') {
    initialTransform = 'translate3d(-50px, 0, 0)';
  } else if (direction === 'right') {
    initialTransform = 'translate3d(50px, 0, 0)';
  } else if (direction === 'depth') {
    initialTransform = 'scale3d(0.92, 0.92, 0.92) translate3d(0, 40px, -60px)';
  } else if (direction === 'scale') {
    initialTransform = 'scale3d(0.94, 0.94, 0.94) translate3d(0, 30px, 0)';
  }

  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate3d(0, 0, 0) scale3d(1, 1, 1)' : initialTransform,
        filter: isVisible ? 'blur(0px)' : 'blur(8px)',
        transition: `opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.85s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, filter 0.85s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: 'transform, opacity, filter',
      }}
      className={className}
    >
      {children}
    </div>
  );
};
