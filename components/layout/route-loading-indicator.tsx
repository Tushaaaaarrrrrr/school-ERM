'use client';

// ============================================================================
// Global Instant Route Navigation Loading Indicator
// Guarantees immediate visual feedback on any button or link click,
// preventing "silent background loading" confusion.
// ============================================================================

import React, { useEffect, useState, useTransition } from 'react';
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
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept all internal navigation link clicks globally
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Find closest anchor tag or element with data-navigate
      const anchor = target.closest('a') as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      const targetAttr = anchor.getAttribute('target');

      // Ignore external links, downloads, hash jumps, or new tab clicks
      if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || targetAttr === '_blank') {
        return;
      }

      // Ignore if clicking the exact current URL (including hash)
      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl || href === '#') {
        return;
      }

      // Ignore modifier keys (Cmd/Ctrl + click opens in new tab)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      // Trigger instant navigation loading state!
      setIsVisible(true);
      setProgress(25);

      // Animate progress smoothly while Next.js loads the target page
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            clearInterval(interval);
            return 85;
          }
          return prev + Math.floor(Math.random() * 15 + 10);
        });
      }, 150);

      // Safety fallback: auto-clear after 8 seconds if navigation fails or aborts
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setIsVisible(false);
        setProgress(0);
      }, 8000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    };

    // Also support custom window event for manual router.push calls:
    // window.dispatchEvent(new CustomEvent('app:navigation-start'));
    const handleCustomNavStart = () => {
      setIsVisible(true);
      setProgress(30);
    };

    const handleCustomNavEnd = () => {
      setProgress(100);
      setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 200);
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
    <aside aria-label="Page transition status">
      {/* Top glowing progress bar */}
      <div className="fixed top-0 left-0 right-0 z-9999 h-1 bg-transparent pointer-events-none">
        <div
          className="h-full bg-linear-to-r from-indigo-500 via-indigo-600 to-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.85)] transition-all duration-200 ease-out"
          style={{ width: `${progress}%`, opacity: isVisible ? 1 : 0 }}
        />
      </div>

      {/* Floating subtle loading badge in bottom-right corner for unequivocal visual confirmation */}
      {isVisible && (
        <div className="fixed bottom-20 right-6 z-9999 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 text-white shadow-xl backdrop-blur-md border border-slate-700/60 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 pointer-events-none">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
          <span>Opening screen...</span>
        </div>
      )}
    </aside>
  );
}

// Utility function that any component can call before programmatic router.push
export function triggerNavigationStart() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:navigation-start'));
  }
}
