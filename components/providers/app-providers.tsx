'use client';

import type { ReactNode } from 'react';

import { ForecastProvider } from '@/components/providers/forecast-provider';
import { SettingsProvider } from '@/components/providers/settings-provider';

export function AppProviders({ children }: { children: ReactNode }): JSX.Element {
  return (
    <SettingsProvider>
      <ForecastProvider>{children}</ForecastProvider>
    </SettingsProvider>
  );
}
