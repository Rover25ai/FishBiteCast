export type UnitSystem = 'imperial';

export type SpeciesPreset = 'bass' | 'whiteBass' | 'striper' | 'crappie' | 'trout' | 'catfish' | 'walleye' | 'bream';

export interface UserSettings {
  species: SpeciesPreset;
}
