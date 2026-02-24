import { computeMoonInfo } from '@/lib/moon';
import { average, clamp, epochHourInTimezone, formatHourRange } from '@/lib/format';
import { DEFAULT_FORECAST_CONFIG, FACTOR_LABELS, type FactorWeights, type ForecastConfig } from '@/lib/scoring/config';
import { buildSolunarSummary } from '@/lib/solunar';
import type {
  BestWindow,
  FactorContribution,
  FactorKey,
  FactorPointMap,
  ForecastResult,
  HourlyScorePoint,
  LocationInfo,
  RatingLabel,
  WeatherForecast,
} from '@/types/forecast';
import type { UserSettings } from '@/types/settings';

function scorePressureTrend(trendHpa: number, goodRange: [number, number], badRise: number, badDrop: number): number {
  if (trendHpa <= badDrop) return -1;
  if (trendHpa >= badRise) return -0.95;
  if (trendHpa >= goodRange[0] && trendHpa <= goodRange[1]) return 0.75;
  if (trendHpa > goodRange[1] && trendHpa < badRise) return -0.35;
  if (trendHpa < goodRange[0] && trendHpa > badDrop) return -0.2;
  return 0;
}

function scorePressureLevel(levelHpa: number, ideal: number, idealBand: number, wideBand: number): number {
  const distance = Math.abs(levelHpa - ideal);
  if (distance <= idealBand) return 0.45;
  if (distance <= wideBand) return 0.12;
  if (distance <= wideBand + 6) return -0.25;
  return -0.55;
}

function scoreWind(speedKmh: number, gustKmh: number, goodRange: [number, number], strong: number, veryStrong: number, gustDelta: number): number {
  let score = 0;

  if (speedKmh < 3) score = -0.25;
  else if (speedKmh < goodRange[0]) score = 0.28;
  else if (speedKmh <= goodRange[1]) score = 0.72;
  else if (speedKmh < strong) score = 0.15;
  else if (speedKmh < veryStrong) score = -0.58;
  else score = -1;

  if (gustKmh - speedKmh >= gustDelta) {
    score -= 0.25;
  }

  return clamp(score, -1, 1);
}

function scorePrecip(probabilityPct: number, light: number, moderate: number, high: number): number {
  if (probabilityPct <= light) return 0.2;
  if (probabilityPct <= moderate) return 0.08;
  if (probabilityPct <= high) return -0.4;
  return -0.9;
}

function scoreCloud(cloudPct: number, localHour: number, goodRange: [number, number]): number {
  const isMidday = localHour >= 10 && localHour <= 16;
  const effectMultiplier = isMidday ? 1 : 0.45;

  let score = 0;
  if (cloudPct >= goodRange[0] && cloudPct <= goodRange[1]) score = 0.35;
  else if (cloudPct > 85) score = -0.2;
  else score = 0.05;

  return clamp(score * effectMultiplier, -1, 1);
}

function scoreTemperature(tempC: number, change3h: number, preferredRange: [number, number], stableDelta: number, swingDelta: number): number {
  let score = 0;
  if (change3h <= stableDelta) score += 0.45;
  else if (change3h <= swingDelta) score += 0.05;
  else score -= 0.58;

  if (tempC >= preferredRange[0] && tempC <= preferredRange[1]) score += 0.3;
  else {
    const edgeDistance = Math.min(Math.abs(tempC - preferredRange[0]), Math.abs(tempC - preferredRange[1]));
    score -= edgeDistance <= 3 ? 0.1 : 0.35;
  }

  return clamp(score, -1, 1);
}

function scoreMoon(epoch: number, moonInfluence: number): number {
  const moon = computeMoonInfo(epoch * 1000);

  let score = 0;
  if (moon.name === 'Full Moon' || moon.name === 'New Moon') score += 0.25;
  if (moon.name === 'Waxing Gibbous' || moon.name === 'Waning Gibbous') score += 0.12;

  if (moon.illumination >= 35 && moon.illumination <= 80) {
    score += 0.1;
  }

  return clamp(score * moonInfluence, -1, 1);
}

function toRating(score: number): RatingLabel {
  if (score < 30) return 'Poor';
  if (score < 50) return 'Fair';
  if (score < 70) return 'Good';
  if (score < 85) return 'Great';
  return 'Epic';
}

