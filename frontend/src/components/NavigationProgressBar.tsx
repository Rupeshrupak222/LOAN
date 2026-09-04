'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Instant top navigation progress bar for Next.js App Router.
 * Gives immediate visual feedback as soon as any link, sidebar item, or action initiates navigation.
 */
export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Complete progress bar when route transition finishes
  useEffect(() => {
    setIsNavigating(false);
    setProgress(100);
    const timer = setTimeout(() => {
      setProgress(0);
    }, 200);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Intercept link clicks to start progress bar immediately
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target || !target.href) return;

      const url = new URL(target.href, window.location.origin);
      const isInternal = url.origin === window.location.origin;
      const isTargetBlank = target.target === '_blank';
      const isModifierKey = e.ctrlKey || e.metaKey || e.shiftKey || e.altKey;
      const isCurrentPage = url.pathname === window.location.pathname && url.search === window.location.search;

      if (isInternal && !isTargetBlank && !isModifierKey && !isCurrentPage) {
        setIsNavigating(true);
        setProgress(30);

        const timer1 = setTimeout(() => setProgress(65), 150);
        const timer2 = setTimeout(() => setProgress(85), 400);

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }
    };

    document.addEventListener('click', handleAnchorClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleAnchorClick, { capture: true });
    };
  }, []);

  if (!isNavigating && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[2.5px] bg-transparent pointer-events-none">
      <div
        className="h-full bg-linear-to-r from-blue-500 via-indigo-500 to-sky-400 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(59,130,246,0.6)]"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
