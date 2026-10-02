'use client';

import React, { useEffect, useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
  fullScreen?: boolean;
  allowFullScreenToggle?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  fullScreen = false,
  allowFullScreenToggle = true,
}: ModalProps) {
  const [isFullScreen, setIsFullScreen] = useState(fullScreen);

  useEffect(() => {
    setIsFullScreen(fullScreen);
  }, [fullScreen, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
    '2xl': 'max-w-4xl',
    '3xl': 'max-w-5xl',
    '4xl': 'max-w-6xl',
    full: 'max-w-full md:max-w-[98vw]',
  };

  if (isFullScreen) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col bg-white animate-in fade-in"
        style={{ width: '100vw', height: '100dvh' }}
      >
        {/* Fullscreen Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shadow-xs shrink-0">
          <div className="space-y-0.5 pr-4">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
            {description && <p className="text-xs sm:text-sm text-slate-500">{description}</p>}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {allowFullScreenToggle && (
              <button
                type="button"
                onClick={() => setIsFullScreen(false)}
                className="text-slate-500 hover:text-slate-800 rounded-xl p-2 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Exit Full Screen"
                aria-label="Exit Full Screen"
              >
                <Minimize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 rounded-xl p-2 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Fullscreen Body — flex-1 + min-h-0 lets it scroll within the remaining height */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50/60 p-4 sm:p-6 md:p-8 overscroll-contain">
          <div className="max-w-6xl mx-auto w-full pb-4">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in zoom-in-95 my-auto max-h-[94vh] flex flex-col',
          maxWidths[maxWidth]
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="space-y-0.5 pr-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
            {description && <p className="text-xs sm:text-sm text-slate-500">{description}</p>}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {allowFullScreenToggle && (
              <button
                type="button"
                onClick={() => setIsFullScreen(true)}
                className="text-slate-400 hover:text-slate-700 rounded-xl p-1.5 hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Open in Full Screen"
                aria-label="Open in Full Screen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 rounded-xl p-1.5 hover:bg-slate-200/60 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body (Properly constrained scrollable flex child) */}
        <div className="p-4 sm:p-5 md:p-6 overflow-y-auto flex-1 min-h-0 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
