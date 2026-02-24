import { formatHourRange } from '@/lib/format';
import { computeMoonInfo } from '@/lib/moon';
import type { SolunarSummary, SolunarWindow, SolunarWindowType } from '@/types/forecast';

const RAD = Math.PI / 180;
const DAY_MS = 86400000;
const HOUR_MS = 3600000;
const LUNAR_HALF_DAY_HOURS = 12.4206;

interface MoonCoords {
  ra: number;
  dec: number;
}

interface MoonTimes {
  rise?: Date;
  set?: Date;
}

function toJulian(date: Date): number {
  return date.getTime() / DAY_MS - 0.5 + 2440588;
}

function toDays(date: Date): number {
  return toJulian(date) - 2451545;
}

function rightAscension(l: number, b: number): number {
  const e = RAD * 23.4397;
  return Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
}

function declination(l: number, b: number): number {
  const e = RAD * 23.4397;
  return Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
}

function siderealTime(d: number, lw: number): number {
  return RAD * (280.16 + 360.9856235 * d) - lw;
}

function altitude(h: number, phi: number, dec: number): number {
  return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(h));
}

function astroRefraction(h: number): number {
  if (h < 0) {
    return 0;
  }

  return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179));
}

function moonCoords(d: number): MoonCoords {
  const l = RAD * (218.316 + 13.176396 * d);
  const m = RAD * (134.963 + 13.064993 * d);
  const f = RAD * (93.272 + 13.22935 * d);

  const lon = l + RAD * 6.289 * Math.sin(m);
  const lat = RAD * 5.128 * Math.sin(f);

  return {
    ra: rightAscension(lon, lat),
    dec: declination(lon, lat),
  };
}

function getMoonAltitude(date: Date, latitude: number, longitude: number): number {
  const lw = RAD * -longitude;
  const phi = RAD * latitude;
  const d = toDays(date);

  const c = moonCoords(d);
  const h = siderealTime(d, lw) - c.ra;
  const altitudeValue = altitude(h, phi, c.dec);

  return altitudeValue + astroRefraction(altitudeValue);
}

function hoursLater(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * HOUR_MS);
}

function getMoonTimes(date: Date, latitude: number, longitude: number): MoonTimes {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const hc = 0.133 * RAD;

  let h0 = getMoonAltitude(start, latitude, longitude) - hc;
  let riseHour: number | undefined;
  let setHour: number | undefined;

  for (let i = 1; i <= 24; i += 2) {
    const h1 = getMoonAltitude(hoursLater(start, i), latitude, longitude) - hc;
    const h2 = getMoonAltitude(hoursLater(start, i + 1), latitude, longitude) - hc;

    const a = (h0 + h2) / 2 - h1;
    const b = (h2 - h0) / 2;
    const c = h1;

    if (Math.abs(a) > 1e-12) {
      const xe = -b / (2 * a);
      const ye = (a * xe + b) * xe + c;
      const discriminant = b * b - 4 * a * c;

      if (discriminant >= 0) {
        const dx = Math.sqrt(discriminant) / (Math.abs(a) * 2);
        let x1 = xe - dx;
        let x2 = xe + dx;
        let roots = 0;

        if (Math.abs(x1) <= 1) roots += 1;
        if (Math.abs(x2) <= 1) roots += 1;

        if (x1 < -1) {
          x1 = x2;
        }

        if (roots === 1) {
          if (h0 < 0) riseHour = i + x1;
          else setHour = i + x1;
        } else if (roots === 2) {
          riseHour = i + (ye < 0 ? x2 : x1);
          setHour = i + (ye < 0 ? x1 : x2);
        }
      }
    } else if (Math.abs(b) > 1e-12) {
      const root = -c / b;
      if (Math.abs(root) <= 1) {
        if (h0 < 0) riseHour = i + root;
        else setHour = i + root;
      }
    }

    if (riseHour !== undefined && setHour !== undefined) {
      break;
    }

    h0 = h2;
  }

  return {
    rise: riseHour !== undefined ? hoursLater(start, riseHour) : undefined,
    set: setHour !== undefined ? hoursLater(start, setHour) : undefined,
  };
}

function overlaps(startMs: number, endMs: number, rangeStart: number, rangeEnd: number): boolean {
  return startMs <= rangeEnd && endMs >= rangeStart;
}

