import { describe, it, expect } from 'vitest';
import {
  getEnergyTipLevel,
  hasLowProduction,
  hasLowRawMaterialProduction,
  hasLowPartsProduction,
  hasMachineWithoutRecipeAssigned,
  hasGeneratorOutOfFuel,
  hasPrototypeReadyForParts,
  hasAffordableLockedExplorationNode,
  hasMarketSaturationWarning,
  hasMarketDiversificationOpportunity,
} from '../../utils/tipTriggers';

describe('tipTriggers', () => {
  describe('getEnergyTipLevel', () => {
    it('returns normal when there is no active consumption', () => {
      expect(getEnergyTipLevel({ produced: 50, consumed: 0 })).toBe('normal');
    });

    it('returns low when usage approaches capacity', () => {
      expect(getEnergyTipLevel({ produced: 100, consumed: 80 })).toBe('low');
    });

    it('returns negative when consumption exceeds production', () => {
      expect(getEnergyTipLevel({ produced: 100, consumed: 101 })).toBe('negative');
    });

    it('returns negative when there is demand but no production', () => {
      expect(getEnergyTipLevel({ produced: 0, consumed: 1 })).toBe('negative');
    });
  });

  describe('hasLowProduction', () => {
    it('returns false when there is no consumption', () => {
      expect(hasLowProduction(10, 0)).toBe(false);
    });

    it('returns true when consumption is high vs production', () => {
      expect(hasLowProduction(20, 16)).toBe(true);
    });

    it('returns false when production comfortably exceeds consumption', () => {
      expect(hasLowProduction(20, 10)).toBe(false);
    });
  });

  describe('hasLowRawMaterialProduction', () => {
    it('returns true when any raw material has low production headroom', () => {
      const rawMaterialBalance = [
        { materialId: 'wood', produced: 20, consumed: 10 },
        { materialId: 'stone', produced: 8, consumed: 7 },
      ];

      expect(hasLowRawMaterialProduction(rawMaterialBalance)).toBe(true);
    });

    it('returns false when all raw materials have enough production', () => {
      const rawMaterialBalance = [
        { materialId: 'wood', produced: 20, consumed: 10 },
        { materialId: 'stone', produced: 12, consumed: 6 },
      ];

      expect(hasLowRawMaterialProduction(rawMaterialBalance)).toBe(false);
    });
  });

  describe('hasLowPartsProduction', () => {
    it('returns true when any part throughput is near or below demand', () => {
      const throughput = new Map([
        ['iron_plate', { produced: 2, consumed: 4 }],
        ['nails', { produced: 10, consumed: 3 }],
      ]);

      expect(hasLowPartsProduction(throughput)).toBe(true);
    });

    it('returns false when all part throughput is healthy', () => {
      const throughput = new Map([
        ['iron_plate', { produced: 10, consumed: 4 }],
        ['nails', { produced: 8, consumed: 3 }],
      ]);

      expect(hasLowPartsProduction(throughput)).toBe(false);
    });
  });

  describe('hasMachineWithoutRecipeAssigned', () => {
    it('returns true when an enabled non-research machine has no recipe', () => {
      const machines = [{ type: 'stone_furnace', enabled: true, recipeId: null }];
      const machineConfigs = [{ id: 'stone_furnace', isResearchFacility: false }];

      expect(hasMachineWithoutRecipeAssigned({ machines, machineConfigs })).toBe(true);
    });

    it('ignores research facilities without recipes', () => {
      const machines = [{ type: 'research_laboratory', enabled: true, recipeId: null }];
      const machineConfigs = [{ id: 'research_laboratory', isResearchFacility: true }];

      expect(hasMachineWithoutRecipeAssigned({ machines, machineConfigs })).toBe(false);
    });
  });

  describe('hasGeneratorOutOfFuel', () => {
    it('returns true for fuel-based generator that is unpowered', () => {
      const generators = [{ type: 'thermal_generator', powered: false }];
      const generatorConfigs = [{ id: 'thermal_generator', fuelRequirement: { materialId: 'wood', consumptionRate: 1 } }];

      expect(hasGeneratorOutOfFuel({ generators, generatorConfigs })).toBe(true);
    });

    it('returns false for non-fuel generators', () => {
      const generators = [{ type: 'solar_array', powered: false }];
      const generatorConfigs = [{ id: 'solar_array' }];

      expect(hasGeneratorOutOfFuel({ generators, generatorConfigs })).toBe(false);
    });
  });

  describe('hasPrototypeReadyForParts', () => {
    it('returns true when a slots prototype has missing non-raw parts available', () => {
      const awaitingPrototype = [{
        mode: 'slots',
        slots: [
          { material: 'iron_rod', quantity: 4, filled: 1, isRaw: false },
          { material: 'wood', quantity: 2, filled: 2, isRaw: true },
        ],
      }];
      const inventory = { iron_rod: 5 };
      const materials = [{ id: 'wood', category: 'raw' }, { id: 'iron_rod', category: 'intermediate' }];

      expect(hasPrototypeReadyForParts({ awaitingPrototype, inventory, materials })).toBe(true);
    });

    it('returns false when no missing non-raw slots can be filled', () => {
      const awaitingPrototype = [{
        mode: 'slots',
        slots: [{ material: 'iron_rod', quantity: 4, filled: 4, isRaw: false }],
      }];
      const inventory = { iron_rod: 10 };

      expect(hasPrototypeReadyForParts({ awaitingPrototype, inventory, materials: [] })).toBe(false);
    });
  });

  describe('hasAffordableLockedExplorationNode', () => {
    it('returns true when there is an affordable locked explored node', () => {
      const explorationMap = {
        tiles: {
          a: { explored: true, extractionNode: { resourceType: 'wood', unlocked: false } },
          b: { explored: true, extractionNode: { resourceType: 'stone', unlocked: true } },
        }
      };

      const result = hasAffordableLockedExplorationNode({
        explorationMap,
        extractionNodes: [],
        credits: 50,
        getUnlockCost: (resourceType) => (resourceType === 'wood' ? 25 : 100),
      });

      expect(result).toBe(true);
    });

    it('returns false when no locked node is affordable', () => {
      const explorationMap = {
        tiles: {
          a: { explored: true, extractionNode: { resourceType: 'wood', unlocked: false } },
        }
      };

      const result = hasAffordableLockedExplorationNode({
        explorationMap,
        extractionNodes: [],
        credits: 10,
        getUnlockCost: () => 25,
      });

      expect(result).toBe(false);
    });
  });

  describe('hasMarketSaturationWarning', () => {
    it('returns true when a recently sold item is saturated', () => {
      const result = hasMarketSaturationWarning({
        marketRecentSales: [{ tick: 100, itemId: 'chair' }],
        marketPopularity: { chair: 0.75 },
        tick: 110,
        recentTicks: 20,
      });

      expect(result).toBe(true);
    });

    it('returns false when recent sales remain healthy', () => {
      const result = hasMarketSaturationWarning({
        marketRecentSales: [{ tick: 100, itemId: 'chair' }],
        marketPopularity: { chair: 1.1 },
        tick: 110,
        recentTicks: 20,
      });

      expect(result).toBe(false);
    });
  });

  describe('hasMarketDiversificationOpportunity', () => {
    it('returns true when one new item type unlocks next bonus and it is in stock', () => {
      const result = hasMarketDiversificationOpportunity({
        marketRecentSales: [{ tick: 100, itemId: 'chair' }, { tick: 101, itemId: 'table' }],
        tick: 110,
        diversificationWindow: 100,
        diversificationBonuses: { 3: 1.1, 5: 1.15 },
        inStockFinalGoodIds: ['chair', 'table', 'lamp'],
      });

      expect(result).toBe(true);
    });

    it('returns false when no unsold in-stock final good is available', () => {
      const result = hasMarketDiversificationOpportunity({
        marketRecentSales: [{ tick: 100, itemId: 'chair' }, { tick: 101, itemId: 'table' }],
        tick: 110,
        diversificationWindow: 100,
        diversificationBonuses: { 3: 1.1, 5: 1.15 },
        inStockFinalGoodIds: ['chair', 'table'],
      });

      expect(result).toBe(false);
    });
  });
});
