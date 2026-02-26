import { formatDateTime, formatHour, formatTemperature, formatWind } from '@/lib/format';
import type { ForecastResult } from '@/types/forecast';

interface WeatherStripProps {
  result: ForecastResult;
  title?: string;
  horizonHours?: number;
  stepHours?: number;
  showDayDate?: boolean;
  showHourInDayDate?: boolean;
  showHighLowRange?: boolean;
}

export function WeatherStrip({
  result,
  title = 'Next Hours (local to selected location)',
  horizonHours = 8,
  stepHours = 1,
  showDayDate = false,
  showHourInDayDate = true,
  showHighLowRange = false,
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

  const dailyRanges = new Map<string, { lowC: number; highC: number }>();
  for (const hour of result.hourly) {
    const day = new Intl.DateTimeFormat('en-CA', {
      timeZone: result.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(hour.epoch * 1000));

    const existing = dailyRanges.get(day);
    if (!existing) {
      dailyRanges.set(day, { lowC: hour.inputs.temperatureC, highC: hour.inputs.temperatureC });
      continue;
    }

    existing.lowC = Math.min(existing.lowC, hour.inputs.temperatureC);
    existing.highC = Math.max(existing.highC, hour.inputs.temperatureC);
  }

  return (
    <section className="card">
      <h2 className="section-title">{title}</h2>
      <div className="weather-strip" role="list" aria-label="Hourly weather strip">
        {nextHours.map((hour) => (
          <article className="weather-chip" key={hour.epoch} role="listitem">
            <p className="weather-time">
              {showDayDate
                ? showHourInDayDate
                  ? formatDateTime(hour.epoch, result.timezone, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })
                  : new Intl.DateTimeFormat('en-US', {
                      timeZone: result.timezone,
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    }).format(new Date(hour.epoch * 1000))
                : formatHour(hour.epoch, result.timezone)}
            </p>
            <p className="weather-main">
              {showHighLowRange
                ? (() => {
                    const day = new Intl.DateTimeFormat('en-CA', {
                      timeZone: result.timezone,
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    }).format(new Date(hour.epoch * 1000));
                    const range = dailyRanges.get(day);
                    if (!range) {
                      return formatTemperature(hour.inputs.temperatureC, result.units);
                    }

                    return `H ${formatTemperature(range.highC, result.units)} / L ${formatTemperature(range.lowC, result.units)}`;
                  })()
                : formatTemperature(hour.inputs.temperatureC, result.units)}
            </p>
            <p className="weather-sub">Wind {formatWind(hour.inputs.windSpeedKmh, result.units)}</p>
            <p className="weather-sub">Rain {Math.round(hour.inputs.precipitationProbability)}%</p>
            <p className="weather-score">Score {Math.round(hour.score)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
