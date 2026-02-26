import type { UnitSystem } from '@/types/settings';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function formatDateTime(epochSeconds: number, timeZone: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...opts,
  }).format(new Date(epochSeconds * 1000));
}

export function formatHour(epochSeconds: number, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
  }).format(new Date(epochSeconds * 1000));
}

export function formatHourRange(startEpoch: number, endEpoch: number, timeZone: string): string {
  const start = formatHour(startEpoch, timeZone);
  const end = formatHour(endEpoch, timeZone);
  return `${start} - ${end}`;
}

export function epochHourInTimezone(epochSeconds: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date(epochSeconds * 1000));

  const hourPart = parts.find((part) => part.type === 'hour')?.value ?? '0';
  return Number.parseInt(hourPart, 10);
}

export function epochMonthInTimezone(epochSeconds: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'numeric',
  }).formatToParts(new Date(epochSeconds * 1000));

  const monthPart = parts.find((part) => part.type === 'month')?.value ?? '1';
  return Number.parseInt(monthPart, 10);
}

export function formatTemperature(tempC: number, units: UnitSystem): string {
  if (units === 'imperial') {
    return `${Math.round((tempC * 9) / 5 + 32)}°F`;
  }

  return `${Math.round(tempC)}°C`;
}

export function formatWind(speedKmh: number, units: UnitSystem): string {
  if (units === 'imperial') {
    return `${Math.round(speedKmh * 0.621371)} mph`;
  }

  return `${Math.round(speedKmh)} km/h`;
}

export function formatPressure(pressureHpa: number, units: UnitSystem): string {
  if (units === 'imperial') {
    return `${(pressureHpa * 0.02953).toFixed(2)} inHg`;
  }

  return `${Math.round(pressureHpa)} hPa`;
}
