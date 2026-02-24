import { formatHour, formatTemperature, formatWind } from '@/lib/format';
import type { ForecastResult } from '@/types/forecast';

export function WeatherStrip({ result }: { result: ForecastResult }): JSX.Element {
  const nowEpoch = Math.floor(Date.now() / 1000);
  const firstFutureIndex = result.hourly.findIndex((hour) => hour.epoch >= nowEpoch);
  const windowStart = firstFutureIndex >= 0 ? firstFutureIndex : Math.max(result.hourly.length - 8, 0);
  const nextHours = result.hourly.slice(windowStart, windowStart + 8);

  return (
    <section className="card">
      <h2 className="section-title">Next Hours (local to selected location)</h2>
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
