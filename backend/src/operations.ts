import { randomUUID } from 'node:crypto';
import { REGIONS, type ClimateAlert, type HeatwaveSeverity, type Region } from './domain.ts';
import { regionMeta } from './data.ts';
import { classifySeverity, severityRank } from './severity.ts';
import { liveStations } from './weather.ts';

let alerts:ClimateAlert[]=[];
const acknowledged=new Map<string,string>();

async function refresh(){
  const stations=await liveStations();
  const regions=REGIONS.map(region=>{const readings=stations.filter(station=>station.region===region);const hottest=readings.reduce((a,b)=>a.latestReading>b.latestReading?a:b);const severity=classifySeverity(hottest.latestReading,regionMeta[region].normal);return{region,latestTemp:hottest.latestReading,severity,normal:regionMeta[region].normal,latitude:hottest.latitude,longitude:hottest.longitude,departure:Number((hottest.latestReading-regionMeta[region].normal).toFixed(1))}});
  const observedAt=stations.reduce((latest,station)=>station.timestamp>latest?station.timestamp:latest,stations[0].timestamp);
  alerts=regions.filter(region=>region.severity!=='Normal').map(region=>{const id=`${region.region}:${observedAt.slice(0,13)}:${region.severity}`;const acknowledgedAt=acknowledged.get(id);return{id,region:region.region,severity:region.severity,title:`${region.severity} conditions — ${region.region}`,message:`${region.latestTemp.toFixed(1)}°C observed, ${Math.max(0,region.departure).toFixed(1)}°C above the regional reference.`,createdAt:observedAt,status:acknowledgedAt?'acknowledged':'active',acknowledgedAt} satisfies ClimateAlert}).sort((a,b)=>severityRank[b.severity]-severityRank[a.severity]);
  return{stations,regions};
}

export async function listAlerts(status?:ClimateAlert['status']){await refresh();return status?alerts.filter(alert=>alert.status===status):[...alerts]}
export async function acknowledgeAlert(id:string){await refresh();const alert=alerts.find(item=>item.id===id);if(!alert)return;const timestamp=new Date().toISOString();acknowledged.set(id,timestamp);alert.status='acknowledged';alert.acknowledgedAt=timestamp;return alert}
export function createAlert(region:Region,severity:HeatwaveSeverity,temperature:number){const alert:ClimateAlert={id:randomUUID(),region,severity,title:`${severity} reading — ${region}`,message:`${temperature.toFixed(1)}°C reported by a live station. Review local conditions and the regional outlook.`,createdAt:new Date().toISOString(),status:'active'};alerts.unshift(alert);return alert}
export async function operationalSnapshot(){const{stations,regions}=await refresh();const hottest=regions.reduce((a,b)=>a.latestTemp>b.latestTemp?a:b);const activeAlerts=alerts.filter(alert=>alert.status==='active').length;const healthy=stations.filter(station=>station.quality==='good').length;return{generatedAt:new Date().toISOString(),connection:'live',forecastProvider:'open-meteo-live',reportingStations:stations.length,totalStations:stations.length,dataQuality:Math.round(healthy/stations.length*100),activeAlerts,stream:{status:'connected',transport:'sse'},coverage:{reporting:stations.length,total:stations.length,healthy},alerts:{active:activeAlerts,highestSeverity:alerts.reduce<HeatwaveSeverity>((highest,alert)=>severityRank[alert.severity]>severityRank[highest]?alert.severity:highest,'Normal')},hottest,regions}}
