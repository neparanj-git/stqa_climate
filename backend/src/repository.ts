import { regionMeta } from './data.ts';
import { classifySeverity } from './severity.ts';
import type { IngestReading, Observation, Region, Season, StationReading } from './domain.ts';

export interface ObservationFilter { region?: Region; season?: Season; from?: string; to?: string }
export class ClimateRepository {
  private observations: Observation[] = [];
  private stations: StationReading[] = [];
  findObservations(filter: ObservationFilter) { return this.observations.filter(o => (!filter.region || o.region === filter.region) && (!filter.season || o.season === filter.season) && (!filter.from || o.timestamp >= filter.from) && (!filter.to || o.timestamp <= `${filter.to}T23:59:59.999Z`)); }
  getStations() { return [...this.stations].sort((a,b) => b.timestamp.localeCompare(a.timestamp)); }
  ingest(reading: IngestReading) {
    const regionalForecast = this.findObservations({ region: reading.region }).at(-1)?.maxTemperature ?? reading.maxTemperature;
    const gap = Math.abs(reading.maxTemperature - regionalForecast);
    const station: StationReading = { ...reading, latestReading: reading.maxTemperature, regionalForecast, validation: gap <= 1.5 ? 'consistent' : gap <= 2.5 ? 'watch' : 'divergent', quality: gap > 3.5 ? 'suspect' : 'good' };
    const index = this.stations.findIndex(s => s.station === reading.station);
    if (index >= 0) this.stations[index] = station; else this.stations.push(station);
    const date = new Date(reading.timestamp); const month = date.getUTCMonth() + 1;
    const season: Season = month === 12 || month <= 2 ? 'Winter' : month <= 5 ? 'Pre-Monsoon/Summer' : month <= 9 ? 'Monsoon' : 'Post-Monsoon';
    const observation: Observation = { ...reading, season, station: reading.station, source: 'AWS', severity: classifySeverity(reading.maxTemperature, regionMeta[reading.region].normal) };
    this.observations.push(observation);
    return { station, observation };
  }
}
export const climateRepository = new ClimateRepository();
