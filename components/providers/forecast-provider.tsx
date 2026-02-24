'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { buildForecastScore } from '@/lib/scoring/engine';
import { fetchWeatherForecast, searchLocations } from '@/lib/open-meteo';
import { clearCachedForecast, loadCachedForecast, loadLastLocation, saveCachedForecast, saveLastLocation } from '@/lib/storage';
import type { GeocodeResult } from '@/types/geocode';
import type { ForecastResult, LocationInfo, WeatherForecast } from '@/types/forecast';

import { useSettings } from './settings-provider';

interface ForecastContextValue {
  result: ForecastResult | null;
  location: LocationInfo | null;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  useMyLocation: () => Promise<void>;
  searchCity: (query: string) => Promise<GeocodeResult[]>;
  selectManualLocation: (choice: GeocodeResult) => void;
  refresh: () => void;
}

const ForecastContext = createContext<ForecastContextValue | null>(null);

function geolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location permission denied. Use manual search to continue.';
    case error.POSITION_UNAVAILABLE:
      return 'Location unavailable right now. Try manual search.';
    case error.TIMEOUT:
      return 'Location request timed out. Please try again.';
    default:
      return 'Unable to determine location. Try manual search.';
  }
}

function labelForManualLocation(choice: GeocodeResult): string {
  const parts = [choice.name, choice.admin1, choice.country].filter(Boolean);
  return parts.join(', ');
}

function labelForCoordinates(latitude: number, longitude: number): string {
  return `Near ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
}

function isLocationInfo(value: unknown): value is LocationInfo {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<LocationInfo>;
  return (
    typeof candidate.label === 'string' &&
    typeof candidate.latitude === 'number' &&
    Number.isFinite(candidate.latitude) &&
    typeof candidate.longitude === 'number' &&
    Number.isFinite(candidate.longitude) &&
    (candidate.source === 'geolocation' || candidate.source === 'manual')
  );
}

export function ForecastProvider({ children }: { children: ReactNode }): JSX.Element {
  const { settings } = useSettings();

  const [result, setResult] = useState<ForecastResult | null>(null);
  const [weather, setWeather] = useState<WeatherForecast | null>(null);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  const refreshDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshNow = useCallback(
    async (target: LocationInfo) => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOffline(true);
        setLoading(false);

        if (!result) {
          setError('Offline and no cached forecast is available yet. Connect and retry.');
        }

        return;
      }

      setLoading(true);
      setError(null);

      try {
        const fetchedWeather = await fetchWeatherForecast(target.latitude, target.longitude);
        const scored = buildForecastScore({
          forecast: fetchedWeather,
          location: { ...target, timezone: fetchedWeather.timezone },
          settings,
        });

        setWeather(fetchedWeather);
        setResult(scored);
        setLocation(scored.location);
        saveLastLocation(scored.location);
        saveCachedForecast(fetchedWeather, scored);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load forecast.');
      } finally {
        setLoading(false);
      }
    },
    [result, settings],
  );

  const queueRefresh = useCallback(
    (target: LocationInfo) => {
      if (refreshDebounceRef.current) {
        clearTimeout(refreshDebounceRef.current);
      }

      setLocation(target);
      setLoading(true);
      setError(null);

      refreshDebounceRef.current = setTimeout(() => {
        void refreshNow(target);
      }, 420);
    },
    [refreshNow],
  );

  const useMyLocation = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported in this browser. Use manual search.');
      return;
    }

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setError('Location requires HTTPS (or localhost). Use manual search.');
      return;
    }

    if ('permissions' in navigator && typeof navigator.permissions.query === 'function') {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'denied') {
          setError('Location permission is blocked in browser settings. Use manual search or re-enable location access.');
          return;
        }
      } catch {
        // Ignore permissions API failures and continue to actual geolocation request.
      }
    }

    setLoading(true);
    setError(null);

    try {
      await new Promise<void>((resolve) => {
        let settled = false;
        const finish = (): void => {
          if (settled) return;
          settled = true;
          resolve();
        };

        const fallbackTimer = setTimeout(() => {
          setLoading(false);
          setError('Location request timed out. Use manual search or try again.');
          finish();
        }, 12000);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(fallbackTimer);
            const nextLocation: LocationInfo = {
              label: labelForCoordinates(position.coords.latitude, position.coords.longitude),
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              source: 'geolocation',
            };

            queueRefresh(nextLocation);
            finish();
          },
          (geoError) => {
            clearTimeout(fallbackTimer);
            setLoading(false);
            setError(geolocationErrorMessage(geoError));
            finish();
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 1000 * 60 * 10,
          },
        );
      });
    } catch {
      setLoading(false);
      setError('Location access is blocked in this context. Use manual search.');
    }
  }, [queueRefresh]);

  const searchCity = useCallback(async (query: string): Promise<GeocodeResult[]> => {
    try {
      return await searchLocations(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Location search failed.');
      return [];
    }
  }, []);

  const selectManualLocation = useCallback(
    (choice: GeocodeResult) => {
      const nextLocation: LocationInfo = {
        label: labelForManualLocation(choice),
        latitude: choice.latitude,
        longitude: choice.longitude,
        source: 'manual',
        timezone: choice.timezone,
      };

      queueRefresh(nextLocation);
    },
    [queueRefresh],
  );

  const refresh = useCallback(() => {
    if (location) {
      void refreshNow(location);
    }
  }, [location, refreshNow]);

  useEffect(() => {
    const cached = loadCachedForecast();

    if (cached) {
      setWeather(cached.weather);
      if (isLocationInfo(cached.result?.location)) {
        setLocation(cached.result.location);
      }
    }

    const cachedLocation = isLocationInfo(cached?.result?.location) ? cached.result.location : null;
    const lastLocation = cachedLocation ?? loadLastLocation();
    if (lastLocation) {
      setLocation(lastLocation);

      if (typeof navigator !== 'undefined' && navigator.onLine) {
        queueRefresh(lastLocation);
      }
    }

    if (typeof window === 'undefined') return;

    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      if (refreshDebounceRef.current) {
        clearTimeout(refreshDebounceRef.current);
      }
    };
  }, [queueRefresh]);

  useEffect(() => {
    if (!weather || !location) return;

    try {
      const recomputed = buildForecastScore({
        forecast: weather,
        location,
        settings,
      });

      setResult(recomputed);
      saveCachedForecast(weather, recomputed);
    } catch (err) {
      setResult(null);
      clearCachedForecast();
      setError(err instanceof Error ? err.message : 'Cached forecast was invalid. Please refresh.');
    }
  }, [location, settings, weather]);

  const value = useMemo(
    () => ({
      result,
      location,
      loading,
      error,
      isOffline,
      useMyLocation,
      searchCity,
      selectManualLocation,
      refresh,
    }),
    [result, location, loading, error, isOffline, useMyLocation, searchCity, selectManualLocation, refresh],
  );

  return <ForecastContext.Provider value={value}>{children}</ForecastContext.Provider>;
}

export function useForecast(): ForecastContextValue {
  const context = useContext(ForecastContext);
  if (!context) {
    throw new Error('useForecast must be used inside ForecastProvider');
  }
  return context;
}
