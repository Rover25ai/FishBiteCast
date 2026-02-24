import { buildSolunarSummary } from '@/lib/solunar';

describe('buildSolunarSummary', () => {
  it('returns major and minor windows within the next 24 hours', () => {
    const now = new Date('2026-06-14T12:00:00.000Z');

    const summary = buildSolunarSummary({
      latitude: 39.7392,
      longitude: -104.9903,
      timezone: 'America/Denver',
      now,
    });

    expect(summary.windows.length).toBeGreaterThan(0);
    expect(summary.windows.some((window) => window.type === 'major')).toBe(true);
    expect(summary.windows.some((window) => window.type === 'minor')).toBe(true);

    const nowEpoch = Math.floor(now.getTime() / 1000);
    const horizonEpoch = nowEpoch + 24 * 3600;

    for (const window of summary.windows) {
      expect(window.endEpoch).toBeGreaterThanOrEqual(nowEpoch);
      expect(window.startEpoch).toBeLessThanOrEqual(horizonEpoch);
      expect(window.startEpoch).toBeLessThanOrEqual(window.peakEpoch);
      expect(window.peakEpoch).toBeLessThanOrEqual(window.endEpoch);
    }
  });

  it('includes an explanatory note about modeled periods', () => {
    const summary = buildSolunarSummary({
      latitude: 35.4676,
      longitude: -97.5164,
      timezone: 'America/Chicago',
      now: new Date('2026-09-01T03:00:00.000Z'),
    });

    expect(summary.note).toMatch(/modeled moonrise/i);
  });
});
