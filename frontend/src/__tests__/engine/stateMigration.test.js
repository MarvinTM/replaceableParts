import { describe, it, expect } from 'vitest';
import { createTestState, defaultRules } from '../testHelpers';
import { migrateGameState } from '../../engine/engine';
import { compressStateForSave } from '../../utils/saveCompression';

describe('State Migration', () => {
  it('should migrate stale foundry prototype slots to current recipe inputs and refund removed fills', () => {
    const state = createTestState({
      inventory: {
        steel_beam: 1,
      },
      research: {
        active: false,
        researchPoints: 0,
        awaitingPrototype: [
          {
            recipeId: 'foundry',
            mode: 'slots',
            slots: [
              { material: 'bricks', quantity: 20, filled: 10, isRaw: false },
              { material: 'steel_beam', quantity: 8, filled: 3, isRaw: false },
            ],
          },
        ],
      },
    });

    const migrated = migrateGameState(state, defaultRules);
    const prototype = migrated.research.awaitingPrototype[0];

    expect(prototype.mode).toBe('slots');
    expect(prototype.slots.some(slot => slot.material === 'steel_beam')).toBe(false);

    const bricksSlot = prototype.slots.find(slot => slot.material === 'bricks');
    const ironPlateSlot = prototype.slots.find(slot => slot.material === 'iron_plate');

    expect(bricksSlot).toBeTruthy();
    expect(bricksSlot.filled).toBe(10);
    expect(ironPlateSlot).toBeTruthy();
    expect(ironPlateSlot.filled).toBe(0);

    // Old steel_beam slot progress should be refunded.
    expect(migrated.inventory.steel_beam).toBe(4);

    // Source object should remain unchanged.
    expect(state.research.awaitingPrototype[0].slots[1].material).toBe('steel_beam');
    expect(state.inventory.steel_beam).toBe(1);
  });

  it('should migrate precision assembler prototype from electric_motor to drive_shaft and keep matching progress', () => {
    const state = createTestState({
      inventory: {
        electric_motor: 1,
      },
      research: {
        active: false,
        researchPoints: 0,
        awaitingPrototype: [
          {
            recipeId: 'precision_assembler',
            mode: 'slots',
            slots: [
              { material: 'steel_plate', quantity: 22, filled: 5, isRaw: false },
              { material: 'gear', quantity: 22, filled: 7, isRaw: false },
              { material: 'electric_motor', quantity: 5, filled: 2, isRaw: false },
              { material: 'ball_bearing', quantity: 9, filled: 1, isRaw: false },
            ],
          },
        ],
      },
    });

    const migrated = migrateGameState(state, defaultRules);
    const prototype = migrated.research.awaitingPrototype[0];

    expect(prototype.slots.some(slot => slot.material === 'electric_motor')).toBe(false);

    const steelPlateSlot = prototype.slots.find(slot => slot.material === 'steel_plate');
    const gearSlot = prototype.slots.find(slot => slot.material === 'gear');
    const driveShaftSlot = prototype.slots.find(slot => slot.material === 'drive_shaft');

    expect(steelPlateSlot).toBeTruthy();
    expect(steelPlateSlot.filled).toBe(5);
    expect(gearSlot).toBeTruthy();
    expect(gearSlot.filled).toBe(7);
    expect(driveShaftSlot).toBeTruthy();
    expect(driveShaftSlot.filled).toBe(0);

    // Old electric motor slot progress should be refunded.
    expect(migrated.inventory.electric_motor).toBe(3);
  });

  it('should normalize all node rates in legacy saves to the configured interval max', () => {
    const legacyState = createTestState({
      extractionNodes: [
        { id: 'wood_active', resourceType: 'wood', rate: 1, active: true },
        { id: 'iron_active', resourceType: 'iron_ore', rate: 99, active: true }
      ],
      explorationMap: {
        generatedWidth: 2,
        generatedHeight: 2,
        tiles: {
          '0,0': {
            x: 0,
            y: 0,
            terrain: 'forest',
            explored: true,
            extractionNode: { id: 'exp_node_wood_0_0', resourceType: 'wood', rate: 1, unlocked: true }
          },
          '1,0': {
            x: 1,
            y: 0,
            terrain: 'hills',
            explored: true,
            extractionNode: { id: 'exp_node_iron_ore_1_0', resourceType: 'iron_ore', rate: 7, unlocked: false }
          },
          '0,1': {
            x: 0,
            y: 1,
            terrain: 'plains',
            explored: false,
            extractionNode: null
          },
          '1,1': {
            x: 1,
            y: 1,
            terrain: 'hills',
            explored: false,
            extractionNode: { id: 'exp_node_stone_1_1', resourceType: 'stone', rate: 123, unlocked: false }
          }
        }
      }
    });

    const compressedLegacyState = compressStateForSave(legacyState);
    const migrated = migrateGameState(compressedLegacyState, defaultRules);
    const normalizedRate = defaultRules.exploration.nodeRateRange.max;

    expect(migrated.extractionNodes.every(node => node.rate === normalizedRate)).toBe(true);
    expect(migrated.explorationMap.tiles['0,0'].extractionNode.rate).toBe(normalizedRate);
    expect(migrated.explorationMap.tiles['1,0'].extractionNode.rate).toBe(normalizedRate);
    expect(migrated.explorationMap.tiles['1,1'].extractionNode.rate).toBe(normalizedRate);

    // Input object should remain untouched.
    expect(legacyState.extractionNodes[0].rate).toBe(1);
    expect(legacyState.explorationMap.tiles['1,0'].extractionNode.rate).toBe(7);
  });
});
