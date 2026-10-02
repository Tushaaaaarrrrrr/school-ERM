import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/context/auth-context';
import { ToastProvider } from '@/components/ui/toast';
import { SafeAreaProvider } from '@/components/layout/safe-area-provider';
import { AndroidBackButtonHandler } from '@/components/layout/android-back-button-handler';

export const metadata: Metadata = {
  title: 'GI Campus - All in One Education Management',
  description: 'Production-ready, minimal, modern multi-tenant school management system',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GI Campus',
  },
  icons: {
    icon: [
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

import { Suspense } from 'react';
import { RouteLoadingIndicator } from '@/components/layout/route-loading-indicator';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className="h-full overflow-hidden">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="h-full overflow-hidden antialiased font-sans bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
        <AuthProvider>
          <ToastProvider>
            <SafeAreaProvider />
            <AndroidBackButtonHandler />
            <Suspense fallback={null}>
              <RouteLoadingIndicator />
            </Suspense>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
