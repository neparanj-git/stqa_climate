import { REGIONS, type Observation, type Region, type Season, type StationReading } from './domain.ts';
import { classifySeverity } from './severity.ts';

export const regionMeta: Record<Region, { normal: number; lat: number; lon: number }> = {
  'North India': { normal: 37, lat: 30.7, lon: 78.2 }, 'Northwest India': { normal: 39, lat: 27.2, lon: 73.8 },
  'Central India': { normal: 38, lat: 22.8, lon: 78.7 }, 'East India': { normal: 36, lat: 23.1, lon: 86.7 },
  'Northeast India': { normal: 31, lat: 26.2, lon: 92.9 }, 'South Peninsula': { normal: 35, lat: 13.1, lon: 78.7 },
  'West Coast': { normal: 33, lat: 16.3, lon: 74.3 }
};

function seasonFor(month: number): Season {
  if (month === 12 || month <= 2) return 'Winter';
  if (month <= 5) return 'Pre-Monsoon/Summer';
  if (month <= 9) return 'Monsoon';
  return 'Post-Monsoon';
}

function seededWave(day: number, regionIndex: number) { return Math.sin(day * .51 + regionIndex) * 1.8 + Math.cos(day * .19) * .8; }

export const observations: Observation[] = Array.from({ length: 60 }, (_, offset) => {
  const date = new Date(); date.setUTCHours(12, 0, 0, 0); date.setUTCDate(date.getUTCDate() - (59 - offset));
  return REGIONS.map((region, i) => {
    const meta = regionMeta[region];
    const anomaly = seededWave(offset, i) + (i === 1 ? 4.4 : i === 2 ? 2.9 : i === 3 ? 1.8 : 0.5);
    const temp = Number((meta.normal + anomaly).toFixed(1));
    return { timestamp: date.toISOString(), region, season: seasonFor(date.getUTCMonth() + 1), latitude: meta.lat, longitude: meta.lon, maxTemperature: temp, station: `REG-${String(i + 1).padStart(2, '0')}`, severity: classifySeverity(temp, meta.normal) };
  });
}).flat();

const stationSeeds: [string, string, Region, number, number, number][] = [
  ['AWS-DEL-01','New Delhi','North India',28.61,77.21,1.2], ['AWS-SGR-02','Srinagar','North India',34.08,74.80,-1.6],
  ['AWS-JAI-03','Jaipur','Northwest India',26.91,75.79,1.8], ['AWS-JSL-04','Jaisalmer','Northwest India',26.92,70.91,2.7],
  ['AWS-BPL-05','Bhopal','Central India',23.26,77.41,.7], ['AWS-NGP-06','Nagpur','Central India',21.15,79.09,1.5],
  ['AWS-PAT-07','Patna','East India',25.59,85.14,1.1], ['AWS-KOL-08','Kolkata','East India',22.57,88.36,-.4],
  ['AWS-GHY-09','Guwahati','Northeast India',26.14,91.74,.5], ['AWS-SHG-10','Shillong','Northeast India',25.58,91.89,-2.1],
  ['AWS-HYD-11','Hyderabad','South Peninsula',17.39,78.49,1.4], ['AWS-BLR-12','Bengaluru','South Peninsula',12.97,77.59,-1.1],
  ['AWS-GOA-13','Panaji','West Coast',15.49,73.83,.4], ['AWS-KOC-14','Kochi','West Coast',9.93,76.27,-.7]
];

export function latestByRegion(region: Region) { return observations.filter(o => o.region === region).at(-1)!; }
export const stations: StationReading[] = stationSeeds.map(([station, location, region, latitude, longitude, delta]) => {
  const regionalForecast = latestByRegion(region).maxTemperature; const latestReading = Number((regionalForecast + delta).toFixed(1)); const gap = Math.abs(delta);
  return { station, location, region, latitude, longitude, latestReading, regionalForecast, validation: gap <= 1.5 ? 'consistent' : gap <= 2.5 ? 'watch' : 'divergent', timestamp: new Date().toISOString() };
});
