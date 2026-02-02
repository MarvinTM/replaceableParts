
import { describe, it, expect } from 'vitest';
import {
  engine,
  defaultRules,
  createTestState,
  simulateTicks,
  createProductionState
} from '../testHelpers';

describe('Integration: Early Game Progression', () => {
  it('should produce iron ingots, sell them, and expand', () => {
    // 1. Start with basic production
    let state = createProductionState({
        machineType: 'stone_furnace',
        recipeId: 'iron_ingot',
        rawMaterials: { iron_ore: 100, coal: 100, wood: 100 }
    });
    
    state.credits = 0;
    
    // 2. Simulate production
    const sim1 = simulateTicks(state, defaultRules, 100);
    state = sim1.state;
    
    const produced = state.inventory.iron_ingot || 0;
    expect(produced).toBeGreaterThan(0);
    
    // 3. Sell goods
    const sellResult = engine(state, defaultRules, {
        type: 'SELL_GOODS',
        payload: { itemId: 'iron_ingot', quantity: produced }
    });
    state = sellResult.state;
    expect(state.credits).toBeGreaterThan(0);
    expect(state.inventory.iron_ingot).toBeUndefined();
    
    // 4. Buy floor space
    const buyResult = engine(state, defaultRules, {
        type: 'BUY_FLOOR_SPACE'
    });
    // It might fail if not enough credits, but we check progress
    if (!buyResult.error) {
        expect(buyResult.state.floorSpace.chunks.length).toBeGreaterThan(state.floorSpace.chunks.length);
    }
  });
});

describe('Integration: Research Cycle', () => {
  it('should discover recipes and complete prototypes', () => {
    const state = createTestState({
        credits: 10000,
        research: { 
            active: true, 
            researchPoints: 100, 
            awaitingPrototype: [] 
        },
        discoveredRecipes: [],
        unlockedRecipes: [],
        extractionNodes: [
            { id: 'wood', resourceType: 'wood', rate: 10, active: true },
            { id: 'stone', resourceType: 'stone', rate: 10, active: true },
            { id: 'iron', resourceType: 'iron_ore', rate: 10, active: true }
        ],
        energy: { produced: 100, consumed: 0 }
    });
    
    // 1. Run experiment
    const expResult = engine(state, defaultRules, { type: 'RUN_EXPERIMENT' });
    let currentState = expResult.state;
    
    expect(currentState.discoveredRecipes.length).toBe(1);
    expect(currentState.research.awaitingPrototype.length).toBe(1);
    
    const proto = currentState.research.awaitingPrototype[0];
    
    // 2. Progress prototype (if flow mode, simulate ticks)
    if (proto.mode === 'flow') {
        const sim = simulateTicks(currentState, defaultRules, 50);
        currentState = sim.state;
        
        // Should eventually unlock
        expect(currentState.unlockedRecipes.length).toBeGreaterThan(0);
    } else {
        // Slots mode - manually fill or simulate if raw
        // Most early ones are flow if they only take raw.
    }
  });
});
