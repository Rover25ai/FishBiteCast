'use client';

import { useEffect, useMemo, useState } from 'react';

import { useForecast } from '@/components/providers/forecast-provider';
import type { GeocodeResult } from '@/types/geocode';

function optionLabel(option: GeocodeResult): string {
  return [option.name, option.admin1, option.country].filter(Boolean).join(', ');
}

export function LocationControls(): JSX.Element {
  const { location, loading, error, useMyLocation, searchCity, selectManualLocation } = useForecast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      setSearching(true);
      void searchCity(trimmed)
        .then(setResults)
        .finally(() => setSearching(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, searchCity]);

  const hasResults = results.length > 0;

  const helperText = useMemo(() => {
    if (location) {
      return `Current: ${location.label}`;
    }

    return 'Pick a location to calculate your Bite Score.';
  }, [location]);

  return (
    <section className="card">
      <h2 className="section-title">Location</h2>
      <p className="helper-text">{helperText}</p>
      <p className="privacy-note">Location is used only to fetch forecast data for scoring. Nothing is sent beyond forecast APIs.</p>

      <div className="location-row">
        <button type="button" className="button-primary" onClick={() => void useMyLocation()} disabled={loading}>
          Use my location
        </button>
      </div>

      <label htmlFor="manual-location" className="input-label">
        Search city, state, or country
      </label>
      <input
        id="manual-location"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="text-input"
        placeholder="e.g., Denver, CO"
        autoComplete="off"
      />

      {searching ? <p className="helper-text">Searching…</p> : null}
      {error ? <p className="location-error" role="status">{error}</p> : null}

      {hasResults ? (
        <ul className="result-list" role="listbox" aria-label="Location results">
          {results.map((result) => {
            const label = optionLabel(result);
            return (
              <li key={result.id}>
                <button
                  type="button"
                  className="result-item"
                  onClick={() => {
                    selectManualLocation(result);
                    setQuery(label);
                    setResults([]);
                  }}
                >
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
