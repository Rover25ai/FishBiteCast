'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { formatHour } from '@/lib/format';
import { useForecast } from '@/components/providers/forecast-provider';

interface DailyForecastRow {
  dayKey: string;
  dayLabel: string;
  avgScore: number;
  peakScore: number;
  bestHourLabel: string;
  lowTempF: number;
  highTempF: number;
  avgRain: number;
  avgWindMph: number;
}

interface DailyBucket {
  dayKey: string;
  dayLabel: string;
  scoreSum: number;
  rainSum: number;
  windSumMph: number;
  hourCount: number;
  peakScore: number;
  bestHourEpoch: number;
  lowTempF: number;
  highTempF: number;
}

function dayKey(epochSeconds: number, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(epochSeconds * 1000));
}

function dayLabel(epochSeconds: number, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(epochSeconds * 1000));
}

function toRating(score: number): string {
  if (score < 30) return 'Poor';
  if (score < 50) return 'Fair';
  if (score < 70) return 'Good';
  if (score < 85) return 'Great';
  return 'Epic';
}

function toneClass(score: number): string {
  if (score < 30) return 'tone-poor';
  if (score < 50) return 'tone-fair';
  if (score < 70) return 'tone-good';
  if (score < 85) return 'tone-great';
  return 'tone-epic';
}

export default function WeeklyPage(): JSX.Element {
  const router = useRouter();
  const { result, loading, location, error, refresh } = useForecast();
  const attemptedRefreshRef = useRef<string | null>(null);

  useEffect(() => {
    if (!location || result || loading) {
      return;
    }

    const key = `${location.latitude.toFixed(4)}:${location.longitude.toFixed(4)}`;
    if (attemptedRefreshRef.current === key) {
      return;
    }

    attemptedRefreshRef.current = key;
    refresh();
  }, [loading, location, refresh, result]);

  const daily = useMemo<DailyForecastRow[]>(() => {
    if (!result) {
      return [];
    }

    const grouped = new Map<string, DailyBucket>();

    for (const hour of result.hourly.slice(0, 24 * 7)) {
      const key = dayKey(hour.epoch, result.timezone);
      const existing = grouped.get(key);
      const tempF = (hour.inputs.temperatureC * 9) / 5 + 32;
      const windMph = hour.inputs.windSpeedKmh * 0.621371;

      if (!existing) {
        grouped.set(key, {
          dayKey: key,
          dayLabel: dayLabel(hour.epoch, result.timezone),
          scoreSum: hour.score,
          peakScore: hour.score,
          bestHourEpoch: hour.epoch,
          lowTempF: tempF,
          highTempF: tempF,
          rainSum: hour.inputs.precipitationProbability,
          windSumMph: windMph,
          hourCount: 1,
        });
        continue;
      }

      existing.scoreSum += hour.score;
      existing.rainSum += hour.inputs.precipitationProbability;
      existing.windSumMph += windMph;
      existing.hourCount += 1;

      if (hour.score > existing.peakScore) {
        existing.peakScore = hour.score;
        existing.bestHourEpoch = hour.epoch;
      }

      existing.lowTempF = Math.min(existing.lowTempF, tempF);
      existing.highTempF = Math.max(existing.highTempF, tempF);
    }

    return Array.from(grouped.values())
      .slice(0, 7)
      .map((row) => ({
        dayKey: row.dayKey,
        dayLabel: row.dayLabel,
        avgScore: Math.round(row.scoreSum / row.hourCount),
        peakScore: Math.round(row.peakScore),
        bestHourLabel: formatHour(row.bestHourEpoch, result.timezone),
        lowTempF: Math.round(row.lowTempF),
        highTempF: Math.round(row.highTempF),
        avgRain: Math.round(row.rainSum / row.hourCount),
        avgWindMph: Math.round(row.windSumMph / row.hourCount),
      }));
  }, [result]);

  if (!result) {
    if (loading) {
      return (
        <section className="card">
          <h2 className="section-title">Loading weekly forecast</h2>
          <p className="helper-text">Building next 7 days for this location…</p>
        </section>
      );
    }

    return (
      <section className="card">
        <h2 className="section-title">No forecast loaded</h2>
        <p className="helper-text">
          {error ? `Latest fetch issue: ${error}` : location ? 'Unable to load forecast for this location yet.' : 'Generate a forecast from Home first.'}
        </p>
        {location ? (
          <button type="button" className="button-primary" onClick={refresh}>
            Retry forecast
          </button>
        ) : null}
        <a
          href="/"
          className="link-pill"
          onClick={(event) => {
            if (
              event.defaultPrevented ||
              event.button !== 0 ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            ) {
              return;
            }

            event.preventDefault();
            router.push('/');
          }}
        >
          Back to Home
        </a>
      </section>
    );
  }

  return (
    <div className="page-stack">
      <section className="card">
        <h2 className="section-title">Next 7 Days Forecast</h2>
        <p className="helper-text">Daily bite outlook with best hour, average weather, and score trend.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {daily.map((row) => (
          <article key={row.dayKey} className={`card ${toneClass(row.avgScore)}`}>
            <h3 className="list-title">{row.dayLabel}</h3>
            <p className="helper-text">
              Bite Score: <strong>{row.avgScore}</strong> ({toRating(row.avgScore)})
            </p>
            <p className="helper-text">Peak Hour: {row.bestHourLabel} ({row.peakScore})</p>
            <p className="helper-text">Temp: {row.lowTempF}°F - {row.highTempF}°F</p>
            <p className="helper-text">Rain Chance (avg): {row.avgRain}%</p>
            <p className="helper-text">Wind (avg): {row.avgWindMph} mph</p>
          </article>
        ))}
      </section>
    </div>
  );
}
