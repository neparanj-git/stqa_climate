import { regionMeta, stationRegistry } from './data.ts';
import type { ForecastPoint, Region, StationReading } from './domain.ts';
import { classifySeverity } from './severity.ts';

type CurrentResponse={current:{time:string;temperature_2m:number;relative_humidity_2m:number;wind_speed_10m:number};daily:{temperature_2m_max:number[]}};
type ForecastResponse={daily:{time:string[];temperature_2m_max:number[]}};
const endpoint=process.env.WEATHER_API_URL??'https://api.open-meteo.com/v1/forecast';
const ttl=Number(process.env.WEATHER_CACHE_SECONDS??600)*1000;
let stationCache:{expires:number;value:StationReading[]}|undefined;
let stationPending:Promise<StationReading[]>|undefined;
const forecastCache=new Map<Region,{expires:number;value:ForecastPoint[]}>();

async function weather<T>(params:Record<string,string|number>):Promise<T>{const url=new URL(endpoint);Object.entries(params).forEach(([key,value])=>url.searchParams.set(key,String(value)));const response=await fetch(url,{signal:AbortSignal.timeout(8000),headers:{'User-Agent':'heatwave-intelligence-platform/2.1'}});if(!response.ok)throw new Error(`Weather provider returned ${response.status}`);return response.json() as Promise<T>}

export async function liveStations(){if(stationCache&&stationCache.expires>Date.now())return stationCache.value;if(stationPending)return stationPending;stationPending=Promise.all(stationRegistry.map(async meta=>{const result=await weather<CurrentResponse>({latitude:meta.latitude,longitude:meta.longitude,current:'temperature_2m,relative_humidity_2m,wind_speed_10m',daily:'temperature_2m_max',forecast_days:1,timezone:'UTC'});const temperature=result.current.temperature_2m;return{...meta,latestReading:temperature,humidity:result.current.relative_humidity_2m,windSpeed:result.current.wind_speed_10m,regionalForecast:result.daily.temperature_2m_max[0],validation:'consistent' as const,quality:'good' as const,provider:'Open-Meteo',timestamp:new Date(`${result.current.time}Z`).toISOString()}}));try{const value=await stationPending;stationCache={expires:Date.now()+ttl,value};return value}finally{stationPending=undefined}}

export async function liveForecast(region:Region,days=7){const cached=forecastCache.get(region);if(cached&&cached.expires>Date.now()&&cached.value.length>=days)return cached.value.slice(0,days);const meta=regionMeta[region];const result=await weather<ForecastResponse>({latitude:meta.lat,longitude:meta.lon,daily:'temperature_2m_max',forecast_days:Math.max(7,days),timezone:'UTC'});const value=result.daily.time.map((date,index)=>{const maxTemperature=result.daily.temperature_2m_max[index];return{date:new Date(`${date}T12:00:00Z`).toISOString(),maxTemperature,severity:classifySeverity(maxTemperature,meta.normal),model:'open-meteo-live'} satisfies ForecastPoint});forecastCache.set(region,{expires:Date.now()+ttl,value});return value.slice(0,days)}
