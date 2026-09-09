import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(()=>{vi.unstubAllGlobals();vi.resetModules()});

describe('live weather provider',()=>{
  it('maps provider observations without generating station measurements',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({current:{time:'2026-09-09T11:15',temperature_2m:32.7,relative_humidity_2m:56,wind_speed_10m:9.3},daily:{temperature_2m_max:[34.1]}})}));
    const {liveStations}=await import('./weather.ts');const stations=await liveStations();
    expect(stations).toHaveLength(14);expect(stations[0]).toMatchObject({station:'WX-DEL-01',latestReading:32.7,humidity:56,windSpeed:9.3,regionalForecast:34.1,provider:'Open-Meteo'});expect(fetch).toHaveBeenCalledTimes(14);
  });

  it('returns only forecast values supplied by the provider',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({daily:{time:['2026-09-09','2026-09-10'],temperature_2m_max:[33.9,34.4]}})}));
    const {liveForecast}=await import('./weather.ts');const forecast=await liveForecast('Northwest India',2);
    expect(forecast).toEqual([{date:'2026-09-09T12:00:00.000Z',maxTemperature:33.9,severity:'Normal',model:'open-meteo-live'},{date:'2026-09-10T12:00:00.000Z',maxTemperature:34.4,severity:'Normal',model:'open-meteo-live'}]);expect(forecast[0]).not.toHaveProperty('heatwaveProbability');expect(forecast[0]).not.toHaveProperty('lowerBound');
  });
});
