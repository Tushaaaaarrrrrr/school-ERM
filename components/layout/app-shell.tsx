'use client';

// ============================================================================
// Master Responsive App Shell Wrapper (with Zero-Bypass 5-Digit PIN Guard)
// ============================================================================

import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { TopHeader } from './top-header';
import { MobileNavigation } from './mobile-navigation';
import { useAuth } from '@/lib/context/auth-context';
import { PinLockScreen } from '@/components/auth/pin-lock-screen';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [embedded, setEmbedded] = useState(false);
  React.useEffect(() => setEmbedded(navigator.userAgent.includes('GI Campus Mobile')), []);
  const { isLoading, currentUser, isPinUnlocked, accessState } = useAuth();

  const [authTimeout, setAuthTimeout] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) setAuthTimeout(true);
    }, 6000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  React.useEffect(() => {
    if (!isLoading) {
      if (!currentUser) {
        if (typeof window !== 'undefined') {
          window.location.replace('/login');
        } else {
          router.replace('/login');
        }
      } else if (accessState === 'DISABLED' || accessState === 'REVOKED' || accessState === 'ERROR') {
        router.replace('/access-unavailable');
      } else if (currentUser.role === 'unassigned' || accessState === 'NO_SCHOOL_ACCESS' || accessState === 'PENDING_ACCESS_REQUEST') {
        router.replace('/join');
      } else {
        const requiredRole = pathname.startsWith('/super-admin') ? 'super_admin' : pathname.startsWith('/admin') ? 'school_admin' : pathname.startsWith('/teacher') ? 'teacher' : pathname.startsWith('/student') ? 'student' : pathname.startsWith('/parent') ? 'parent' : pathname.startsWith('/driver') ? 'driver' : pathname.startsWith('/staff') ? 'staff' : null;
        if (requiredRole && currentUser.role !== requiredRole && !(requiredRole === 'staff' && currentUser.role === 'accountant')) {
          const home = currentUser.role === 'super_admin' ? '/super-admin' : currentUser.role === 'school_admin' ? '/admin' : currentUser.role === 'teacher' ? '/teacher' : currentUser.role === 'student' ? '/student' : currentUser.role === 'parent' ? '/parent' : currentUser.role === 'driver' ? '/driver' : '/staff';
          router.replace(home);
        }
      }
    }
  }, [isLoading, currentUser, accessState, pathname, router]);

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600 gap-4 p-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-700">
          {!currentUser && !isLoading ? 'Redirecting to login...' : 'Checking authentication...'}
        </p>
        {authTimeout && (
          <div className="flex flex-col items-center gap-2 mt-2">
            <p className="text-xs text-slate-500">Taking longer than usual?</p>
            <div className="flex gap-2">
              <button
                onClick={() => { window.location.href = '/login'; }}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >
                Go to Login
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 5-Digit Security PIN Guard: Intercept all screens until unlocked (Super Admin never needs PIN)
  if (currentUser.role !== 'super_admin' && !isPinUnlocked) {
    return <PinLockScreen />;
  }

  return (
    <div className="h-screen h-[100dvh] w-full overflow-hidden flex bg-slate-900 text-slate-900 antialiased font-sans">
      {/* Desktop / Tablet Sidebar (Fixed & Independently Scrollable) */}
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area: Fixed Header + Independently Scrollable Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50">
        <TopHeader onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <div className={`flex-1 min-w-0 h-full overflow-y-auto overscroll-y-contain ${embedded ? '' : 'pb-app-nav lg:pb-0'}`}>
          <main className="p-4 sm:p-6 lg:p-8 w-full">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {!embedded && <MobileNavigation />}
    </div>
  );
}
