'use client';

import Link from 'next/link';

import { FactorBreakdown } from '@/components/factor-breakdown';
import { HourlyChart } from '@/components/hourly-chart';
import { useForecast } from '@/components/providers/forecast-provider';

export default function DetailsPage(): JSX.Element {
  const { result, loading, location } = useForecast();

  if (!result) {
    if (loading || location) {
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
        <p className="helper-text">Generate a forecast from Home first.</p>
        <Link href="/" className="link-pill">
          Back to Home
        </Link>
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
