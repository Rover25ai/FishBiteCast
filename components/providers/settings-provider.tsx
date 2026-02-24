'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DEFAULT_SETTINGS } from '@/lib/constants';
import { loadSettings, saveSettings } from '@/lib/storage';
import type { SpeciesPreset, UnitSystem, UserSettings } from '@/types/settings';

interface SettingsContextValue {
  settings: UserSettings;
  hydrated: boolean;
  setUnits: (units: UnitSystem) => void;
  setSpecies: (species: SpeciesPreset) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }): JSX.Element {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadSettings();
    setSettings(stored);
    setHydrated(true);
  }, []);

  const setUnits = (units: UnitSystem): void => {
    setSettings((prev) => {
      const next = { ...prev, units };
      saveSettings(next);
      return next;
    });
  };

  const setSpecies = (species: SpeciesPreset): void => {
    setSettings((prev) => {
      const next = { ...prev, species };
      saveSettings(next);
      return next;
    });
  };

  const value = useMemo(
    () => ({
      settings,
      hydrated,
      setUnits,
      setSpecies,
    }),
    [hydrated, settings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettings must be used inside SettingsProvider');
  }

  return context;
}
