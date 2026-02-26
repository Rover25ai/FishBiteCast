import { formatHour, formatTemperature, formatWind } from '@/lib/format';
import type { ForecastResult } from '@/types/forecast';

interface WeatherStripProps {
  result: ForecastResult;
  title?: string;
  horizonHours?: number;
  stepHours?: number;
}

export function WeatherStrip({
  result,
  title = 'Next Hours (local to selected location)',
  horizonHours = 8,
  stepHours = 1,
}: WeatherStripProps): JSX.Element {
  const nowEpoch = Math.floor(Date.now() / 1000);
  const firstFutureIndex = result.hourly.findIndex((hour) => hour.epoch >= nowEpoch);
  const windowStart = firstFutureIndex >= 0 ? firstFutureIndex : Math.max(result.hourly.length - horizonHours, 0);
  const windowEnd = Math.min(windowStart + horizonHours, result.hourly.length);

  const nextHours = [];
  for (let index = windowStart; index < windowEnd; index += Math.max(stepHours, 1)) {
    const hour = result.hourly[index];
    if (hour) {
      nextHours.push(hour);
    }
  }

  return (
    <section className="card">
      <h2 className="section-title">{title}</h2>
      <div className="weather-strip" role="list" aria-label="Hourly weather strip">
        {nextHours.map((hour) => (
          <article className="weather-chip" key={hour.epoch} role="listitem">
            <p className="weather-time">{formatHour(hour.epoch, result.timezone)}</p>
            <p className="weather-main">{formatTemperature(hour.inputs.temperatureC, result.units)}</p>
            <p className="weather-sub">Wind {formatWind(hour.inputs.windSpeedKmh, result.units)}</p>
            <p className="weather-sub">Rain {Math.round(hour.inputs.precipitationProbability)}%</p>
            <p className="weather-score">Score {Math.round(hour.score)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
