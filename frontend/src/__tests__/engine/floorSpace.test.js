
import { describe, it, expect } from 'vitest';
import {
  engine,
  defaultRules,
  createTestState
} from '../testHelpers';
import { canPlaceAt } from '../../engine/engine';

describe('Floor Space: BUY_FLOOR_SPACE', () => {
  it('should expand floor space and deduct credits', () => {
    const state = createTestState({
      credits: 1000,
      floorSpace: {
        width: 16, // Use default initialWidth
        height: 16,
        chunks: [{ x: 0, y: 0, width: 16, height: 16 }],
        placements: []
      }
    });

    const result = engine(state, defaultRules, {
      type: 'BUY_FLOOR_SPACE'
    });

    expect(result.error).toBeNull();
    expect(result.state.credits).toBeLessThan(1000);
    expect(result.state.floorSpace.chunks.length).toBeGreaterThan(1);
    // Width or height should increase
    const expanded = result.state.floorSpace.width > 16 || result.state.floorSpace.height > 16;
    expect(expanded).toBe(true);
  });

  it('should fail when not enough credits', () => {
    const state = createTestState({
      credits: 0
    });

    const result = engine(state, defaultRules, {
      type: 'BUY_FLOOR_SPACE'
    });

    expect(result.error).toBeDefined();
  });
});

describe('Floor Space: Spiral Expansion', () => {
  it('should follow spiral pattern', () => {
     // Default is spiral in defaultRules
     // initialWidth is 16. N=16. chunkSize=8.
     // Expansion 1: x=16, y=0, w=8, h=8.
     
     const state = createTestState({
      credits: 10000,
      floorSpace: {
        width: 16,
        height: 16,
        chunks: [{ x: 0, y: 0, width: 16, height: 16 }], // 1 chunk
        placements: []
      }
    });
    
    // 1st expansion: Right wing (x=16, y=0)
    let result = engine(state, defaultRules, { type: 'BUY_FLOOR_SPACE' });
    const chunk1 = result.state.floorSpace.chunks[1];
    expect(chunk1.x).toBe(16);
    expect(chunk1.y).toBe(0);
    expect(chunk1.width).toBe(8);
    expect(chunk1.height).toBe(8);
    
    // 2nd expansion: Right wing (x=24, y=0) ?
    // Loop: x from N(16) to target(32) step 8.
    // x=16 (purchased above). x=24 (next).
    
    result = engine(result.state, defaultRules, { type: 'BUY_FLOOR_SPACE' });
    const chunk2 = result.state.floorSpace.chunks[2];
    expect(chunk2.x).toBe(24);
    expect(chunk2.y).toBe(0);
  });
});

describe('Floor Space: Fractal Expansion', () => {
  it('should expand using fractal pattern when configured', () => {
    const fractalRules = JSON.parse(JSON.stringify(defaultRules));
    fractalRules.floorSpace.expansionType = 'fractal';
    
    const state = createTestState({
      credits: 10000,
      floorSpace: {
        width: 8,
        height: 8,
        chunks: [{ x: 0, y: 0, width: 8, height: 8 }],
        placements: []
      }
    });

    // Fractal logic: expand width first if w < targetSquare
    // initialWidth=16 in defaultRules, but we forced start at 8.
    // getNextExpansionFractal logic is a bit complex, let's just see if it expands differently or correctly.
    // If it follows 'expandWidth ? width : 0' logic.
    
    const result = engine(state, fractalRules, { type: 'BUY_FLOOR_SPACE' });
    
    // Expecting expansion. 
    // If width=8, height=8. targetSquare might be 16 (initialWidth*2).
    // Should expand width.
    expect(result.state.floorSpace.width).toBeGreaterThan(8);
  });
});

describe('canPlaceAt', () => {
  it('should return valid for empty valid position', () => {
    const state = createTestState({
      floorSpace: {
        width: 10,
        height: 10,
        chunks: [{ x: 0, y: 0, width: 10, height: 10 }],
        placements: []
      }
    });

    const result = canPlaceAt(state, 0, 0, 2, 2, defaultRules);
    expect(result.valid).toBe(true);
  });

  it('should return error for out of bounds', () => {
    const state = createTestState({
      floorSpace: {
        width: 10,
        height: 10,
        chunks: [{ x: 0, y: 0, width: 10, height: 10 }],
        placements: []
      }
    });

    const result = canPlaceAt(state, 9, 9, 2, 2, defaultRules); // Ends at 10,10 (x+w=11 > 10)
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/out of bounds/);
  });

  it('should return error for collision', () => {
     const state = createTestState({
      floorSpace: {
        width: 10,
        height: 10,
        chunks: [{ x: 0, y: 0, width: 10, height: 10 }],
        placements: [
            { id: 'm1', x: 2, y: 2, structureType: 'stone_furnace' } // 3x3
        ]
      }
    });

    // Try to place at 3,3 (overlaps with 2,2 3x3 -> 2,3,4)
    const result = canPlaceAt(state, 3, 3, 1, 1, defaultRules);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/collides/);
  });
});
