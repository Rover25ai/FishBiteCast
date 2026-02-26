import type { FactorKey } from '@/types/forecast';
import type { SpeciesPreset } from '@/types/settings';

export type FactorWeights = Record<FactorKey, number>;

export interface ThresholdConfig {
  pressureIdealHpa: number;
  pressureIdealBandHpa: number;
  pressureWideBandHpa: number;
  pressureTrendGoodRange: [number, number];
  pressureTrendBadRiseHpa: number;
  pressureTrendBadDropHpa: number;
  windGoodRangeKmh: [number, number];
  windStrongKmh: number;
  windVeryStrongKmh: number;
  gustPenaltyDeltaKmh: number;
  precipitationLightPct: number;
  precipitationModeratePct: number;
  precipitationHighPct: number;
  cloudGoodRangePct: [number, number];
  temperatureStableDeltaC: number;
  temperatureSwingDeltaC: number;
}

export interface SpeciesConfig {
  label: string;
  weights: FactorWeights;
  preferredTempRangeC: [number, number];
  moonInfluence: number;
  behavior: SpeciesBehaviorConfig;
}

export interface SpeciesBehaviorConfig {
  spawnMonths: number[];
  spawnTempRangeC: [number, number];
  feedingWindows: Array<[number, number]>;
  lowLightPreference: 'low' | 'moderate' | 'high';
  nightFeedingBoost?: boolean;
}

export interface ForecastConfig {
  thresholds: ThresholdConfig;
  species: Record<SpeciesPreset, SpeciesConfig>;
}

const baseWeights: FactorWeights = {
  pressureTrend: 0.22,
  pressureLevel: 0.11,
  wind: 0.19,
  precipitation: 0.15,
  cloudCover: 0.08,
  temperature: 0.14,
  moon: 0.04,
  speciesBehavior: 0.07,
};

export const FACTOR_LABELS: Record<FactorKey, string> = {
  pressureTrend: 'Pressure Trend',
  pressureLevel: 'Pressure Level',
  wind: 'Wind',
  precipitation: 'Precipitation Risk',
  cloudCover: 'Cloud Cover',
  temperature: 'Temperature Stability',
  moon: 'Moon Phase',
  speciesBehavior: 'Species Behavior',
};

export const DEFAULT_FORECAST_CONFIG: ForecastConfig = {
  thresholds: {
    pressureIdealHpa: 1012,
    pressureIdealBandHpa: 6,
    pressureWideBandHpa: 13,
    pressureTrendGoodRange: [-2.2, 0.8],
    pressureTrendBadRiseHpa: 3.2,
    pressureTrendBadDropHpa: -4,
    windGoodRangeKmh: [7, 19],
    windStrongKmh: 31,
    windVeryStrongKmh: 42,
    gustPenaltyDeltaKmh: 18,
    precipitationLightPct: 22,
    precipitationModeratePct: 45,
    precipitationHighPct: 70,
    cloudGoodRangePct: [35, 70],
    temperatureStableDeltaC: 1.6,
    temperatureSwingDeltaC: 4.8,
  },
  species: {
    bass: {
      label: 'Largemouth/Smallmouth Bass',
      weights: {
        ...baseWeights,
        pressureTrend: 0.25,
        wind: 0.21,
        moon: 0.05,
      },
      preferredTempRangeC: [15, 26],
      moonInfluence: 0.9,
      behavior: {
        spawnMonths: [4, 5, 6],
        spawnTempRangeC: [15, 21],
        feedingWindows: [
          [5, 9],
          [17, 21],
        ],
        lowLightPreference: 'moderate',
      },
    },
    whiteBass: {
      label: 'White Bass',
      weights: {
        ...baseWeights,
        wind: 0.22,
        temperature: 0.14,
        moon: 0.04,
      },
      preferredTempRangeC: [14, 24],
      moonInfluence: 0.8,
      behavior: {
        spawnMonths: [3, 4, 5],
        spawnTempRangeC: [12, 19],
        feedingWindows: [
          [5, 8],
          [18, 22],
        ],
        lowLightPreference: 'moderate',
      },
    },
    striper: {
      label: 'Striper (Striped Bass)',
      weights: {
        ...baseWeights,
        pressureLevel: 0.11,
        wind: 0.23,
        precipitation: 0.14,
        cloudCover: 0.09,
        temperature: 0.14,
      },
      preferredTempRangeC: [13, 24],
      moonInfluence: 0.85,
      behavior: {
        spawnMonths: [4, 5, 6],
        spawnTempRangeC: [15, 22],
        feedingWindows: [
          [4, 8],
          [18, 23],
        ],
        lowLightPreference: 'high',
        nightFeedingBoost: true,
      },
    },
    crappie: {
      label: 'Crappie',
      weights: {
        ...baseWeights,
        cloudCover: 0.11,
        temperature: 0.17,
        moon: 0.04,
      },
      preferredTempRangeC: [12, 24],
      moonInfluence: 0.75,
      behavior: {
        spawnMonths: [4, 5, 6],
        spawnTempRangeC: [14, 20],
        feedingWindows: [
          [6, 10],
          [16, 20],
        ],
        lowLightPreference: 'moderate',
      },
    },
    trout: {
      label: 'Trout',
      weights: {
        ...baseWeights,
        temperature: 0.2,
        wind: 0.18,
        precipitation: 0.15,
        moon: 0.03,
      },
      preferredTempRangeC: [8, 18],
      moonInfluence: 0.6,
      behavior: {
        spawnMonths: [9, 10, 11],
        spawnTempRangeC: [7, 13],
        feedingWindows: [
          [6, 9],
          [17, 20],
        ],
        lowLightPreference: 'moderate',
      },
    },
    catfish: {
      label: 'Catfish',
      weights: {
        ...baseWeights,
        precipitation: 0.18,
        cloudCover: 0.1,
        moon: 0.07,
      },
      preferredTempRangeC: [18, 30],
      moonInfluence: 1,
      behavior: {
        spawnMonths: [5, 6, 7],
        spawnTempRangeC: [21, 29],
        feedingWindows: [
          [20, 23],
          [0, 4],
        ],
        lowLightPreference: 'high',
        nightFeedingBoost: true,
      },
    },
    walleye: {
      label: 'Walleye',
      weights: {
        ...baseWeights,
        wind: 0.22,
        pressureTrend: 0.23,
        cloudCover: 0.1,
        temperature: 0.14,
        moon: 0.06,
      },
      preferredTempRangeC: [10, 21],
      moonInfluence: 0.9,
      behavior: {
        spawnMonths: [3, 4, 5],
        spawnTempRangeC: [6, 13],
        feedingWindows: [
          [4, 8],
          [17, 22],
        ],
        lowLightPreference: 'high',
      },
    },
    bream: {
      label: 'Bream (Bluegill/Sunfish)',
      weights: {
        ...baseWeights,
        temperature: 0.18,
        wind: 0.18,
        cloudCover: 0.1,
        precipitation: 0.15,
        moon: 0.04,
      },
      preferredTempRangeC: [16, 28],
      moonInfluence: 0.7,
      behavior: {
        spawnMonths: [5, 6, 7, 8],
        spawnTempRangeC: [20, 29],
        feedingWindows: [
          [6, 10],
          [16, 20],
        ],
        lowLightPreference: 'low',
      },
    },
  },
};
