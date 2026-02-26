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
  const { settings, setSpecies } = useSettings();

  return (
    <section className="card">
      <h2 className="section-title">Species Preset</h2>
      <p className="helper-text">Forecast scores use imperial units site-wide.</p>
      <fieldset className="field-group">
        <legend className="helper-text">Preset adjusts scoring weights.</legend>
        <div className="species-grid">
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
        </div>
      </fieldset>
    </section>
  );
}
