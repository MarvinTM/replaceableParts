/**
 * Shared research cost helpers used by engine, UI, and balancing scripts.
 */

export function getRecipeAge(recipe, rules) {
  if (!recipe?.outputs || !rules?.materials) {
    return 1;
  }

  let recipeAge = 1;
  for (const outputId of Object.keys(recipe.outputs)) {
    const material = rules.materials.find(m => m.id === outputId);
    if (material && material.age > recipeAge) {
      recipeAge = material.age;
    }
  }

  return recipeAge;
}

export function getExperimentCostForAge(age, rules) {
  const costs = rules?.research?.experimentCosts || {};
  return costs[age] || costs[1] || 0;
}

export function getTargetedExperimentCostForRecipe(recipe, rules) {
  const recipeAge = getRecipeAge(recipe, rules);
  const baseCost = getExperimentCostForAge(recipeAge, rules);
  const multiplier = rules?.research?.targetedExperimentMultiplier || 10;
  return baseCost * multiplier;
}
