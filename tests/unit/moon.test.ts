import { computeMoonInfo } from '@/lib/moon';

describe('computeMoonInfo', () => {
  it('returns new moon near known reference', () => {
    const moon = computeMoonInfo(new Date('2000-01-06T18:14:00.000Z'));

    expect(moon.name).toBe('New Moon');
    expect(moon.illumination).toBeLessThan(2);
  });

  it('returns full moon near half synodic month later', () => {
    const moon = computeMoonInfo(new Date('2000-01-21T10:14:00.000Z'));

    expect(['Waxing Gibbous', 'Full Moon', 'Waning Gibbous']).toContain(moon.name);
    expect(moon.illumination).toBeGreaterThan(92);
  });
});
