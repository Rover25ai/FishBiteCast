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

function parseJson<T>(value: string | null): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function loadSettings(): UserSettings {
  if (!canUseStorage()) return DEFAULT_SETTINGS;

  const parsed = parseJson<UserSettings>(window.localStorage.getItem(STORAGE_KEYS.settings));
  if (!parsed) return DEFAULT_SETTINGS;

  return {
    units: parsed.units === 'metric' ? 'metric' : 'imperial',
    species: parsed.species ?? DEFAULT_SETTINGS.species,
  };
}

export function saveSettings(settings: UserSettings): void {
  if (!canUseStorage()) return;

  window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

export function loadLastLocation(): LocationInfo | null {
  if (!canUseStorage()) return null;

  const parsed = parseJson<CachedLocation>(window.localStorage.getItem(STORAGE_KEYS.lastLocation));
  if (!parsed) return null;

  const ageMs = Date.now() - new Date(parsed.savedAt).getTime();
  if (ageMs > LOCATION_MAX_AGE_MS) {
    window.localStorage.removeItem(STORAGE_KEYS.lastLocation);
    return null;
  }

  return parsed.location;
}

export function saveLastLocation(location: LocationInfo): void {
  if (!canUseStorage()) return;

  const payload: CachedLocation = {
    savedAt: new Date().toISOString(),
    location,
  };

  window.localStorage.setItem(STORAGE_KEYS.lastLocation, JSON.stringify(payload));
}

export function loadCachedForecast(): ForecastCache | null {
  if (!canUseStorage()) return null;

  const parsed = parseJson<ForecastCache>(window.localStorage.getItem(STORAGE_KEYS.forecastCache));
  if (!parsed) return null;

  const ageMs = Date.now() - new Date(parsed.savedAt).getTime();
  if (ageMs > CACHE_MAX_AGE_MS) {
    window.localStorage.removeItem(STORAGE_KEYS.forecastCache);
    return null;
  }

  return parsed;
}

export function saveCachedForecast(weather: WeatherForecast, result: ForecastResult): void {
  if (!canUseStorage()) return;

  const payload: ForecastCache = {
    savedAt: new Date().toISOString(),
    weather,
    result,
  };

  window.localStorage.setItem(STORAGE_KEYS.forecastCache, JSON.stringify(payload));
}

export function clearCachedForecast(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEYS.forecastCache);
}
