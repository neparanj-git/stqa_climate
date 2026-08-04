export const REGIONS = ['North India', 'Northwest India', 'Central India', 'East India', 'Northeast India', 'South Peninsula', 'West Coast'] as const;
export type Region = typeof REGIONS[number];
export type Season = 'Winter' | 'Pre-Monsoon/Summer' | 'Monsoon' | 'Post-Monsoon';
export type HeatwaveSeverity = 'Normal' | 'Heat Alert' | 'Heatwave' | 'Severe Heatwave';
export interface Observation { timestamp: string; region: Region; season: Season; latitude: number; longitude: number; maxTemperature: number; station: string; severity: HeatwaveSeverity }
export interface StationReading { station: string; location: string; region: Region; latitude: number; longitude: number; latestReading: number; regionalForecast: number; validation: 'consistent' | 'watch' | 'divergent'; timestamp: string }

