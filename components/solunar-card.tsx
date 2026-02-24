import { formatDateTime } from '@/lib/format';
import type { ForecastResult } from '@/types/forecast';

export function SolunarCard({ result }: { result: ForecastResult }): JSX.Element {
  const major = result.solunar.windows.filter((window) => window.type === 'major');
  const minor = result.solunar.windows.filter((window) => window.type === 'minor');

  return (
    <section className="card">
      <h2 className="section-title">Solunar Windows</h2>

      <div className="solunar-group">
        <p className="solunar-heading">Major</p>
        {major.length === 0 ? <p className="helper-text">No major period in the next 24h.</p> : null}
        <ul className="list">
          {major.map((window) => (
            <li className="list-item" key={`major-${window.peakEpoch}`}>
              <p className="list-title">{window.label}</p>
              <p className="helper-text">Peak near {formatDateTime(window.peakEpoch, result.timezone, { hour: 'numeric', minute: '2-digit' })}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="solunar-group">
        <p className="solunar-heading">Minor</p>
        {minor.length === 0 ? <p className="helper-text">No minor period in the next 24h.</p> : null}
        <ul className="list">
          {minor.map((window) => (
            <li className="list-item" key={`minor-${window.peakEpoch}`}>
              <p className="list-title">{window.label}</p>
              <p className="helper-text">Peak near {formatDateTime(window.peakEpoch, result.timezone, { hour: 'numeric', minute: '2-digit' })}</p>
            </li>
          ))}
        </ul>
      </div>

      <p className="helper-text">{result.solunar.note}</p>
    </section>
  );
}
