import { describe, it, expect } from 'vitest';
import { defaultRules } from '../../engine/defaultRules';
import { generateExplorationMap, expandGeneratedMap } from '../../engine/mapGenerator';

function collectNodeRates(explorationMap) {
  return Object.values(explorationMap.tiles)
    .map(tile => tile?.extractionNode?.rate)
    .filter(rate => typeof rate === 'number');
}

describe('Map Generator Node Rates', () => {
  it('generates desert and swamp biomes', () => {
    const map = generateExplorationMap(12345, 64, 64, defaultRules);
    const terrains = new Set(Object.values(map.tiles).map(tile => tile.terrain));

    expect(terrains.has('desert')).toBe(true);
    expect(terrains.has('swamp')).toBe(true);
  });

  it('marks newly generated maps with biome generation version', () => {
    const map = generateExplorationMap(12345, 64, 64, defaultRules);
    expect(map.biomeGenerationVersion).toBe(3);
  });

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
    expect(expandedMap.biomeGenerationVersion).toBe(3);
    expect(rates.length).toBeGreaterThan(0);
    expect(new Set(rates)).toEqual(new Set([expectedRate]));
  });
});
