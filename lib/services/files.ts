// ============================================================================
// File Handling Abstraction (Web & Capacitor File System Ready)
// ============================================================================

import { isBrowser } from './platform';

export const fileService = {
  /**
   * Triggers a client-side download of text/CSV/JSON/blob data
   */
  downloadFile(content: string | Blob, filename: string, mimeType = 'text/plain') {
    if (!isBrowser()) return;

    const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Converts a File to Base64 (useful for uploads or preview before storage)
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  },
};
