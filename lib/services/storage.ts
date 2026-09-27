// ============================================================================
// Storage Abstraction (Local/Session/Preferences abstraction)
// ============================================================================

import { isBrowser } from './platform';

export const storageService = {
  getItem<T>(key: string, defaultValue: T): T {
    if (!isBrowser()) return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  setItem<T>(key: string, value: T): void {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn('Error saving to storage:', err);
    }
  },

  removeItem(key: string): void {
    if (!isBrowser()) return;
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn('Error removing from storage:', err);
    }
  },
};
