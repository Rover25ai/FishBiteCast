import type { ForecastResult } from '@/types/forecast';

export function MoonWidget({ result }: { result: ForecastResult }): JSX.Element {
  const illumination = Math.round(result.moon.illumination);

  return (
    <section className="card">
      <h2 className="section-title">Moon</h2>
      <p className="list-title">{result.moon.name}</p>
      <p className="helper-text">Illumination {illumination}%</p>
      <div className="progress-track" aria-label="Moon illumination">
        <div className="progress-fill" style={{ width: `${illumination}%` }} />
      </div>
    </section>
  );
}
