import { describe, it, expect } from 'vitest';
import {
  getEnergyTipLevel,
  hasLowProduction,
  hasLowRawMaterialProduction,
  hasLowPartsProduction,
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
});
