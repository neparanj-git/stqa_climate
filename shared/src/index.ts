export const REGIONS = ['North India', 'Northwest India', 'Central India', 'East India', 'Northeast India', 'South Peninsula', 'West Coast'] as const;
export const SEASONS = ['Winter', 'Pre-Monsoon/Summer', 'Monsoon', 'Post-Monsoon'] as const;
export const SEVERITIES = ['Normal', 'Heat Alert', 'Heatwave', 'Severe Heatwave'] as const;
export type Region = typeof REGIONS[number];
export type Season = typeof SEASONS[number];
export type HeatwaveSeverity = typeof SEVERITIES[number];
export type Stakeholder = 'citizens' | 'farmers' | 'health agencies' | 'local authorities';
export interface Observation { timestamp: string; region: Region; season: Season; latitude: number; longitude: number; maxTemperature: number; station: string; severity: HeatwaveSeverity }
export interface RegionSummary { region: Region; latestTemp: number; severity: HeatwaveSeverity; normal: number; latitude: number; longitude: number }
export interface ForecastDay { date: string; maxTemperature: number; severity: HeatwaveSeverity }
export interface StationReading { station: string; location: string; region: Region; latitude: number; longitude: number; latestReading: number; regionalForecast: number; validation: 'consistent' | 'watch' | 'divergent'; timestamp: string }

