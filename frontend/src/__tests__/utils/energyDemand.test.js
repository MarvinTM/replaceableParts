import { describe, it, expect } from 'vitest';
import { calculateRequestedEnergyConsumption } from '../../utils/energyDemand';

describe('calculateRequestedEnergyConsumption', () => {
  const machineConfigs = [
    { id: 'stone_furnace', energyConsumption: 5, isResearchFacility: false },
    { id: 'research_lab', energyConsumption: 8, isResearchFacility: true },
  ];

  it('includes blocked machines in requested consumption', () => {
    const machines = [
      { type: 'stone_furnace', recipeId: 'iron_ingot', enabled: true, status: 'working' },
      { type: 'stone_furnace', recipeId: 'iron_ingot', enabled: true, status: 'blocked' },
    ];

    expect(calculateRequestedEnergyConsumption({ machines, machineConfigs })).toBe(10);
  });

  it('excludes manually disabled machines', () => {
    const machines = [
      { type: 'stone_furnace', recipeId: 'iron_ingot', enabled: true, status: 'working' },
      { type: 'stone_furnace', recipeId: 'iron_ingot', enabled: false, status: 'blocked' },
    ];

    expect(calculateRequestedEnergyConsumption({ machines, machineConfigs })).toBe(5);
  });

  it('counts enabled research facilities even without recipe assignment', () => {
    const machines = [
      { type: 'research_lab', recipeId: null, enabled: true, status: 'idle' },
    ];

    expect(calculateRequestedEnergyConsumption({ machines, machineConfigs })).toBe(8);
  });
});
