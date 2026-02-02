
import { describe, it, expect } from 'vitest';
import {
  createRNG,
  deepClone,
  calculateHighestUnlockedAge,
  defaultRules,
  createTestState
} from '../testHelpers';

// If setMutableMode is not in testHelpers yet, we can keep it or add it.
// Since I didn't add it to testHelpers re-exports, I'll keep it from engine or add it there.
import { setMutableMode } from '../../engine/engine';

describe('createRNG', () => {
  it('should generate deterministic sequence with same seed', () => {
    const seed = 12345;
    const rng1 = createRNG(seed);
    const rng2 = createRNG(seed);

    expect(rng1.next()).toBe(rng2.next());
    expect(rng1.next()).toBe(rng2.next());
    expect(rng1.next()).toBe(rng2.next());
  });

  it('should produce values between 0 and 1', () => {
    const rng = createRNG(123);
    for (let i = 0; i < 100; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('should track current seed', () => {
      // Implementation detail check: does tracking seed work?
      // createRNG returns { next, getCurrentSeed }
      const rng = createRNG(123);
      const seed1 = rng.getCurrentSeed();
      rng.next();
      const seed2 = rng.getCurrentSeed();
      expect(seed1).not.toBe(seed2);
  });
});

describe('deepClone', () => {
  it('should create independent copy', () => {
    const original = { a: 1, b: { c: 2 } };
    const copy = deepClone(original);
    
    expect(copy).toEqual(original);
    expect(copy).not.toBe(original);
    expect(copy.b).not.toBe(original.b);
    
    copy.b.c = 3;
    expect(original.b.c).toBe(2);
  });
});

describe('setMutableMode', () => {
  it('should skip cloning in mutable mode', () => {
      if (typeof setMutableMode !== 'function') {
          // Skip if not exported
          return; 
      }
      
      const original = { a: 1 };
      
      setMutableMode(true);
      const copy = deepClone(original);
      expect(copy).toBe(original); // Should return same reference
      
      setMutableMode(false);
      const copy2 = deepClone(original);
      expect(copy2).not.toBe(original); // Should clone again
  });
});

describe('calculateHighestUnlockedAge', () => {
  it('should return 1 with no recipes', () => {
    const state = createTestState({ unlockedRecipes: [] });
    const age = calculateHighestUnlockedAge(state, defaultRules);
    expect(age).toBe(1);
  });

  it('should return highest age from unlocked recipes', () => {
     // Find recipes with high age
     // We need to ensure we unlock a recipe that actually produces an item of high age.
     // calculateHighestUnlockedAge logic:
     // iterate unlockedRecipes -> get outputs -> get material -> check age.
     
     // defaultRules.materials has items with age 2, 3...
     // Find a recipe for age 2 item.
     const age2Material = defaultRules.materials.find(m => m.age === 2);
     // Find recipe producing it
     const age2Recipe = defaultRules.recipes.find(r => r.outputs[age2Material.id]);
     
     if (age2Recipe) {
         const state = createTestState({
             unlockedRecipes: [age2Recipe.id]
         });
         const age = calculateHighestUnlockedAge(state, defaultRules);
         expect(age).toBe(2);
     }
  });
});
