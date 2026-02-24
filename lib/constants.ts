import type { UserSettings } from '@/types/settings';

export const STORAGE_KEYS = {
  settings: 'bitecast.settings.v1',
  lastLocation: 'bitecast.lastLocation.v1',
  forecastCache: 'bitecast.forecastCache.v1',
} as const;

export const DEFAULT_SETTINGS: UserSettings = {
  units: 'imperial',
  species: 'bass',
};

export const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 6;
export const LOCATION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;
