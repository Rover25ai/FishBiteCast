'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { FactorBreakdown } from '@/components/factor-breakdown';
import { HourlyChart } from '@/components/hourly-chart';
import { useForecast } from '@/components/providers/forecast-provider';
import { WeatherStrip } from '@/components/weather-strip';

export default function DetailsPage(): JSX.Element {
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

  if (!result) {
    if (loading) {
      return (
        <section className="card">
          <h2 className="section-title">Loading 48 hour forecast</h2>
          <p className="helper-text">Fetching latest data for this location…</p>
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
      <HourlyChart result={result} />
      <FactorBreakdown result={result} />
      <WeatherStrip result={result} />
    </div>
  );
}
