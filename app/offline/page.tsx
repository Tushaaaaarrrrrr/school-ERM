'use client';

import React from 'react';
import Link from 'next/link';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-600 mb-4">
        <WifiOff className="w-8 h-8" />
      </div>
      <h1 className="text-xl font-bold text-slate-900 mb-2">You are currently offline</h1>
      <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
        School ERP needs an internet connection to sync real-time records. Please check your network and try again.
      </p>
      <Button
        variant="primary"
        size="sm"
        onClick={() => window.location.reload()}
        leftIcon={<RefreshCw className="w-4 h-4" />}
      >
        Retry Connection
      </Button>
    </div>
  );
}
