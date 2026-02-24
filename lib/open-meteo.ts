import type { GeocodeResult } from '@/types/geocode';
import type { WeatherForecast } from '@/types/forecast';

const GEOCODE_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(url: string, timeoutMs = 12000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new ApiError(`Request failed with status ${response.status}`, response.status);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request timed out. Please retry.');
    }

    throw new ApiError('Unable to reach forecast services. Please retry.');
  } finally {
    clearTimeout(timeout);
  }
}

interface OpenMeteoGeocodeResponse {
  results?: Array<{
    id: number;
    name: string;
    admin1?: string;
    country?: string;
    latitude: number;
    longitude: number;
    timezone?: string;
  }>;
}

interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: {
    time: number[];
    temperature_2m: number[];
    precipitation_probability: number[];
    windspeed_10m: number[];
    windgusts_10m: number[];
    cloudcover: number[];
    surface_pressure?: number[];
    pressure_msl?: number[];
  };
}

export async function searchLocations(query: string): Promise<GeocodeResult[]> {
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  const params = new URLSearchParams({
    name: trimmed,
    count: '8',
    language: 'en',
    format: 'json',
  });

  const url = `${GEOCODE_ENDPOINT}?${params.toString()}`;
  const data = await fetchJson<OpenMeteoGeocodeResponse>(url);

  return (data.results ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    admin1: item.admin1,
    country: item.country,
    latitude: item.latitude,
    longitude: item.longitude,
    timezone: item.timezone,
  }));
}

export async function fetchWeatherForecast(latitude: number, longitude: number): Promise<WeatherForecast> {
  const params = new URLSearchParams({
    latitude: latitude.toFixed(5),
    longitude: longitude.toFixed(5),
    forecast_days: '3',
    timezone: 'auto',
    timeformat: 'unixtime',
    hourly:
      'temperature_2m,precipitation_probability,windspeed_10m,windgusts_10m,cloudcover,surface_pressure,pressure_msl',
  });

  const url = `${FORECAST_ENDPOINT}?${params.toString()}`;
  const data = await fetchJson<OpenMeteoForecastResponse>(url);

  const pressure = data.hourly.surface_pressure ?? data.hourly.pressure_msl;

  if (!pressure || pressure.length === 0) {
    throw new ApiError('Forecast response is missing pressure data. Please retry.');
  }

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone,
    fetchedAt: new Date().toISOString(),
    hourly: {
      time: data.hourly.time,
      temperature2m: data.hourly.temperature_2m,
      precipitationProbability: data.hourly.precipitation_probability,
      windspeed10m: data.hourly.windspeed_10m,
      windgusts10m: data.hourly.windgusts_10m,
      cloudcover: data.hourly.cloudcover,
      pressure,
    },
  };
}

export { ApiError };
