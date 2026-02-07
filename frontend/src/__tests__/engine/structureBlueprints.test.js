import { describe, it, expect } from 'vitest';
import {
  engine,
  defaultRules,
  createTestState,
} from '../testHelpers';
import { analyzeIssues } from '../../utils/graphAnalysis';

describe('Structure Blueprints', () => {
  it('should include research recipes for all buildable machines and generators', () => {
    const recipeIds = new Set(defaultRules.recipes.map(recipe => recipe.id));

    const requiredMachineBlueprints = defaultRules.machines
      .filter(machine => !machine.disabled && defaultRules.machineRecipes?.[machine.id]?.slots?.length > 0)
      .map(machine => machine.id);

    const requiredGeneratorBlueprints = defaultRules.generators
      .filter(generator => !generator.disabled && defaultRules.generatorRecipes?.[generator.id]?.slots?.length > 0)
      .map(generator => generator.id);

    for (const recipeId of [...requiredMachineBlueprints, ...requiredGeneratorBlueprints]) {
      expect(recipeIds.has(recipeId)).toBe(true);
    }
  });

  it('should discover and unlock blacksmiths_anvil through targeted research and prototype build', () => {
    const targetRecipeId = 'blacksmiths_anvil';
    const initialState = createTestState({
      research: { active: false, researchPoints: 5000, awaitingPrototype: [] },
      discoveredRecipes: [],
      unlockedRecipes: [],
      inventory: {},
    });

    const discovered = engine(initialState, defaultRules, {
      type: 'RUN_TARGETED_EXPERIMENT',
      payload: { recipeId: targetRecipeId },
    });

    expect(discovered.error).toBeNull();
    expect(discovered.state.discoveredRecipes).toContain(targetRecipeId);

    const prototype = discovered.state.research.awaitingPrototype.find(p => p.recipeId === targetRecipeId);
    expect(prototype).toBeTruthy();
    expect(prototype.mode).toBe('slots');

    const requiredInventory = {};
    for (const slot of prototype.slots) {
      requiredInventory[slot.material] = (requiredInventory[slot.material] || 0) + slot.quantity;
    }

    let currentState = {
      ...discovered.state,
      inventory: {
        ...discovered.state.inventory,
        ...requiredInventory,
      },
    };

    for (const slot of prototype.slots) {
      const fill = engine(currentState, defaultRules, {
        type: 'FILL_PROTOTYPE_SLOT',
        payload: {
          recipeId: targetRecipeId,
          materialId: slot.material,
          quantity: slot.quantity,
        },
      });
      expect(fill.error).toBeNull();
      currentState = fill.state;
    }

    expect(currentState.unlockedRecipes).toContain(targetRecipeId);
  });

  it('should report missing structure blueprint in rules analysis', () => {
    const mutatedRules = JSON.parse(JSON.stringify(defaultRules));
    mutatedRules.recipes = mutatedRules.recipes.filter(recipe => recipe.id !== 'blacksmiths_anvil');

    const issues = analyzeIssues(mutatedRules);
    expect(issues.missingStructureBlueprints.some(issue => issue.structureId === 'blacksmiths_anvil')).toBe(true);
  });
});
