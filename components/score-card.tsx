import type { ForecastResult } from '@/types/forecast';

function toneForScore(score: number): string {
  if (score < 30) return 'tone-poor';
  if (score < 50) return 'tone-fair';
  if (score < 70) return 'tone-good';
  if (score < 85) return 'tone-great';
  return 'tone-epic';
}

export function ScoreCard({ result }: { result: ForecastResult }): JSX.Element {
  const toneClass = toneForScore(result.summary.totalScore);

  return (
    <section className={`card score-card ${toneClass}`}>
      <h2 className="section-title">Bite Score</h2>
      <div className="score-value">{result.summary.totalScore}</div>
      <p className="score-rating">{result.summary.rating}</p>
      <p className="helper-text">Preset: {result.species}</p>
    </section>
  );
}
