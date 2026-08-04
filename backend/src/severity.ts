import type { HeatwaveSeverity } from './domain.js';

/** Demo classification based on departure from a region's seasonal normal. */
export function classifySeverity(temperature: number, seasonalNormal: number): HeatwaveSeverity {
  const departure = temperature - seasonalNormal;
  if (departure >= 6.5) return 'Severe Heatwave';
  if (departure >= 4.5) return 'Heatwave';
  if (departure >= 2) return 'Heat Alert';
  return 'Normal';
}

export const severityRank: Record<HeatwaveSeverity, number> = { Normal: 0, 'Heat Alert': 1, Heatwave: 2, 'Severe Heatwave': 3 };

