import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { engine } from '../engine/engine.js';
import { createInitialState } from '../engine/initialState.js';
import { defaultRules } from '../engine/defaultRules.js';

/**
 * Game Store using Zustand
 * Manages game engine state and provides actions to interact with the engine
 */
const useGameStore = create(
  devtools(
    (set, get) => ({
      // Engine state
      engineState: null,
      rules: defaultRules,

      // Meta information
      saveId: null,
      saveName: null,
      lastError: null,
      isRunning: false,
      tickInterval: null,

      // Initialize a new game
      initNewGame: (seed = null) => {
        const newState = createInitialState(seed ?? Date.now());
        set({
          engineState: newState,
          saveId: null,
          saveName: 'New Game',
          lastError: null,
          isRunning: false
        }, false, 'initNewGame');
        return newState;
      },

      // Load game from saved data
      loadGame: (saveId, saveName, savedState) => {
        set({
          engineState: savedState,
          saveId,
          saveName,
          lastError: null,
          isRunning: false
        }, false, 'loadGame');
      },

      // Get current state for saving
      getStateForSave: () => {
        return get().engineState;
      },

      // Update save info after saving
      setSaveInfo: (saveId, saveName) => {
        set({ saveId, saveName }, false, 'setSaveInfo');
      },

      // Dispatch an action to the engine
      dispatch: (action) => {
        const { engineState, rules } = get();
        if (!engineState) {
          console.error('Cannot dispatch: no game loaded');
          return { state: null, error: 'No game loaded' };
        }

        const result = engine(engineState, rules, action);

        if (result.error) {
          set({ lastError: result.error }, false, `dispatch/${action.type}/error`);
        } else {
          set({
            engineState: result.state,
            lastError: null
          }, false, `dispatch/${action.type}`);
        }

        return result;
      },

      // Convenience action dispatchers
      simulate: () => {
        return get().dispatch({ type: 'SIMULATE' });
      },

      addMachine: (x, y) => {
        return get().dispatch({ type: 'ADD_MACHINE', payload: { x, y } });
      },

      removeMachine: (machineId) => {
        return get().dispatch({ type: 'REMOVE_MACHINE', payload: { machineId } });
      },

      moveMachine: (machineId, x, y) => {
        return get().dispatch({ type: 'MOVE_MACHINE', payload: { machineId, x, y } });
      },

      assignRecipe: (machineId, recipeId) => {
        return get().dispatch({ type: 'ASSIGN_RECIPE', payload: { machineId, recipeId } });
      },

      addGenerator: (generatorType, x, y) => {
        return get().dispatch({ type: 'ADD_GENERATOR', payload: { generatorType, x, y } });
      },

      removeGenerator: (generatorId) => {
        return get().dispatch({ type: 'REMOVE_GENERATOR', payload: { generatorId } });
      },

      moveGenerator: (generatorId, x, y) => {
        return get().dispatch({ type: 'MOVE_GENERATOR', payload: { generatorId, x, y } });
      },

      buyFloorSpace: () => {
        return get().dispatch({ type: 'BUY_FLOOR_SPACE' });
      },

      sellGoods: (itemId, quantity) => {
        return get().dispatch({ type: 'SELL_GOODS', payload: { itemId, quantity } });
      },

      toggleResearch: () => {
        return get().dispatch({ type: 'TOGGLE_RESEARCH' });
      },

      unlockRecipe: (recipeId) => {
        return get().dispatch({ type: 'UNLOCK_RECIPE', payload: { recipeId } });
      },

      unblockMachine: (machineId) => {
        return get().dispatch({ type: 'UNBLOCK_MACHINE', payload: { machineId } });
      },

      toggleMachine: (machineId) => {
        return get().dispatch({ type: 'TOGGLE_MACHINE', payload: { machineId } });
      },

      buyInventorySpace: () => {
        return get().dispatch({ type: 'BUY_INVENTORY_SPACE' });
      },

      // Exploration actions
      expandExploration: () => {
        return get().dispatch({ type: 'EXPAND_EXPLORATION', payload: {} });
      },

      unlockExplorationNode: (x, y) => {
        return get().dispatch({ type: 'UNLOCK_EXPLORATION_NODE', payload: { x, y } });
      },

      setExpansionType: (type) => {
        set((state) => ({
          rules: {
            ...state.rules,
            floorSpace: {
              ...state.rules.floorSpace,
              expansionType: type
            }
          }
        }), false, 'setExpansionType');
      },

      // Game loop controls
      startGameLoop: (tickMs = 1000) => {
        const { isRunning, tickInterval } = get();
        if (isRunning) return;

        const interval = setInterval(() => {
          get().simulate();
        }, tickMs);

        set({ isRunning: true, tickInterval: interval }, false, 'startGameLoop');
      },

      stopGameLoop: () => {
        const { tickInterval } = get();
        if (tickInterval) {
          clearInterval(tickInterval);
        }
        set({ isRunning: false, tickInterval: null }, false, 'stopGameLoop');
      },

      // Clear game (return to menu)
      clearGame: () => {
        const { tickInterval } = get();
        if (tickInterval) {
          clearInterval(tickInterval);
        }
        set({
          engineState: null,
          saveId: null,
          saveName: null,
          lastError: null,
          isRunning: false,
          tickInterval: null
        }, false, 'clearGame');
      },

      // Export game state as JSON string (for sharing/debugging)
      exportGameState: () => {
        const { engineState, saveName } = get();
        if (!engineState) return null;

        return JSON.stringify({
          version: '1.0',
          exportedAt: new Date().toISOString(),
          name: saveName,
          state: engineState
        }, null, 2);
      },

      // Import game state from JSON string
      importGameState: (jsonString) => {
        try {
          const data = JSON.parse(jsonString);
          if (!data.state) {
            throw new Error('Invalid save file format');
          }
          set({
            engineState: data.state,
            saveId: null,
            saveName: data.name || 'Imported Game',
            lastError: null,
            isRunning: false
          }, false, 'importGameState');
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    }),
    { name: 'replaceableParts-game' }
  )
);

export default useGameStore;