function insightForFactor(factor: FactorKey, points: number): string {
  const positive = points >= 0;

  switch (factor) {
    case 'pressureTrend':
      return positive ? 'Slightly falling or steady pressure supports activity.' : 'Fast pressure shifts likely suppress strikes.';
    case 'pressureLevel':
      return positive ? 'Pressure level is in a productive range.' : 'Pressure level is outside the ideal zone.';
    case 'wind':
      return positive ? 'Light-to-moderate wind improves bait movement.' : 'Strong or gusty wind makes fish less predictable.';
    case 'precipitation':
      return positive ? 'Low rain risk keeps conditions stable.' : 'Elevated rain risk lowers confidence.';
    case 'cloudCover':
      return positive ? 'Moderate cloud cover can extend feeding windows.' : 'Cloud conditions are less favorable right now.';
    case 'temperature':
      return positive ? 'Water temperature pattern looks stable for feeding.' : 'Abrupt temperature swings may slow activity.';
    case 'moon':
      return positive ? 'Moon phase offers a small tailwind.' : 'Moon phase impact is limited at this time.';
    default:
      return 'Mixed impact.';
  }
}

function whyLine(factor: FactorContribution): string {
  const positive = factor.points >= 0;

  switch (factor.factor) {
    case 'pressureTrend':
      return positive ? 'Falling/steady pressure is helping fish activity.' : 'Pressure is moving too sharply.';
    case 'wind':
      return positive ? 'Moderate wind is improving water movement.' : 'Wind and gusts are too aggressive.';
    case 'precipitation':
      return positive ? 'Rain risk is low enough for stable feeding.' : 'Rain probability is suppressing the bite.';
    case 'temperature':
      return positive ? 'Temperature is holding in a favorable band.' : 'Temperature changes are too abrupt.';
    case 'cloudCover':
      return positive ? 'Cloud cover is in a useful range.' : 'Cloud cover is less supportive today.';
    case 'moon':
      return positive ? 'Moon phase gives a modest boost.' : 'Moon phase is neutral to weak.';
    case 'pressureLevel':
      return positive ? 'Pressure level is close to ideal.' : 'Pressure level is less favorable right now.';
    default:
      return factor.insight;
  }
}

function bestWindows(hourly: HourlyScorePoint[], timezone: string): BestWindow[] {
  const next24 = hourly.slice(0, 24);
  if (next24.length === 0) return [];

  const candidateIndexes: number[] = [];

  for (let i = 0; i < next24.length; i += 1) {
    const current = next24[i]?.score ?? 0;
    const prev = next24[i - 1]?.score ?? -Infinity;
    const next = next24[i + 1]?.score ?? -Infinity;

    if (current >= prev && current >= next) {
      candidateIndexes.push(i);
    }
  }

  const sorted = candidateIndexes.sort((a, b) => next24[b].score - next24[a].score);
  const selected: number[] = [];

  for (const index of sorted) {
    if (selected.every((existing) => Math.abs(existing - index) >= 3)) {
      selected.push(index);
    }

    if (selected.length >= 3) break;
  }

  return selected
    .sort((a, b) => a - b)
    .map((index) => {
      const startIdx = Math.max(0, index - 1);
      const endIdx = Math.min(next24.length - 1, index + 2);
      const segment = next24.slice(startIdx, endIdx + 1);
      const startEpoch = next24[startIdx].epoch;
      const endEpoch = next24[endIdx].epoch;
      const peakEpoch = next24[index].epoch;

      return {
        startEpoch,
        endEpoch,
        peakEpoch,
        avgScore: Math.round(average(segment.map((item) => item.score))),
        peakScore: Math.round(next24[index].score),
        label: formatHourRange(startEpoch, endEpoch, timezone),
      };
    });
}

function scoreToPoints(normalized: number, weight: number): number {
  return normalized * weight * 50;
}

function factorContributionBreakdown(hourly: HourlyScorePoint[], weights: FactorWeights): FactorContribution[] {
  const horizon = hourly.slice(0, 24);
  const factors = Object.keys(weights) as FactorKey[];

  return factors
    .map((factor) => {
      const points = average(horizon.map((item) => item.contributions[factor] ?? 0));
      const normalized = weights[factor] > 0 ? points / (weights[factor] * 50) : 0;

      return {
        factor,
        label: FACTOR_LABELS[factor],
        points: Number(points.toFixed(2)),
        normalized: Number(normalized.toFixed(3)),
        weight: weights[factor],
        insight: insightForFactor(factor, points),
      };
    })
    .sort((a, b) => Math.abs(b.points) - Math.abs(a.points));
}

