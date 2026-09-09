import { randomUUID } from 'node:crypto';
import { REGIONS, type ClimateAlert, type HeatwaveSeverity, type Region } from './domain.ts';
import { climateRepository } from './repository.ts';
import { regionMeta } from './data.ts';
import { severityRank } from './severity.ts';

const now = Date.now();
const alerts: ClimateAlert[] = REGIONS.flatMap((region, index) => {
  const latest = climateRepository.latestForRegion(region);
  if (latest.severity === 'Normal') return [];
  return [{ id: randomUUID(), region, severity: latest.severity, title: `${latest.severity} conditions — ${region}`, message: `${latest.maxTemperature.toFixed(1)}°C observed, ${Math.max(0, latest.maxTemperature - regionMeta[region].normal).toFixed(1)}°C above the regional reference.`, createdAt: new Date(now - index * 37 * 60_000).toISOString(), status: index === 3 ? 'acknowledged' : 'active' } satisfies ClimateAlert];
}).sort((a,b) => b.createdAt.localeCompare(a.createdAt));

export function listAlerts(status?: ClimateAlert['status']) { return status ? alerts.filter(alert => alert.status === status) : [...alerts]; }
export function acknowledgeAlert(id: string) { const alert = alerts.find(item => item.id === id); if (!alert) return; alert.status = 'acknowledged'; alert.acknowledgedAt = new Date().toISOString(); return alert; }
export function createAlert(region: Region, severity: HeatwaveSeverity, temperature: number) { const alert: ClimateAlert = { id: randomUUID(), region, severity, title: `${severity} reading — ${region}`, message: `${temperature.toFixed(1)}°C reported by a live station. Review local conditions and the regional outlook.`, createdAt: new Date().toISOString(), status: 'active' }; alerts.unshift(alert); return alert; }
export function operationalSnapshot() {
  const stations = climateRepository.getStations();
  const summaries = REGIONS.map(region => { const latest = climateRepository.latestForRegion(region); return { region, latestTemp: latest.maxTemperature, severity: latest.severity, normal: regionMeta[region].normal, latitude: latest.latitude, longitude: latest.longitude, departure: Number((latest.maxTemperature - regionMeta[region].normal).toFixed(1)) }; });
  const hottest = summaries.reduce((a,b) => a.latestTemp > b.latestTemp ? a : b);
  const reportingStations = stations.filter(s => s.quality !== 'delayed').length;
  const healthyStations = stations.filter(s => s.quality === 'good').length;
  const activeAlerts = alerts.filter(a => a.status === 'active').length;
  return { generatedAt: new Date().toISOString(), connection: 'live', forecastProvider: 'statistical-baseline-v2', reportingStations, totalStations: stations.length, dataQuality: Math.round(healthyStations / stations.length * 100), activeAlerts, stream: { status: 'connected', transport: 'sse' }, coverage: { reporting: reportingStations, total: stations.length, healthy: healthyStations }, alerts: { active: activeAlerts, highestSeverity: alerts.reduce<HeatwaveSeverity>((highest, alert) => severityRank[alert.severity] > severityRank[highest] ? alert.severity : highest, 'Normal') }, hottest, regions: summaries };
}
