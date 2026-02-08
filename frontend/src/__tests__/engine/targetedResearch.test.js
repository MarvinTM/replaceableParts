import { describe, it, expect } from 'vitest';
import { defaultRules } from '../../engine/defaultRules.js';
import { getEligibleTargetedResearchOptions } from '../../utils/targetedResearch';
import { getTargetedExperimentCostForRecipe } from '../../utils/researchCosts.js';

describe('targeted research eligibility', () => {
  it('includes missing-input material targets for discovered recipes', () => {
    const options = getEligibleTargetedResearchOptions({
      rules: defaultRules,
      discoveredRecipes: ['iron_plate'],
      unlockedRecipes: [],
    });

    const ids = options.materialRecipes.map(target => target.recipe.id);
    expect(ids).toContain('iron_ingot');
  });

  it('includes production enablers when discovered recipes have no unlocked machine path', () => {
    const options = getEligibleTargetedResearchOptions({
      rules: defaultRules,
      discoveredRecipes: ['planks'],
      unlockedRecipes: [],
    });

    const enablerIds = options.productionEnablers.map(target => target.recipe.id);
    expect(enablerIds).toContain('carpenters_bench');
  });

  it('does not include enabler if the machine blueprint is already unlocked', () => {
    const options = getEligibleTargetedResearchOptions({
      rules: defaultRules,
      discoveredRecipes: ['planks'],
      unlockedRecipes: ['carpenters_bench'],
    });

    const enablerIds = options.productionEnablers.map(target => target.recipe.id);
    expect(enablerIds).not.toContain('carpenters_bench');
  });

  it('assigns targeted costs based on each target recipe age', () => {
    const options = getEligibleTargetedResearchOptions({
      rules: defaultRules,
      discoveredRecipes: ['iron_plate'],
      unlockedRecipes: [],
    });

    const ironIngotTarget = options.materialRecipes.find((target) => target.recipe.id === 'iron_ingot');
    expect(ironIngotTarget).toBeDefined();
    expect(ironIngotTarget.targetedCost).toBe(
      getTargetedExperimentCostForRecipe(ironIngotTarget.recipe, defaultRules)
    );
  });
});
