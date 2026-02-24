import type { ForecastResult } from '@/types/forecast';

export function WhyCard({ result }: { result: ForecastResult }): JSX.Element {
  return (
    <section className="card">
      <h2 className="section-title">Why</h2>
      <ul className="list why-list">
        {result.summary.why.map((item) => (
          <li key={item} className="list-item">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
