'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { CountryProvider } from '@/contexts/CountryContext';
import PwaInstallPrompt from '@/components/pwa/PwaInstallPrompt';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CountryProvider>
        {children}
        <PwaInstallPrompt />
      </CountryProvider>
    </AuthProvider>
  );
}
