
import { describe, it, expect } from 'vitest';
import { engine, createRNG } from './engine.js';
import { defaultRules } from './defaultRules.js';

// Mock state helper
function createMockState(unlockedRecipes, discoveredRecipes = []) {
  return {
    unlockedRecipes: unlockedRecipes,
    discoveredRecipes: discoveredRecipes,
    research: {
      active: true,
      researchPoints: 1000,
      awaitingPrototype: []
    },
    rngSeed: 12345
  };
}

describe('Research Logic', () => {
  it('should not allow discovering recipes more than 1 age ahead', () => {
    // Setup state: Only Age 1 unlocked
    // We need to find some Age 1 recipes to be unlocked
    const age1Recipe = defaultRules.recipes.find(r => r.age === 1);
    const mockState = createMockState([age1Recipe.id], [age1Recipe.id]);

    // Force RNG to try to pick something else?
    // We can't easily force selectRecipeByAgeWeighting directly as it is not exported.
    // But we can call runExperiment.
    
    // We will run many experiments and verify none are > Age 2
    for (let i = 0; i < 50; i++) {
        // Reset state each time to keep "currentAge" at 1
        const tempState = JSON.parse(JSON.stringify(mockState));
        const result = engine(tempState, defaultRules, { type: 'RUN_EXPERIMENT' });
        
        if (result.error) {
            // Might happen if all recipes discovered, but with just 1 unlocked, there should be many available
            if (result.error === 'All recipes have been discovered') break;
            throw new Error(result.error);
        }

        const newDiscoveredId = result.state.discoveredRecipes.find(id => !mockState.discoveredRecipes.includes(id));
        if (newDiscoveredId) {
            const recipe = defaultRules.recipes.find(r => r.id === newDiscoveredId);
            
            // Determine age
            let recipeAge = 1;
            for (const outputId of Object.keys(recipe.outputs)) {
                const material = defaultRules.materials.find(m => m.id === outputId);
                if (material && material.age > recipeAge) {
                    recipeAge = material.age;
                }
            }

            expect(recipeAge).toBeLessThanOrEqual(2);
        }
    }
  });

  it('should prioritize current age if backlog exists', () => {
    // Setup state: Age 1 unlocked, but many Age 1 recipes undiscovered
    // undiscovered Age 1 recipes exist by default since we only unlocked one.
    const age1Recipe = defaultRules.recipes.find(r => r.age === 1);
    const mockState = createMockState([age1Recipe.id], [age1Recipe.id]);

    let age1Count = 0;
    let age2Count = 0;

    for (let i = 0; i < 100; i++) {
        const tempState = JSON.parse(JSON.stringify(mockState));
        // Ensure RNG varies
        tempState.rngSeed = Math.random() * 10000; 

        const result = engine(tempState, defaultRules, { type: 'RUN_EXPERIMENT' });
        
        if (result.state) {
             const newDiscoveredId = result.state.discoveredRecipes[result.state.discoveredRecipes.length - 1];
             const recipe = defaultRules.recipes.find(r => r.id === newDiscoveredId);
             
             let recipeAge = 1;
             for (const outputId of Object.keys(recipe.outputs)) {
                 const material = defaultRules.materials.find(m => m.id === outputId);
                 if (material && material.age > recipeAge) {
                     recipeAge = material.age;
                 }
             }

             if (recipeAge === 1) age1Count++;
             if (recipeAge === 2) age2Count++;
        }
    }

    // Expect Age 1 to be overwhelmingly selected
    expect(age1Count).toBeGreaterThan(age2Count * 5); // At least 5x more likely
    console.log(`Age 1: ${age1Count}, Age 2: ${age2Count}`);
  });
});
