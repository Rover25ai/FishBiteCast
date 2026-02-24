'use client';

import { FactorBreakdown } from '@/components/factor-breakdown';
import { HourlyChart } from '@/components/hourly-chart';
import { useForecast } from '@/components/providers/forecast-provider';

export default function DetailsPage(): JSX.Element {
  const { result } = useForecast();

  if (!result) {
    return (
      <section className="card">
        <h2 className="section-title">No forecast loaded</h2>
        <p className="helper-text">Generate a forecast from Home first.</p>
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