function toWindow(
  type: SolunarWindowType,
  peakMs: number,
  halfDurationMs: number,
  rangeStart: number,
  rangeEnd: number,
  timezone: string,
): SolunarWindow | null {
  const startMs = peakMs - halfDurationMs;
  const endMs = peakMs + halfDurationMs;

  if (!overlaps(startMs, endMs, rangeStart, rangeEnd)) {
    return null;
  }

  return {
    type,
    startEpoch: Math.round(startMs / 1000),
    endEpoch: Math.round(endMs / 1000),
    peakEpoch: Math.round(peakMs / 1000),
    label: formatHourRange(Math.round(startMs / 1000), Math.round(endMs / 1000), timezone),
  };
}

function uniqueByPeak(points: number[]): number[] {
  const sorted = [...points].sort((a, b) => a - b);
  const unique: number[] = [];

  for (const point of sorted) {
    const isDuplicate = unique.some((existing) => Math.abs(existing - point) < 30 * 60 * 1000);
    if (!isDuplicate) {
      unique.push(point);
    }
  }

  return unique;
}

interface SolunarInput {
  latitude: number;
  longitude: number;
  timezone: string;
  now: Date;
}

export function buildSolunarSummary({ latitude, longitude, timezone, now }: SolunarInput): SolunarSummary {
  const rangeStart = now.getTime();
  const rangeEnd = rangeStart + DAY_MS;

  const dayAnchor = new Date(rangeStart);
  dayAnchor.setUTCHours(0, 0, 0, 0);

  const majorCenters: number[] = [];
  const minorCenters: number[] = [];

  for (let offset = -1; offset <= 2; offset += 1) {
    const date = new Date(dayAnchor.getTime() + offset * DAY_MS);
    const times = getMoonTimes(date, latitude, longitude);

    if (times.rise) {
      minorCenters.push(times.rise.getTime());
    }

    if (times.set) {
      minorCenters.push(times.set.getTime());
    }

    if (times.rise && times.set) {
      let riseMs = times.rise.getTime();
      let setMs = times.set.getTime();

      if (setMs < riseMs) {
        setMs += DAY_MS;
      }

      const overhead = (riseMs + setMs) / 2;
      const underfoot = overhead + LUNAR_HALF_DAY_HOURS * HOUR_MS;

      majorCenters.push(overhead, underfoot);
    }
  }

  if (majorCenters.length === 0) {
    const phase = computeMoonInfo(now).phase;
    const phaseAnchor = dayAnchor.getTime() + phase * LUNAR_HALF_DAY_HOURS * HOUR_MS * 2;
    majorCenters.push(phaseAnchor, phaseAnchor + LUNAR_HALF_DAY_HOURS * HOUR_MS);
  }

  const expandedMajor = majorCenters.flatMap((center) => [
    center - LUNAR_HALF_DAY_HOURS * HOUR_MS,
    center,
    center + LUNAR_HALF_DAY_HOURS * HOUR_MS,
  ]);

  const uniqueMajor = uniqueByPeak(expandedMajor);
  const uniqueMinor = uniqueByPeak(minorCenters);

  if (uniqueMinor.length === 0 && uniqueMajor.length > 0) {
    uniqueMinor.push(
      uniqueMajor[0] - LUNAR_HALF_DAY_HOURS * HOUR_MS * 0.5,
      uniqueMajor[0] + LUNAR_HALF_DAY_HOURS * HOUR_MS * 0.5,
    );
  }

  const majorWindows = uniqueMajor
    .map((center) => toWindow('major', center, 90 * 60 * 1000, rangeStart, rangeEnd, timezone))
    .filter((window): window is SolunarWindow => window !== null)
    .sort((a, b) => a.peakEpoch - b.peakEpoch)
    .slice(0, 3);

  const minorWindows = uniqueMinor
    .map((center) => toWindow('minor', center, 45 * 60 * 1000, rangeStart, rangeEnd, timezone))
    .filter((window): window is SolunarWindow => window !== null)
    .sort((a, b) => a.peakEpoch - b.peakEpoch)
    .slice(0, 4);

  return {
    windows: [...majorWindows, ...minorWindows].sort((a, b) => a.peakEpoch - b.peakEpoch),
    note: 'Solunar windows are estimated from modeled moonrise, moonset, overhead, and underfoot periods.',
  };
}
