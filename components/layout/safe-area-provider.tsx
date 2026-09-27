'use client';

// ============================================================================
// Android & Cross-Platform Safe Area Inset Observer for Web / PWA / Capacitor
// Handles 3-Button Navigation, Gesture Navigation, and Orientation Changes
// ============================================================================

import { useEffect } from 'react';

export function SafeAreaProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSafeAreaInsets = () => {
      // 1. Measure CSS env(safe-area-inset-bottom) if supported natively
      const testEl = document.createElement('div');
      testEl.style.position = 'fixed';
      testEl.style.bottom = '0';
      testEl.style.left = '0';
      testEl.style.width = '100%';
      testEl.style.height = '0';
      testEl.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
      testEl.style.visibility = 'hidden';
      testEl.style.pointerEvents = 'none';
      document.body.appendChild(testEl);

      const computedPadding = parseFloat(window.getComputedStyle(testEl).paddingBottom) || 0;
      document.body.removeChild(testEl);

      let jsBottomInset = computedPadding;

      // 2. Fallback detection for Android WebViews / PWAs where env() reports 0px
      // but Android 3-button navigation (~48px) or gesture navigation (~16px) is active
      const userAgent = navigator.userAgent.toLowerCase();
      const isAndroid = /android/.test(userAgent);
      const isMobileWeb = window.innerWidth <= 1024;

      if (isAndroid && isMobileWeb && jsBottomInset === 0) {
        const screenHeight = window.screen.height;
        const windowHeight = window.innerHeight;
        const visualHeight = window.visualViewport ? window.visualViewport.height : windowHeight;

        // Difference between total screen height and available window inner height
        const heightDiff = screenHeight - visualHeight;

        // Android 3-button navigation typical height range: 36px to 64px
        // Gesture navigation inset: ~16px to 24px
        if (heightDiff >= 36 && heightDiff <= 96) {
          jsBottomInset = Math.min(heightDiff, 56);
        } else if (heightDiff > 0 && heightDiff < 36) {
          jsBottomInset = heightDiff;
        }
      }

      document.documentElement.style.setProperty('--js-safe-area-bottom', `${jsBottomInset}px`);
    };

    // Initial check
    updateSafeAreaInsets();

    // Event listeners for viewport resize, orientation change, visualViewport scale/scroll
    window.addEventListener('resize', updateSafeAreaInsets);
    window.addEventListener('orientationchange', updateSafeAreaInsets);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateSafeAreaInsets);
    }

    return () => {
      window.removeEventListener('resize', updateSafeAreaInsets);
      window.removeEventListener('orientationchange', updateSafeAreaInsets);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateSafeAreaInsets);
      }
    };
  }, []);

  return null;
}
