import type { ForecastPoint, Region } from './domain.ts';
import { regionMeta } from './data.ts';
import { classifySeverity } from './severity.ts';
import { climateRepository } from './repository.ts';

export interface ForecastProvider { readonly name: string; forecast(region: Region, days: number): Promise<ForecastPoint[]> }

/** Baseline provider with the same contract a future TCN/TFT service will implement. */
class StatisticalBaselineProvider implements ForecastProvider {
  readonly name = 'statistical-baseline-v2';
  async forecast(region: Region, days: number) {
    const history = climateRepository.findObservations({ region }).slice(-14);
    const latest = history.at(-1)!;
    const recent = history.slice(-7);
    const trend = (recent.at(-1)!.maxTemperature - recent[0].maxTemperature) / Math.max(1, recent.length - 1);
    const residuals = recent.map((point, index) => point.maxTemperature - (recent[0].maxTemperature + trend * index));
    const uncertainty = Math.max(0.8, Math.sqrt(residuals.reduce((sum, value) => sum + value * value, 0) / residuals.length));
    return Array.from({ length: days }, (_, index) => {
      const date = new Date(latest.timestamp); date.setUTCDate(date.getUTCDate() + index + 1);
      const temperature = Number((latest.maxTemperature + trend * (index + 1) + Math.sin(index * .9) * .35).toFixed(1));
      const departure = temperature - regionMeta[region].normal;
      return { date: date.toISOString(), maxTemperature: temperature, lowerBound: Number((temperature - uncertainty).toFixed(1)), upperBound: Number((temperature + uncertainty).toFixed(1)), heatwaveProbability: Math.round(Math.max(2, Math.min(98, 12 + departure * 15))), severity: classifySeverity(temperature, regionMeta[region].normal), model: this.name };
    });
  }
}

export const forecastProvider: ForecastProvider = new StatisticalBaselineProvider();
