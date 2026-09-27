'use client';

// ============================================================================
// PWA Service Worker Registration & One-Click Native Install Banner
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone, CheckCircle, Sparkles, Share2, PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isInstalledSuccess, setIsInstalledSuccess] = useState(false);

  useEffect(() => {
    // 1. Check if already installed & running in Standalone PWA window
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };
    checkStandalone();

    // 2. Check iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 3. Check dismiss state in sessionStorage
    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    // 4. Register Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('PWA ServiceWorker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('PWA ServiceWorker registration failed:', err);
        });
    }

    // 5. Listen for BeforeInstallPromptEvent (Chrome, Edge, Android, Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalledSuccess(true);
      setDeferredPrompt(null);
      setTimeout(() => setIsInstalledSuccess(false), 5000);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIos) {
        setShowIosGuide(true);
      }
      return;
    }

    // Show native browser install prompt
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
      setIsInstalledSuccess(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  // If already running in app mode (installed), don't show the install bar
  if (isStandalone || isDismissed) {
    return null;
  }

  // If install prompt is ready or if iOS user
  if (!deferredPrompt && !isIos) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom App Install Bar */}
      <div className="fixed bottom-[calc(4.5rem+max(env(safe-area-inset-bottom,0px),var(--js-safe-area-bottom,0px)))] left-4 right-4 sm:left-auto sm:right-6 sm:bottom-4 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <strong className="text-xs font-bold truncate">Install School ERP App</strong>
                <span className="text-[9px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                Install as a native standalone app for fast, fullscreen access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="xs"
              onClick={handleInstallClick}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs whitespace-nowrap"
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Install App
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Add to Home Screen Modal Guide */}
      {showIosGuide && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 text-left animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Install on iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Follow these simple steps in Safari to install School ERP on your home screen:
            </p>

            <ol className="space-y-3 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Tap the <strong className="font-semibold">Share</strong> button at the bottom of Safari (
                  <Share2 className="w-3.5 h-3.5 inline text-indigo-600" />).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Scroll down and tap <strong className="font-semibold">Add to Home Screen</strong> (
                  <PlusSquare className="w-3.5 h-3.5 inline text-indigo-600" />).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Tap <strong className="font-semibold text-indigo-600">Add</strong> in the top-right corner.
                </span>
              </li>
            </ol>

            <Button
              variant="primary"
              size="sm"
              className="w-full justify-center"
              onClick={() => setShowIosGuide(false)}
            >
              Got It!
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
