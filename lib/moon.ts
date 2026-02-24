import type { MoonInfo, MoonPhaseName } from '@/types/moon';

const SYNODIC_MONTH = 29.53058867;
const KNOWN_NEW_MOON_UTC_MS = Date.UTC(2000, 0, 6, 18, 14, 0);

function getPhaseName(phase: number): MoonPhaseName {
  if (phase < 0.03 || phase >= 0.97) return 'New Moon';
  if (phase < 0.22) return 'Waxing Crescent';
  if (phase < 0.28) return 'First Quarter';
  if (phase < 0.47) return 'Waxing Gibbous';
  if (phase < 0.53) return 'Full Moon';
  if (phase < 0.72) return 'Waning Gibbous';
  if (phase < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

export function computeMoonInfo(input: Date | number): MoonInfo {
  const date = input instanceof Date ? input : new Date(input);
  const daysSinceReference = (date.getTime() - KNOWN_NEW_MOON_UTC_MS) / 86400000;
  const lunations = daysSinceReference / SYNODIC_MONTH;
  const phase = ((lunations % 1) + 1) % 1;
  const ageDays = phase * SYNODIC_MONTH;
  const illumination = ((1 - Math.cos(2 * Math.PI * phase)) / 2) * 100;

  return {
    phase,
    ageDays,
    illumination,
    name: getPhaseName(phase),
  };
}
