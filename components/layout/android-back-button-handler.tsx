'use client';

// ============================================================================
// Android System / Hardware Back Button & Lifecycle State Handler
// Ensures system back button follows in-app navigation (Screen C -> B -> A)
// and preserves user location when the app is minimized / switched.
// ============================================================================

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const LAST_ROUTE_KEY = 'school_erp_last_route';
const NAV_HISTORY_KEY = 'school_erp_nav_history';

// Define the root/entry screens for each role where pressing Back should exit the app
const ROOT_SCREENS = new Set([
  '/',
  '/login',
  '/admin',
  '/teacher',
  '/student',
  '/parent',
  '/staff',
  '/driver',
  '/super-admin',
  '/access-unavailable',
  '/suspended',
  '/join',
]);

// Helper to determine the parent fallback route for common nested paths
function getParentRoute(path: string): string {
  // Check student subpages
  if (path.startsWith('/admin/students/')) return '/admin/students';
  if (path.startsWith('/admin/teachers/')) return '/admin/teachers';
  if (path.startsWith('/admin/staff/')) return '/admin/staff';
  if (path.startsWith('/admin/academics/classes/')) return '/admin/academics';
  if (path.startsWith('/admin/academics/')) return '/admin/academics';
  if (path.startsWith('/admin/fees/')) return '/admin/fees';
  if (path.startsWith('/admin/attendance/')) return '/admin/attendance';
  if (path.startsWith('/admin/')) return '/admin';

  if (path.startsWith('/teacher/')) return '/teacher';
  if (path.startsWith('/student/')) return '/student';
  if (path.startsWith('/parent/')) return '/parent';
  if (path.startsWith('/driver/')) return '/driver';
  if (path.startsWith('/staff/')) return '/staff';
  if (path.startsWith('/super-admin/schools/')) return '/super-admin/schools';
  if (path.startsWith('/super-admin/')) return '/super-admin';

  if (path.startsWith('/account/')) return '/admin';

  return '/';
}

export function AndroidBackButtonHandler() {
  const pathname = usePathname();
  const router = useRouter();
  const historyStackRef = useRef<string[]>([]);
  const isNavigatingBackRef = useRef(false);

  // 1. Synchronize navigation stack on path changes
  useEffect(() => {
    if (!pathname) return;

    // Persist the current meaningful screen to localStorage so it survives app switches/kills
    if (pathname !== '/login' && !pathname.startsWith('/api')) {
      try {
        localStorage.setItem(LAST_ROUTE_KEY, pathname);
      } catch {
        // Ignore storage errors
      }
    }

    if (isNavigatingBackRef.current) {
      isNavigatingBackRef.current = false;
      return;
    }

    // Append to internal history stack, avoiding consecutive duplicates
    const stack = historyStackRef.current;
    if (stack.length === 0 || stack[stack.length - 1] !== pathname) {
      stack.push(pathname);
      // Keep stack reasonable size
      if (stack.length > 50) stack.shift();
      try {
        sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(stack));
      } catch {
        // Ignore storage errors
      }
    }
  }, [pathname]);

  // 2. Initialize history from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(NAV_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          historyStackRef.current = parsed;
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  // 3. Register Capacitor Native Android Back Button Listener & Lifecycle Observer
  useEffect(() => {
    let cleanupCapacitorBack: (() => void) | null = null;
    let cleanupCapacitorState: (() => void) | null = null;

    const setupCapacitor = async () => {
      try {
        // Dynamically import @capacitor/app to avoid SSR issues
        const { App } = await import('@capacitor/app');

        // Back Button Listener
        const backHandle = await App.addListener('backButton', async (event) => {
          const currentPath = window.location.pathname;
          const stack = historyStackRef.current;

          // Check if user is at the root/main screen
          const isRoot = ROOT_SCREENS.has(currentPath);

          if (isRoot && stack.length <= 1) {
            // At root screen with nowhere left to navigate back -> exit app cleanly
            await App.exitApp();
            return;
          }

          // If there is history to navigate back to
          if (stack.length > 1) {
            isNavigatingBackRef.current = true;
            stack.pop(); // Remove current screen
            const prevScreen = stack[stack.length - 1];

            try {
              sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(stack));
            } catch {
              // Ignore
            }

            if (event.canGoBack) {
              window.history.back();
            } else if (prevScreen) {
              router.push(prevScreen);
            } else {
              router.push(getParentRoute(currentPath));
            }
          } else if (!isRoot) {
            // Stack was empty/single but user is on a child screen (Screen B or C)
            // Navigate to parent route (e.g. /admin/students/123 -> /admin/students -> /admin)
            const parent = getParentRoute(currentPath);
            isNavigatingBackRef.current = true;
            router.push(parent);
          } else {
            // At root screen
            await App.exitApp();
          }
        });

        // App State Change Listener (Minimize / Resume)
        const stateHandle = await App.addListener('appStateChange', ({ isActive }) => {
          if (!isActive) {
            // App minimized / sent to background: save position immediately
            try {
              localStorage.setItem(LAST_ROUTE_KEY, window.location.pathname);
            } catch {
              // Ignore
            }
          }
        });

        cleanupCapacitorBack = () => {
          backHandle.remove();
        };
        cleanupCapacitorState = () => {
          stateHandle.remove();
        };
      } catch {
        // Not running inside a native Capacitor runtime; fallback to web popstate
      }
    };

    setupCapacitor();

    // 4. Web / PWA / Android Browser Visibility & Popstate Handling
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        try {
          localStorage.setItem(LAST_ROUTE_KEY, window.location.pathname);
        } catch {
          // Ignore
        }
      }
    };

    const handlePopState = () => {
      const stack = historyStackRef.current;
      if (stack.length > 1) {
        stack.pop();
        try {
          sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(stack));
        } catch {
          // Ignore
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);

    return () => {
      cleanupCapacitorBack?.();
      cleanupCapacitorState?.();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router]);

  return null;
}
