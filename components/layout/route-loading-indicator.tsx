'use client';

// ============================================================================
// Global Instant Route Navigation Loading Indicator
// Normal, clean centered loading screen in the middle of the viewport
// ============================================================================

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function RouteLoadingIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // When pathname or searchParams change, navigation has completed
  useEffect(() => {
    if (isVisible) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept all internal navigation link clicks globally
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest('a') as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      const targetAttr = anchor.getAttribute('target');

      // Ignore external links, downloads, hash jumps, or new tab clicks
      if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || targetAttr === '_blank') {
        return;
      }

      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl || href === '#') {
        return;
      }

      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      // Trigger instant navigation loading state in the middle of screen
      setIsVisible(true);
      setProgress(25);

      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 15;
        });
      }, 120);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        setIsVisible(false);
        setProgress(0);
      }, 6000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    };

    const handleCustomNavStart = () => {
      setIsVisible(true);
      setProgress(30);
    };

    const handleCustomNavEnd = () => {
      setProgress(100);
      setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 150);
    };

    document.addEventListener('click', handleDocumentClick, { capture: true });
    window.addEventListener('app:navigation-start', handleCustomNavStart);
    window.addEventListener('app:navigation-end', handleCustomNavEnd);

    return () => {
      document.removeEventListener('click', handleDocumentClick, { capture: true });
      window.removeEventListener('app:navigation-start', handleCustomNavStart);
      window.removeEventListener('app:navigation-end', handleCustomNavEnd);
    };
  }, []);

  if (!isVisible && progress === 0) return null;

  return (
    <>
      {/* Sleek top progress line */}
      <div className="fixed top-0 left-0 right-0 z-9999 h-1 bg-transparent pointer-events-none">
        <div
          className="h-full bg-linear-to-r from-indigo-500 via-indigo-600 to-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.6)] transition-all duration-150 ease-out"
          style={{ width: `${progress}%`, opacity: isVisible ? 1 : 0 }}
        />
      </div>

      {/* Normal, clean loading screen centered right in the middle */}
      {isVisible && (
        <div className="fixed inset-0 z-9998 flex flex-col items-center justify-center bg-white/70 backdrop-blur-xs animate-in fade-in duration-100 pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-xl flex items-center justify-center">
            <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
          </div>
          <p className="text-xs font-semibold text-slate-700 mt-3 tracking-wide">
            Loading...
          </p>
        </div>
      )}
    </>
  );
}

export function triggerNavigationStart() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:navigation-start'));
  }
}
