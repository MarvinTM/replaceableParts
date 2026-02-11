import { describe, it, expect } from 'vitest';
import { defaultRules } from '../../engine/defaultRules.js';
import { getEligibleTargetedResearchOptions } from '../../utils/targetedResearch';
import { getRecipeAge, getTargetedExperimentCostForRecipe } from '../../utils/researchCosts.js';

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

  it('uses declared recipe age when it is higher than the output material age', () => {
    const recipe = defaultRules.recipes.find((r) => r.id === 'iron_ingot_bulk');
    expect(recipe).toBeDefined();
    expect(getRecipeAge(recipe, defaultRules)).toBe(3);
  });

  it('respects maxRecipeAge when listing missing-input material targets', () => {
    const limitedOptions = getEligibleTargetedResearchOptions({
      rules: defaultRules,
      discoveredRecipes: ['iron_plate'],
      unlockedRecipes: [],
      maxRecipeAge: 1,
    });
    const limitedIds = limitedOptions.materialRecipes.map((target) => target.recipe.id);
    expect(limitedIds).toContain('iron_ingot');
    expect(limitedIds).not.toContain('iron_ingot_bulk');

    const age3Options = getEligibleTargetedResearchOptions({
      rules: defaultRules,
      discoveredRecipes: ['iron_plate'],
      unlockedRecipes: [],
      maxRecipeAge: 3,
    });
    const age3Ids = age3Options.materialRecipes.map((target) => target.recipe.id);
    expect(age3Ids).toContain('iron_ingot_bulk');
  });
});
