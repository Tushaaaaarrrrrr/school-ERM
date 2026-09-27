// ============================================================================
// Notification Service Abstraction (Prepares for Web Notifications / Push / Native)
// ============================================================================

import { isBrowser } from './platform';

export interface AppNotification {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, unknown>;
}

export const notificationService = {
  async requestPermission(): Promise<boolean> {
    if (!isBrowser() || !('Notification' in window)) {
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  },

  async showNotification(payload: AppNotification): Promise<void> {
    if (!isBrowser()) return;

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icons/icon-192.png',
          data: payload.data,
        });
      } catch (err) {
        console.warn('Native notification failed, falling back:', err);
      }
    }
  },
};
