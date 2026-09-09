export const REGIONS = ['North India', 'Northwest India', 'Central India', 'East India', 'Northeast India', 'South Peninsula', 'West Coast'] as const;
export type Region = typeof REGIONS[number];
export type Season = 'Winter' | 'Pre-Monsoon/Summer' | 'Monsoon' | 'Post-Monsoon';
export type HeatwaveSeverity = 'Normal' | 'Heat Alert' | 'Heatwave' | 'Severe Heatwave';
export type DataQuality = 'good' | 'delayed' | 'suspect';
export interface Observation { timestamp: string; region: Region; season: Season; latitude: number; longitude: number; maxTemperature: number; humidity?: number; windSpeed?: number; station: string; source?: 'IMD' | 'AWS' | 'provider'; severity: HeatwaveSeverity }
export interface StationReading { station: string; location: string; region: Region; latitude: number; longitude: number; latestReading: number; humidity: number; windSpeed: number; regionalForecast: number; validation: 'consistent' | 'watch' | 'divergent'; quality: DataQuality; timestamp: string }
export interface ForecastPoint { date: string; maxTemperature: number; lowerBound: number; upperBound: number; heatwaveProbability: number; severity: HeatwaveSeverity; model: string }
export interface ClimateAlert { id: string; region: Region; severity: HeatwaveSeverity; title: string; message: string; createdAt: string; status: 'active' | 'acknowledged'; acknowledgedAt?: string }
export interface IngestReading { station: string; location: string; region: Region; latitude: number; longitude: number; maxTemperature: number; humidity: number; windSpeed: number; timestamp: string }
