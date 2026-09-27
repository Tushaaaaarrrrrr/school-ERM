'use client';

import React from 'react';
import { AppShell } from '@/components/layout/app-shell';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
