import { buildForecastScore } from '@/lib/scoring/engine';
import type { LocationInfo, WeatherForecast } from '@/types/forecast';

function makeForecast(overrides?: Partial<WeatherForecast['hourly']>, start = 1715774400): WeatherForecast {
  const hours = 48;

  const hourly = {
    time: Array.from({ length: hours }, (_, i) => start + i * 3600),
    temperature2m: Array.from({ length: hours }, () => 19),
    precipitationProbability: Array.from({ length: hours }, () => 20),
    windspeed10m: Array.from({ length: hours }, () => 12),
    windgusts10m: Array.from({ length: hours }, () => 18),
    cloudcover: Array.from({ length: hours }, () => 52),
    pressure: Array.from({ length: hours }, (_, i) => 1013 - i * 0.2),
    ...overrides,
  };

  return {
    latitude: 39.7392,
    longitude: -104.9903,
    timezone: 'America/Denver',
    fetchedAt: new Date().toISOString(),
    hourly,
  };
}

const location: LocationInfo = {
  label: 'Denver, Colorado, United States',
  latitude: 39.7392,
  longitude: -104.9903,
  source: 'manual',
};

describe('buildForecastScore', () => {
  it('scores stable moderate conditions as good or better', () => {
    const forecast = makeForecast();
    const score = buildForecastScore({
      forecast,
      location,
      settings: { species: 'bass' },
    });

    expect(score.summary.totalScore).toBeGreaterThan(60);
    expect(['Good', 'Great', 'Epic']).toContain(score.summary.rating);
    expect(score.factorBreakdown.length).toBeGreaterThan(4);
  });

  it('penalizes severe fronts and weather volatility', () => {
    const forecast = makeForecast({
      windspeed10m: Array.from({ length: 48 }, () => 45),
      windgusts10m: Array.from({ length: 48 }, () => 62),
      precipitationProbability: Array.from({ length: 48 }, () => 88),
      pressure: Array.from({ length: 48 }, (_, i) => 1000 + i * 1.8),
      temperature2m: Array.from({ length: 48 }, (_, i) => (i % 2 === 0 ? 7 : 24)),
    });

    const score = buildForecastScore({
      forecast,
      location,
      settings: { species: 'bass' },
    });

    expect(score.summary.totalScore).toBeLessThan(45);
    expect(['Poor', 'Fair']).toContain(score.summary.rating);
  });

  it('keeps moon impact modest compared with weather impact', () => {
    const stable = makeForecast();

    const scoreA = buildForecastScore({
      forecast: stable,
      location,
      settings: { species: 'catfish' },
      now: new Date('2024-01-11T10:00:00.000Z'),
    });

    const scoreB = buildForecastScore({
      forecast: stable,
      location,
      settings: { species: 'catfish' },
      now: new Date('2024-01-25T10:00:00.000Z'),
    });

    expect(Math.abs(scoreA.summary.totalScore - scoreB.summary.totalScore)).toBeLessThanOrEqual(8);
  });

  it('applies species behavior boost for feeding windows and spawn timing', () => {
    const catfishNight = makeForecast(undefined, Math.floor(new Date('2024-06-20T08:00:00.000Z').getTime() / 1000));
    const catfishMidday = makeForecast(undefined, Math.floor(new Date('2024-06-20T19:00:00.000Z').getTime() / 1000));

    const catfishNightScore = buildForecastScore({
      forecast: catfishNight,
      location,
      settings: { species: 'catfish' },
      now: new Date('2024-06-20T08:00:00.000Z'),
    });

    const catfishMiddayScore = buildForecastScore({
      forecast: catfishMidday,
      location,
      settings: { species: 'catfish' },
      now: new Date('2024-06-20T19:00:00.000Z'),
    });

    const catfishNightBehavior = catfishNightScore.hourly[0].contributions.speciesBehavior;
    const catfishMiddayBehavior = catfishMiddayScore.hourly[0].contributions.speciesBehavior;
    expect(catfishNightBehavior).toBeGreaterThan(catfishMiddayBehavior + 2);

    const bassSpawnSeason = makeForecast(undefined, Math.floor(new Date('2024-05-20T12:00:00.000Z').getTime() / 1000));
    const bassOffSeason = makeForecast(undefined, Math.floor(new Date('2024-01-20T12:00:00.000Z').getTime() / 1000));

    const bassSpawnScore = buildForecastScore({
      forecast: bassSpawnSeason,
      location,
      settings: { species: 'bass' },
      now: new Date('2024-05-20T12:00:00.000Z'),
    });

    const bassOffScore = buildForecastScore({
      forecast: bassOffSeason,
      location,
      settings: { species: 'bass' },
      now: new Date('2024-01-20T12:00:00.000Z'),
    });

    const bassSpawnBehavior = bassSpawnScore.hourly[0].contributions.speciesBehavior;
    const bassOffBehavior = bassOffScore.hourly[0].contributions.speciesBehavior;
    expect(bassSpawnBehavior).toBeGreaterThan(bassOffBehavior + 1);
    expect(bassSpawnScore.factorBreakdown.some((factor) => factor.factor === 'speciesBehavior')).toBe(true);
  });
});
