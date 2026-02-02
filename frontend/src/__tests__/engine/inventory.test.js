
import { describe, it, expect } from 'vitest';
import {
  engine,
  defaultRules,
  createTestState,
  getMaxStack,
  getItemWeight
} from '../testHelpers';
// We need to import checking utils from engine if testHelpers doesn't have them
// testHelpers re-exports engine utils. Check testHelpers.js content or engine.js exports.
// engine.js exports `getItemWeight` and `getMaxStack`.
// But testHelpers only exports `engine, defaultRules, initialState` and its own helpers.
// I should import them from engine directly if testHelpers doesn't expose them.
// Looking at testHelpers read earlier: 
// "export { engine, defaultRules, initialState };"
// It does NOT export getItemWeight/getMaxStack.
// I will import from engine.

import { getItemWeight, getMaxStack } from '../../engine/engine';

describe('Inventory: BUY_INVENTORY_SPACE', () => {
  it('should increase inventory capacity and deduct credits', () => {
    const state = createTestState({
      credits: 1000,
      inventorySpace: 100
    });

    const result = engine(state, defaultRules, {
      type: 'BUY_INVENTORY_SPACE',
      payload: { amount: 1 } // Payload amount doesn't matter for logic, it uses fixed steps
    });

    expect(result.error).toBeNull();
    expect(result.state.inventorySpace).toBeGreaterThan(100);
    expect(result.state.credits).toBeLessThan(1000);
  });

  it('should fail when not enough credits', () => {
    const state = createTestState({
      credits: 0
    });

    const result = engine(state, defaultRules, {
      type: 'BUY_INVENTORY_SPACE',
      payload: {}
    });

    expect(result.error).toBeDefined();
  });
});

describe('Inventory Utilities', () => {
  it('should get item weight from rules', () => {
    const weight = getItemWeight('iron_ingot', defaultRules);
    // Iron ingot weight in defaultRules is 3
    expect(weight).toBe(3);
  });

  it('should handle default weight for unknown items', () => {
    const weight = getItemWeight('unknown_item', defaultRules);
    expect(weight).toBe(1);
  });

  it('should calculate max stack based on weight', () => {
    const inventorySpace = 100;
    const itemWeight = 5;
    // We mock rules or use default rules and find an item with weight 5?
    // Or mock rules passed to getMaxStack (if it takes rules, which it does)
    
    // getMaxStack(itemId, inventoryCapacity, rules)
    // We can mock rules object
    const mockRules = {
        materials: [{ id: 'heavy_thing', weight: 5 }]
    };
    
    const maxStack = getMaxStack('heavy_thing', inventorySpace, mockRules);
    expect(maxStack).toBe(20); // 100 / 5 = 20
  });
});
