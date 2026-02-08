import { describe, it, expect } from 'vitest';
import { defaultRules } from '../../engine/defaultRules';
import { generateExplorationMap, expandGeneratedMap } from '../../engine/mapGenerator';

function collectNodeRates(explorationMap) {
  return Object.values(explorationMap.tiles)
    .map(tile => tile?.extractionNode?.rate)
    .filter(rate => typeof rate === 'number');
}

describe('Map Generator Node Rates', () => {
  it('uses a fixed per-resource rate (interval max) for generated nodes', () => {
    const rules = structuredClone(defaultRules);
    rules.exploration.nodeSpawnChance = 1;

    const map = generateExplorationMap(123456, 32, 32, rules);
    const rates = collectNodeRates(map);
    const expectedRate = defaultRules.exploration.nodeRateRange.max;

    expect(rates.length).toBeGreaterThan(0);
    expect(new Set(rates)).toEqual(new Set([expectedRate]));
  });

  it('keeps fixed rates when generating expansion quadrants', () => {
    const rules = structuredClone(defaultRules);
    rules.exploration.nodeSpawnChance = 1;

    const initialMap = generateExplorationMap(123456, 32, 32, rules);
    const expandedMap = expandGeneratedMap(initialMap, rules);
    const rates = collectNodeRates(expandedMap);
    const expectedRate = defaultRules.exploration.nodeRateRange.max;

    expect(expandedMap).toBeTruthy();
    expect(rates.length).toBeGreaterThan(0);
    expect(new Set(rates)).toEqual(new Set([expectedRate]));
  });
});