interface ScoreInput {
  forecast: WeatherForecast;
  location: LocationInfo;
  settings: UserSettings;
  config?: ForecastConfig;
  now?: Date;
}

export function buildForecastScore({ forecast, location, settings, config = DEFAULT_FORECAST_CONFIG, now = new Date() }: ScoreInput): ForecastResult {
  const species = config.species[settings.species];
  const t = config.thresholds;

  const limit = Math.min(
    48,
    forecast.hourly.time.length,
    forecast.hourly.temperature2m.length,
    forecast.hourly.precipitationProbability.length,
    forecast.hourly.windspeed10m.length,
    forecast.hourly.windgusts10m.length,
    forecast.hourly.cloudcover.length,
    forecast.hourly.pressure.length,
  );

  const hourly: HourlyScorePoint[] = [];

  for (let i = 0; i < limit; i += 1) {
    const epoch = forecast.hourly.time[i];
    const temp = forecast.hourly.temperature2m[i];
    const precip = forecast.hourly.precipitationProbability[i];
    const wind = forecast.hourly.windspeed10m[i];
    const gust = forecast.hourly.windgusts10m[i];
    const cloud = forecast.hourly.cloudcover[i];
    const pressure = forecast.hourly.pressure[i];

    const tempChange = i >= 3 ? Math.abs(temp - forecast.hourly.temperature2m[i - 3]) : 0;
    const pressureTrend = i >= 3 ? pressure - forecast.hourly.pressure[i - 3] : 0;
    const localHour = epochHourInTimezone(epoch, forecast.timezone);

    const normalized: Record<FactorKey, number> = {
      pressureTrend: scorePressureTrend(pressureTrend, t.pressureTrendGoodRange, t.pressureTrendBadRiseHpa, t.pressureTrendBadDropHpa),
      pressureLevel: scorePressureLevel(pressure, t.pressureIdealHpa, t.pressureIdealBandHpa, t.pressureWideBandHpa),
      wind: scoreWind(wind, gust, t.windGoodRangeKmh, t.windStrongKmh, t.windVeryStrongKmh, t.gustPenaltyDeltaKmh),
      precipitation: scorePrecip(precip, t.precipitationLightPct, t.precipitationModeratePct, t.precipitationHighPct),
      cloudCover: scoreCloud(cloud, localHour, t.cloudGoodRangePct),
      temperature: scoreTemperature(temp, tempChange, species.preferredTempRangeC, t.temperatureStableDeltaC, t.temperatureSwingDeltaC),
      moon: scoreMoon(epoch, species.moonInfluence),
    };

    const contributions = (Object.keys(species.weights) as FactorKey[]).reduce((acc, factor) => {
      acc[factor] = scoreToPoints(normalized[factor], species.weights[factor]);
      return acc;
    }, {} as FactorPointMap);

    const total = 50 + Object.values(contributions).reduce((sum, value) => sum + value, 0);

    hourly.push({
      epoch,
      score: Number(clamp(total, 0, 100).toFixed(1)),
      inputs: {
        temperatureC: temp,
        precipitationProbability: precip,
        windSpeedKmh: wind,
        windGustKmh: gust,
        cloudCover: cloud,
        pressureHpa: pressure,
      },
      contributions,
    });
  }

  const next24 = hourly.slice(0, 24);
  const totalScore = Math.round(average(next24.map((item) => item.score)));
  const factorBreakdown = factorContributionBreakdown(hourly, species.weights);
  const solunar = buildSolunarSummary({
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: forecast.timezone,
    now,
  });

  return {
    location,
    units: settings.units,
    species: settings.species,
    timezone: forecast.timezone,
    fetchedAt: forecast.fetchedAt,
    moon: computeMoonInfo(now),
    solunar,
    factorBreakdown,
    summary: {
      totalScore,
      rating: toRating(totalScore),
      why: factorBreakdown.slice(0, 3).map(whyLine),
      bestWindows: bestWindows(hourly, forecast.timezone),
      lastUpdatedIso: new Date().toISOString(),
    },
    hourly,
    raw: forecast,
  };
}
