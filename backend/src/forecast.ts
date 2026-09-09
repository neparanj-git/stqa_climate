import type { ForecastPoint, Region } from './domain.ts';
import { liveForecast } from './weather.ts';

export interface ForecastProvider { readonly name: string; forecast(region: Region, days: number): Promise<ForecastPoint[]> }

/** Baseline provider with the same contract a future TCN/TFT service will implement. */
class StatisticalBaselineProvider implements ForecastProvider {
  readonly name = 'open-meteo-live';
  forecast(region: Region, days: number) { return liveForecast(region, days); }
}

export const forecastProvider: ForecastProvider = new StatisticalBaselineProvider();
