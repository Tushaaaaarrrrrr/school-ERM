// ============================================================================
// Platform Abstraction (Web / PWA / Capacitor Android & iOS)
// ============================================================================

export type PlatformType = 'web' | 'pwa' | 'ios' | 'android';

export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function isPWA(): boolean {
  if (!isBrowser()) return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function isCapacitor(): boolean {
  if (!isBrowser()) return false;
  return !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })?.Capacitor?.isNativePlatform?.();
}

export function getPlatform(): PlatformType {
  if (!isBrowser()) return 'web';
  if (isCapacitor()) {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    if (/android/.test(userAgent)) return 'android';
  }
  if (isPWA()) return 'pwa';
  return 'web';
}

export function isNative(): boolean {
  const p = getPlatform();
  return p === 'ios' || p === 'android';
}
