import { describe, expect, it } from 'vitest';
import { classifySeverity } from './severity.js';
describe('classifySeverity', () => {
  it('classifies departure thresholds', () => {
    expect(classifySeverity(40.9, 39)).toBe('Normal');
    expect(classifySeverity(41, 39)).toBe('Heat Alert');
    expect(classifySeverity(43.5, 39)).toBe('Heatwave');
    expect(classifySeverity(45.5, 39)).toBe('Severe Heatwave');
  });
});
