import type { ForecastResult } from '@/types/forecast';

export function FactorBreakdown({ result }: { result: ForecastResult }): JSX.Element {
  return (
    <section className="card">
      <h2 className="section-title">Factor Breakdown</h2>
      <div className="table-wrap">
        <table className="factor-table">
          <thead>
            <tr>
              <th>Factor</th>
              <th>Weight</th>
              <th>Contribution</th>
              <th>Interpretation</th>
            </tr>
          </thead>
          <tbody>
            {result.factorBreakdown.map((factor) => (
              <tr key={factor.factor}>
                <td data-label="Factor">{factor.label}</td>
                <td data-label="Weight">{(factor.weight * 100).toFixed(0)}%</td>
                <td data-label="Contribution" className={factor.points >= 0 ? 'positive' : 'negative'}>
                  {factor.points >= 0 ? '+' : ''}
                  {factor.points.toFixed(1)}
                </td>
                <td data-label="Interpretation">{factor.insight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
