import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { engine } from '../engine/engine.js';
import { createInitialState } from '../engine/initialState.js';
import { defaultRules } from '../engine/defaultRules.js';

// Game tick speed constants (in milliseconds)
export const NORMAL_TICK_MS = 5000;  // 7 seconds per tick
export const FAST_TICK_MS = 3000;    // 4 seconds per tick (accelerated)

/**
 * Game Store using Zustand
 * Manages game engine state and provides actions to interact with the engine
 */
const useGameStore = create(
  devtools(
    persist(
      (set, get) => ({
      // Engine state
      engineState: null,
      rules: defaultRules,

      // Meta information
      saveId: null,
      saveName: null,
      lastError: null,
      isRunning: false,
      currentSpeed: 'paused',  // 'paused' | 'normal' | 'fast'
      tickInterval: null,

      // UI preferences
      machineAnimationMode: 'continuous', // 'disabled' | 'sometimes' | 'continuous'
      productionAnimationStyle: 'floatingFadeOut', // 'floatingFadeOut' | 'popAndFloat' | 'flyToInventory' | 'collectThenFly'
      disableResearch: false, // If true, all recipes are immediately unlocked

      // Production events for animations (cleared after consumed)
      pendingProductionEvents: [],

      // Tip queue for contextual tips (UI state, not persisted)
      tipQueue: [],

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
        const result = get().dispatch({ type: 'SIMULATE' });
        // Capture production events for animations
        if (result.productionEvents && result.productionEvents.length > 0) {
          set({ pendingProductionEvents: result.productionEvents }, false, 'captureProductionEvents');
        }
        return result;
      },

      addMachine: (machineType, x, y) => {
        return get().dispatch({ type: 'ADD_MACHINE', payload: { machineType, x, y } });
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

      // Research actions
      donateCredits: (amount) => {
        return get().dispatch({ type: 'DONATE_CREDITS', payload: { amount } });
      },

      donateParts: (itemId, quantity) => {
        return get().dispatch({ type: 'DONATE_PARTS', payload: { itemId, quantity } });
      },

      runExperiment: () => {
        return get().dispatch({ type: 'RUN_EXPERIMENT', payload: {} });
      },

      runTargetedExperiment: (recipeId) => {
        return get().dispatch({ type: 'RUN_TARGETED_EXPERIMENT', payload: { recipeId } });
      },

      fillPrototypeSlot: (recipeId, materialId, quantity) => {
        return get().dispatch({ type: 'FILL_PROTOTYPE_SLOT', payload: { recipeId, materialId, quantity } });
      },

      unlockRecipe: (recipeId) => {
        return get().dispatch({ type: 'UNLOCK_RECIPE', payload: { recipeId } });
      },

      unlockAllRecipes: () => {
        return get().dispatch({ type: 'UNLOCK_ALL_RECIPES', payload: {} });
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

      // Machine/Generator building actions
      buildMachine: (machineType, cheat = false) => {
        return get().dispatch({ type: 'BUILD_MACHINE', payload: { machineType, cheat } });
      },

      buildGenerator: (generatorType, cheat = false) => {
        return get().dispatch({ type: 'BUILD_GENERATOR', payload: { generatorType, cheat } });
      },

      // Tutorial
      completeTutorial: () => {
        const { engineState } = get();
        if (!engineState) return;
        set({
          engineState: { ...engineState, tutorialCompleted: true }
        }, false, 'completeTutorial');
      },

      // Tips system
      queueTip: (tipId, messageKey) => {
        const { engineState, tipQueue } = get();
        if (!engineState) return;

        // Don't queue if already shown or already in queue
        if (engineState.shownTips?.includes(tipId)) return;
        if (tipQueue.some(tip => tip.id === tipId)) return;

        set({
          tipQueue: [...tipQueue, { id: tipId, messageKey }]
        }, false, 'queueTip');
      },

      dismissTip: (index = 0) => {
        const { engineState, tipQueue } = get();
        if (!engineState || tipQueue.length === 0) return;

        const dismissedTip = tipQueue[index] || tipQueue[0];
        const newShownTips = [...(engineState.shownTips || []), dismissedTip.id];
        const newQueue = tipQueue.filter((_, i) => i !== index);

        set({
          engineState: { ...engineState, shownTips: newShownTips },
          tipQueue: newQueue
        }, false, 'dismissTip');
      },

      dismissAllTips: () => {
        const { engineState, tipQueue } = get();
        if (!engineState || tipQueue.length === 0) return;

        const allTipIds = tipQueue.map(tip => tip.id);
        const newShownTips = [...(engineState.shownTips || []), ...allTipIds];

        set({
          engineState: { ...engineState, shownTips: newShownTips },
          tipQueue: []
        }, false, 'dismissAllTips');
      },

      // Check if a tip has been shown
      hasTipBeenShown: (tipId) => {
        const { engineState } = get();
        return engineState?.shownTips?.includes(tipId) || false;
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

      setMachineAnimationMode: (mode) => {
        set({ machineAnimationMode: mode }, false, 'setMachineAnimationMode');
      },

      setProductionAnimationStyle: (style) => {
        set({ productionAnimationStyle: style }, false, 'setProductionAnimationStyle');
      },

      setDisableResearch: (disabled) => {
        set({ disableResearch: disabled }, false, 'setDisableResearch');
        if (disabled && get().engineState) {
          get().unlockAllRecipes();
        }
      },

      clearProductionEvents: () => {
        set({ pendingProductionEvents: [] }, false, 'clearProductionEvents');
      },

      // Game loop controls
      startGameLoop: (speed = 'normal') => {
        const { isRunning, tickInterval } = get();

        // If already running at a different speed, stop first
        if (isRunning && tickInterval) {
          clearInterval(tickInterval);
        }

        const tickMs = speed === 'fast' ? FAST_TICK_MS : NORMAL_TICK_MS;

        const interval = setInterval(() => {
          get().simulate();
        }, tickMs);

        set({ isRunning: true, currentSpeed: speed, tickInterval: interval }, false, 'startGameLoop');
      },

      stopGameLoop: () => {
        const { tickInterval } = get();
        if (tickInterval) {
          clearInterval(tickInterval);
        }
        set({ isRunning: false, currentSpeed: 'paused', tickInterval: null }, false, 'stopGameLoop');
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
          currentSpeed: 'paused',
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
      {
        name: 'replaceableParts-lastSave',
        partialize: (state) => ({
          saveId: state.saveId,
          saveName: state.saveName
        })
      }
    ),
    { name: 'replaceableParts-game' }
  )
);

export default useGameStore;
