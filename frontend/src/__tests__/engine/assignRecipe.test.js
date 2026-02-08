import { describe, it, expect } from 'vitest';
import { engine } from '../../engine/engine';
import { defaultRules } from '../../engine/defaultRules';
import { initialState } from '../../engine/initialState';

describe('Engine: ASSIGN_RECIPE', () => {
    // Setup a simple state
    const setupState = () => {
        const state = JSON.parse(JSON.stringify(initialState));
        // Add a machine
        state.machines = [{
            id: 'm1',
            type: 'stone_furnace', 
            x: 0,
            y: 0,
            recipeId: null,
            internalBuffer: {}
        }];
        state.unlockedRecipes = ['iron_ingot']; // Only unlock iron_ingot
        return state;
    };

    const unlockedRecipeId = 'iron_ingot';
    const lockedRecipeId = 'copper_ingot';

    it('should assign an unlocked recipe', () => {
        const state = setupState();
        
        const action = {
            type: 'ASSIGN_RECIPE',
            payload: {
                machineId: 'm1',
                recipeId: unlockedRecipeId
            }
        };

        const result = engine(state, defaultRules, action);
        expect(result.error).toBeNull();
        expect(result.state.machines[0].recipeId).toBe(unlockedRecipeId);
    });

    it('should fail to assign a locked recipe without cheat mode', () => {
        const state = setupState();
        // Ensure copper_ingot is NOT unlocked (setupState only unlocks iron_ingot)
        
        const action = {
            type: 'ASSIGN_RECIPE',
            payload: {
                machineId: 'm1',
                recipeId: lockedRecipeId 
            }
        };

        const result = engine(state, defaultRules, action);
        expect(result.error).toBe('Recipe not unlocked');
        expect(result.state.machines[0].recipeId).toBeNull();
    });

    it('should assign a locked recipe with cheat mode', () => {
        const state = setupState();
        
        const action = {
            type: 'ASSIGN_RECIPE',
            payload: {
                machineId: 'm1',
                recipeId: lockedRecipeId,
                cheat: true // Cheat mode enabled
            }
        };

        const result = engine(state, defaultRules, action);
        expect(result.error).toBeNull();
        expect(result.state.machines[0].recipeId).toBe(lockedRecipeId);
    });

    it('should not refund raw materials from buffer when clearing recipe', () => {
        const state = setupState();
        state.machines[0].recipeId = unlockedRecipeId;
        state.machines[0].internalBuffer = { iron_ore: 1 };

        const action = {
            type: 'ASSIGN_RECIPE',
            payload: {
                machineId: 'm1',
                recipeId: null
            }
        };

        const result = engine(state, defaultRules, action);
        expect(result.error).toBeNull();
        expect(result.state.machines[0].recipeId).toBeNull();
        expect(result.state.machines[0].internalBuffer).toEqual({});
        expect(result.state.inventory.iron_ore).toBeUndefined();
    });

    it('should refund non-raw materials from buffer when changing recipe', () => {
        const state = setupState();
        state.machines[0].recipeId = unlockedRecipeId;
        state.machines[0].internalBuffer = { iron_ingot: 2 };

        const action = {
            type: 'ASSIGN_RECIPE',
            payload: {
                machineId: 'm1',
                recipeId: null
            }
        };

        const result = engine(state, defaultRules, action);
        expect(result.error).toBeNull();
        expect(result.state.inventory.iron_ingot).toBe(2);
    });
});
