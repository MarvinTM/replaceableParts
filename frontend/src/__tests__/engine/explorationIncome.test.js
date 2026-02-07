import { describe, it, expect } from 'vitest';
import { calculateRawMaterialIncome } from '../../utils/explorationIncome';

describe('calculateRawMaterialIncome', () => {
  it('aggregates active rates by raw material', () => {
    const materials = [
      { id: 'wood', category: 'raw' },
      { id: 'iron_ore', category: 'raw' },
      { id: 'iron_ingot', category: 'intermediate' },
    ];

    const extractionNodes = [
      { resourceType: 'wood', rate: 2, active: true },
      { resourceType: 'wood', rate: 3, active: true },
      { resourceType: 'wood', rate: 10, active: false },
      { resourceType: 'iron_ore', rate: 4, active: true },
      { resourceType: 'iron_ingot', rate: 8, active: true },
    ];

    expect(calculateRawMaterialIncome(extractionNodes, materials)).toEqual([
      { materialId: 'iron_ore', rate: 4 },
      { materialId: 'wood', rate: 5 },
    ]);
  });

  it('ignores invalid rates and unknown materials', () => {
    const materials = [
      { id: 'stone', category: 'raw' },
    ];

    const extractionNodes = [
      { resourceType: 'stone', rate: '2', active: true },
      { resourceType: 'stone', rate: 0, active: true },
      { resourceType: 'stone', rate: -2, active: true },
      { resourceType: 'stone', rate: Number.NaN, active: true },
      { resourceType: 'coal', rate: 5, active: true },
    ];

    expect(calculateRawMaterialIncome(extractionNodes, materials)).toEqual([
      { materialId: 'stone', rate: 2 },
    ]);
  });

  it('returns empty list with missing data', () => {
    expect(calculateRawMaterialIncome()).toEqual([]);
    expect(calculateRawMaterialIncome([], [])).toEqual([]);
  });
});

