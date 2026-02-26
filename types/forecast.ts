import type { MoonInfo } from '@/types/moon';
import type { SpeciesPreset, UnitSystem } from '@/types/settings';

export type FactorKey =
  | 'pressureTrend'
  | 'pressureLevel'
  | 'wind'
  | 'precipitation'
  | 'cloudCover'
  | 'temperature'
  | 'moon'
  | 'speciesBehavior';

export type RatingLabel = 'Poor' | 'Fair' | 'Good' | 'Great' | 'Epic';

export interface HourlyWeatherInput {
  time: number[];
  temperature2m: number[];
  precipitationProbability: number[];
  windspeed10m: number[];
  windgusts10m: number[];
  cloudcover: number[];
  pressure: number[];
}

export interface WeatherForecast {
  latitude: number;
  longitude: number;
  timezone: string;
  fetchedAt: string;
  hourly: HourlyWeatherInput;
}

export interface LocationInfo {
  label: string;
  latitude: number;
  longitude: number;
  source: 'geolocation' | 'manual';
  timezone?: string;
}

export interface HourlyInputs {
  temperatureC: number;
  precipitationProbability: number;
  windSpeedKmh: number;
  windGustKmh: number;
  cloudCover: number;
  pressureHpa: number;
}

export type FactorPointMap = Record<FactorKey, number>;

export interface HourlyScorePoint {
  epoch: number;
  score: number;
  inputs: HourlyInputs;
  contributions: FactorPointMap;
}

export interface FactorContribution {
  factor: FactorKey;
  label: string;
  points: number;
  normalized: number;
  weight: number;
  insight: string;
}

export interface BestWindow {
  startEpoch: number;
  endEpoch: number;
  peakEpoch: number;
  avgScore: number;
  peakScore: number;
  label: string;
}

export type SolunarWindowType = 'major' | 'minor';

export interface SolunarWindow {
  type: SolunarWindowType;
  startEpoch: number;
  endEpoch: number;
  peakEpoch: number;
  label: string;
}

export interface SolunarSummary {
  windows: SolunarWindow[];
  note: string;
}

export interface ForecastSummary {
  totalScore: number;
  rating: RatingLabel;
  why: string[];
  bestWindows: BestWindow[];
  lastUpdatedIso: string;
}

export interface ForecastResult {
  location: LocationInfo;
  units: UnitSystem;
  species: SpeciesPreset;
  timezone: string;
  fetchedAt: string;
  moon: MoonInfo;
  solunar: SolunarSummary;
  factorBreakdown: FactorContribution[];
  summary: ForecastSummary;
  hourly: HourlyScorePoint[];
  raw: WeatherForecast;
}
