'use client';

import { useSettings } from '@/components/providers/settings-provider';

const speciesOptions = [
  { id: 'bass', label: 'Bass' },
  { id: 'whiteBass', label: 'White Bass' },
  { id: 'striper', label: 'Striper' },
  { id: 'crappie', label: 'Crappie' },
  { id: 'trout', label: 'Trout' },
  { id: 'catfish', label: 'Catfish' },
  { id: 'walleye', label: 'Walleye' },
  { id: 'bream', label: 'Bream' },
] as const;

export function SettingsForm(): JSX.Element {
  const { settings, setUnits, setSpecies } = useSettings();

  return (
    <section className="settings-grid">
      <article className="card">
        <h2 className="section-title">Units</h2>
        <fieldset className="field-group">
          <legend className="helper-text">Choose display units</legend>

          <label className="field-option">
            <input
              type="radio"
              name="units"
              value="imperial"
              checked={settings.units === 'imperial'}
              onChange={() => setUnits('imperial')}
            />
            <span>Imperial (°F, mph, inHg)</span>
          </label>

          <label className="field-option">
            <input
              type="radio"
              name="units"
              value="metric"
              checked={settings.units === 'metric'}
              onChange={() => setUnits('metric')}
            />
            <span>Metric (°C, km/h, hPa)</span>
          </label>
        </fieldset>
      </article>

      <article className="card">
        <h2 className="section-title">Species Preset</h2>
        <fieldset className="field-group">
          <legend className="helper-text">Preset adjusts scoring weights.</legend>

          {speciesOptions.map((option) => (
            <label key={option.id} className="field-option">
              <input
                type="radio"
                name="species"
                value={option.id}
                checked={settings.species === option.id}
                onChange={() => setSpecies(option.id)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>
      </article>
    </section>
  );
}
