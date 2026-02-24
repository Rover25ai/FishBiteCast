import type { ForecastResult } from '@/types/forecast';

const ratingTone: Record<ForecastResult['summary']['rating'], string> = {
  Poor: 'tone-poor',
  Fair: 'tone-fair',
  Good: 'tone-good',
  Great: 'tone-great',
  Epic: 'tone-epic',
};

export function ScoreCard({ result }: { result: ForecastResult }): JSX.Element {
  const toneClass = ratingTone[result.summary.rating];

  return (
    <section className={`card score-card ${toneClass}`}>
      <h2 className="section-title">Bite Score</h2>
      <div className="score-value">{result.summary.totalScore}</div>
      <p className="score-rating">{result.summary.rating}</p>
      <p className="helper-text">Preset: {result.species}</p>
    </section>
  );
}
