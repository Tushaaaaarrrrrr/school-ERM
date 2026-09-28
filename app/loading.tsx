import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-600 gap-3 p-4">
      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-xl flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
      </div>
      <p className="text-xs font-semibold text-slate-700 tracking-wide">Loading...</p>
    </div>
  );
}
