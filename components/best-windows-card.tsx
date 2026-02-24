import { formatDateTime } from '@/lib/format';
import type { ForecastResult } from '@/types/forecast';

export function BestWindowsCard({ result }: { result: ForecastResult }): JSX.Element {
  return (
    <section className="card">
      <h2 className="section-title">Best Windows (next 24h)</h2>
      {result.summary.bestWindows.length === 0 ? <p className="helper-text">No high-confidence windows yet.</p> : null}

      <ul className="list">
        {result.summary.bestWindows.map((window) => (
          <li key={`${window.startEpoch}-${window.peakEpoch}`} className="list-item">
            <p className="list-title">{window.label}</p>
            <p className="helper-text">
              Avg {window.avgScore} | Peak {window.peakScore} near {formatDateTime(window.peakEpoch, result.timezone, { hour: 'numeric', minute: '2-digit' })}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
