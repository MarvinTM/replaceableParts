import { describe, it, expect } from 'vitest';
import {
  engine,
  defaultRules,
  createTestState
} from '../testHelpers';

function getRequiredMaterials(slots, quantity = 1) {
  return slots.reduce((acc, slot) => {
    const perUnit = slot.quantity || 1;
    acc[slot.material] = (acc[slot.material] || 0) + (perUnit * quantity);
    return acc;
  }, {});
}

describe('Engine: BUILD_MACHINE', () => {
  it('should build multiple machines and consume scaled materials', () => {
    const machineType = 'stone_furnace';
    const recipe = defaultRules.machineRecipes[machineType];
    const quantity = 3;
    const required = getRequiredMaterials(recipe.slots, quantity);

    const state = createTestState({
      inventory: required
    });
    const builtBefore = state.builtMachines?.[machineType] || 0;

    const result = engine(state, defaultRules, {
      type: 'BUILD_MACHINE',
      payload: { machineType, quantity }
    });

    expect(result.error).toBeNull();
    expect(result.state.builtMachines[machineType]).toBe(builtBefore + quantity);

    for (const [materialId, needed] of Object.entries(required)) {
      const expectedRemaining = (state.inventory[materialId] || 0) - needed;
      if (expectedRemaining === 0) {
        expect(result.state.inventory[materialId]).toBeUndefined();
      } else {
        expect(result.state.inventory[materialId]).toBe(expectedRemaining);
      }
    }
  });

  it('should fail when quantity requires more materials than available', () => {
    const machineType = 'stone_furnace';
    const recipe = defaultRules.machineRecipes[machineType];
    const perUnitRequired = getRequiredMaterials(recipe.slots, 1);
    const quantity = 2;

    const state = createTestState({
      inventory: perUnitRequired
    });
    const builtBefore = state.builtMachines?.[machineType] || 0;

    const result = engine(state, defaultRules, {
      type: 'BUILD_MACHINE',
      payload: { machineType, quantity }
    });

    expect(result.error).toContain('Not enough');
    expect(result.state.builtMachines?.[machineType] || 0).toBe(builtBefore);
  });

  it('should fail on invalid quantity', () => {
    const state = createTestState();

    const result = engine(state, defaultRules, {
      type: 'BUILD_MACHINE',
      payload: { machineType: 'stone_furnace', quantity: 0 }
    });

    expect(result.error).toBe('Build quantity must be at least 1');
  });
});

describe('Engine: BUILD_GENERATOR', () => {
  it('should build multiple generators and consume scaled materials', () => {
    const generatorType = 'thermal_generator';
    const recipe = defaultRules.generatorRecipes[generatorType];
    const quantity = 2;
    const required = getRequiredMaterials(recipe.slots, quantity);

    const state = createTestState({
      inventory: required
    });
    const builtBefore = state.builtGenerators?.[generatorType] || 0;

    const result = engine(state, defaultRules, {
      type: 'BUILD_GENERATOR',
      payload: { generatorType, quantity }
    });

    expect(result.error).toBeNull();
    expect(result.state.builtGenerators[generatorType]).toBe(builtBefore + quantity);

    for (const [materialId, needed] of Object.entries(required)) {
      const expectedRemaining = (state.inventory[materialId] || 0) - needed;
      if (expectedRemaining === 0) {
        expect(result.state.inventory[materialId]).toBeUndefined();
      } else {
        expect(result.state.inventory[materialId]).toBe(expectedRemaining);
      }
    }
  });

  it('should build multiple generators in cheat mode without consuming materials', () => {
    const generatorType = 'thermal_generator';
    const quantity = 4;
    const state = createTestState({
      inventory: {}
    });
    const builtBefore = state.builtGenerators?.[generatorType] || 0;

    const result = engine(state, defaultRules, {
      type: 'BUILD_GENERATOR',
      payload: { generatorType, cheat: true, quantity }
    });

    expect(result.error).toBeNull();
    expect(result.state.builtGenerators[generatorType]).toBe(builtBefore + quantity);
    expect(result.state.inventory).toEqual(state.inventory);
  });
});
