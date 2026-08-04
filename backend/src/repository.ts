import { observations, stations } from './data.js';
import type { Region, Season } from './domain.js';

export interface ObservationFilter { region?: Region; season?: Season; from?: string; to?: string }
export class ClimateRepository {
  findObservations(filter: ObservationFilter) { return observations.filter(o => (!filter.region || o.region === filter.region) && (!filter.season || o.season === filter.season) && (!filter.from || o.timestamp >= filter.from) && (!filter.to || o.timestamp <= `${filter.to}T23:59:59.999Z`)); }
  getStations() { return stations; }
}
export const climateRepository = new ClimateRepository();

