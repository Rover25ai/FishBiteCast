'use client';

import { BestWindowsCard } from '@/components/best-windows-card';
import { ErrorState } from '@/components/error-state';
import { ForecastSkeleton } from '@/components/forecast-skeleton';
import { HeroBanner } from '@/components/hero-banner';
import { LocationControls } from '@/components/location-controls';
import { MoonWidget } from '@/components/moon-widget';
import { OfflineBanner } from '@/components/offline-banner';
import { useForecast } from '@/components/providers/forecast-provider';
import { ScoreCard } from '@/components/score-card';
import { SolunarCard } from '@/components/solunar-card';
import { WeatherStrip } from '@/components/weather-strip';
import { WhyCard } from '@/components/why-card';

export default function HomePage(): JSX.Element {
  const { result, loading, error, isOffline, refresh } = useForecast();

  return (
    <div className="page-stack">
      <HeroBanner />
      <LocationControls />

      {isOffline && result ? <OfflineBanner lastUpdated={result.summary.lastUpdatedIso} /> : null}

      {loading && !result ? <ForecastSkeleton /> : null}

      {error && !result ? <ErrorState message={error} onRetry={refresh} /> : null}

      {result ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ScoreCard result={result} />
            <BestWindowsCard result={result} />
            <WhyCard result={result} />
            <MoonWidget result={result} />
          </section>

          <SolunarCard result={result} />

          <WeatherStrip result={result} />

          <section className="card action-row">
            <button type="button" className="button-primary" onClick={refresh} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh Forecast'}
            </button>
            <p className="helper-text">Last updated: {new Date(result.summary.lastUpdatedIso).toLocaleString()}</p>
            <a href="/details" className="link-pill">
              View details
            </a>
          </section>

          {error ? <p className="helper-text">Latest fetch issue: {error}</p> : null}
        </>
      ) : null}

      {!loading && !result && !error ? <p className="helper-text">Pick a location to generate your first forecast.</p> : null}
    </div>
  );
}
