import { CACHE_MAX_AGE_MS, DEFAULT_SETTINGS, LOCATION_MAX_AGE_MS, STORAGE_KEYS } from '@/lib/constants';
import type { ForecastResult, LocationInfo, WeatherForecast } from '@/types/forecast';
import type { UserSettings } from '@/types/settings';

interface CachedLocation {
  savedAt: string;
  location: LocationInfo;
}

interface ForecastCache {
  savedAt: string;
  weather: WeatherForecast;
  result: ForecastResult;
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function safeGetItem(key: string): string | null {
  if (!canUseStorage()) return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Safari private mode and constrained environments can throw on storage writes.
  }
}

function safeRemoveItem(key: string): void {
  if (!canUseStorage()) return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage cleanup failures.
  }
}

function parseJson<T>(value: string | null): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function loadSettings(): UserSettings {
  const parsed = parseJson<Partial<UserSettings>>(safeGetItem(STORAGE_KEYS.settings));
  if (!parsed) return DEFAULT_SETTINGS;

  return {
    species: parsed.species ?? DEFAULT_SETTINGS.species,
  };
}

export function saveSettings(settings: UserSettings): void {
  safeSetItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

export function loadLastLocation(): LocationInfo | null {
  const parsed = parseJson<CachedLocation>(safeGetItem(STORAGE_KEYS.lastLocation));
  if (!parsed) return null;

  const ageMs = Date.now() - new Date(parsed.savedAt).getTime();
  if (ageMs > LOCATION_MAX_AGE_MS) {
    safeRemoveItem(STORAGE_KEYS.lastLocation);
    return null;
  }

  return parsed.location;
}

export function saveLastLocation(location: LocationInfo): void {
  const payload: CachedLocation = {
    savedAt: new Date().toISOString(),
    location,
  };

  safeSetItem(STORAGE_KEYS.lastLocation, JSON.stringify(payload));
}

export function loadCachedForecast(): ForecastCache | null {
  const parsed = parseJson<ForecastCache>(safeGetItem(STORAGE_KEYS.forecastCache));
  if (!parsed) return null;

  const ageMs = Date.now() - new Date(parsed.savedAt).getTime();
  if (ageMs > CACHE_MAX_AGE_MS) {
    safeRemoveItem(STORAGE_KEYS.forecastCache);
    return null;
  }

  return {
    ...parsed,
    result: {
      ...parsed.result,
      units: 'imperial',
    },
  };
}

export function saveCachedForecast(weather: WeatherForecast, result: ForecastResult): void {
  const payload: ForecastCache = {
    savedAt: new Date().toISOString(),
    weather,
    result,
  };

  safeSetItem(STORAGE_KEYS.forecastCache, JSON.stringify(payload));
}

export function clearCachedForecast(): void {
  safeRemoveItem(STORAGE_KEYS.forecastCache);
}
