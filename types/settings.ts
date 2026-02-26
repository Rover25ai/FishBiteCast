export type UnitSystem = 'metric' | 'imperial';

export type SpeciesPreset = 'bass' | 'whiteBass' | 'striper' | 'crappie' | 'trout' | 'catfish' | 'walleye' | 'bream';

export interface UserSettings {
  units: UnitSystem;
  species: SpeciesPreset;
}
