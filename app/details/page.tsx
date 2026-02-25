'use client';

import { useEffect, useRef } from 'react';

import { FactorBreakdown } from '@/components/factor-breakdown';
import { HourlyChart } from '@/components/hourly-chart';
import { useForecast } from '@/components/providers/forecast-provider';

export default function DetailsPage(): JSX.Element {
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
          <h2 className="section-title">Loading forecast details</h2>
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
        <a href="/" className="link-pill">
          Back to Home
        </a>
      </section>
    );
  }

  return (
    <div className="page-stack">
      <HourlyChart result={result} />
      <FactorBreakdown result={result} />
    </div>
  );
}
