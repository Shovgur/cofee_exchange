'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { CountryProvider } from '@/contexts/CountryContext';
import { PricesProvider } from '@/contexts/PricesContext';
import PwaInstallPrompt from '@/components/pwa/PwaInstallPrompt';
import NavigationProgress from '@/components/ui/NavigationProgress';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <NavigationProgress />
      <CountryProvider>
        {/* PricesProvider sits inside CountryProvider so it can read country.id */}
        <PricesProvider>
          {children}
          <PwaInstallPrompt />
        </PricesProvider>
      </CountryProvider>
    </AuthProvider>
  );
}
