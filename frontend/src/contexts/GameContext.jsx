import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import useGameStore from '../stores/gameStore';
import { defaultRules } from '../engine/defaultRules';

const GameContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || '/api';
const GUEST_SAVE_KEY = 'replaceableParts-guestSave';
const MAX_CLOUD_SAVES = 5;
const SESSION_HEARTBEAT_INTERVAL = 60000; // 1 minute

/**
 * Validate that a game state is a real played game, not an initial/empty state.
 * This prevents saving corrupted states during HMR or refresh race conditions.
 */
function isValidGameStateForSave(state) {
  if (!state) return false;

  // A state that has been played should have at least one of these:
  // - tick > 0 (game has progressed)
  // - machines.length > 0 (player has placed machines)
  // - credits different from initial (5000000000)
  // - inventory has items
  const hasProgressed = state.tick > 0;
  const hasMachines = state.machines && state.machines.length > 0;
  const hasSpentCredits = state.credits !== 5000000000;
  const hasInventory = state.inventory && Object.keys(state.inventory).length > 0;

  // At least one of these should be true for a "real" save
  // For a brand new game, tick could be 0, but if the user manually saves,
  // that's intentional. This check mainly catches corrupted/reset states.
  return hasProgressed || hasMachines || hasSpentCredits || hasInventory;
}

export function GameProvider({ children }) {
  const { isAuthenticated, isGuest, wasGuestBeforeLogin, clearWasGuestFlag } = useAuth();

  const [saves, setSaves] = useState([]);
  const [isLoadingSaves, setIsLoadingSaves] = useState(false);
  const [isAutoRestoring, setIsAutoRestoring] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  // Ref to track when saves should be blocked (during restore operations)
  // This prevents race conditions during HMR/refresh where stale saves could overwrite good data
  const saveLockRef = useRef(false);

  // Store the last known good state hash to detect if state has meaningfully changed
  const lastSavedStateRef = useRef(null);

  // Get state and actions from Zustand store
  const engineState = useGameStore((state) => state.engineState);
  const saveId = useGameStore((state) => state.saveId);
  const saveName = useGameStore((state) => state.saveName);
  const initNewGame = useGameStore((state) => state.initNewGame);
  const loadGameState = useGameStore((state) => state.loadGame);
  const getStateForSave = useGameStore((state) => state.getStateForSave);
  const setSaveInfo = useGameStore((state) => state.setSaveInfo);
  const clearGame = useGameStore((state) => state.clearGame);

  const isInGame = !!engineState;

  // Current game info for compatibility with existing components
  const currentGame = engineState ? { id: saveId, name: saveName, data: engineState } : null;

  // ============ Session Tracking ============

  const sessionIdRef = useRef(null);
  const sessionStartTimeRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);

  // Calculate highest unlocked age from state
  const calculateCurrentAge = useCallback((state) => {
    if (!state || !state.unlockedRecipes) return 1;
    let highestAge = 1;
    for (const recipeId of state.unlockedRecipes) {
      const recipe = defaultRules.recipes.find(r => r.id === recipeId);
      if (recipe) {
        for (const outputId of Object.keys(recipe.outputs)) {
          const material = defaultRules.materials.find(m => m.id === outputId);
          if (material && material.age > highestAge) {
            highestAge = material.age;
          }
        }
      }
    }
    return highestAge;
  }, []);

  // Get session metrics from current engine state
  const getSessionMetrics = useCallback(() => {
    const state = useGameStore.getState().engineState;
    if (!state) return null;

    const currentAge = calculateCurrentAge(state);
    const maxMachines = (state.machines || []).length;
    const factoryWidth = state.floorSpace?.width || 16;
    const factoryHeight = state.floorSpace?.height || 16;
    const durationSeconds = sessionStartTimeRef.current
      ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
      : 0;

    return {
      currentAge,
      maxMachines,
      factoryWidth,
      factoryHeight,
      durationSeconds
    };
  }, [calculateCurrentAge]);

  // Start session tracking
  const startSessionTracking = useCallback(async (type, gameSaveId) => {
    if (!isAuthenticated) return;

    // End any existing session first
    if (sessionIdRef.current) {
      await endSessionTracking();
    }

    try {
      const state = useGameStore.getState().engineState;
      const startingAge = calculateCurrentAge(state);
      const factoryWidth = state?.floorSpace?.width || 16;
      const factoryHeight = state?.floorSpace?.height || 16;

      const { session } = await api.startSession({
        gameSaveId,
        sessionType: type,
        startingAge,
        factoryWidth,
        factoryHeight
      });

      sessionIdRef.current = session.id;
      sessionStartTimeRef.current = Date.now();

      // Start heartbeat interval
      heartbeatIntervalRef.current = setInterval(async () => {
        const metrics = getSessionMetrics();
        if (metrics && sessionIdRef.current) {
          try {
            await api.sessionHeartbeat(sessionIdRef.current, metrics);
          } catch (error) {
            console.error('Session heartbeat failed:', error);
          }
        }
      }, SESSION_HEARTBEAT_INTERVAL);

    } catch (error) {
      console.error('Failed to start session:', error);
    }
  }, [isAuthenticated, calculateCurrentAge, getSessionMetrics]);

  // End session tracking
  const endSessionTracking = useCallback(async () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (sessionIdRef.current) {
      try {
        const metrics = getSessionMetrics();
        await api.endSession(sessionIdRef.current, metrics || {});
      } catch (error) {
        console.error('Failed to end session:', error);
      }
      sessionIdRef.current = null;
      sessionStartTimeRef.current = null;
    }
  }, [getSessionMetrics]);

  // Send session beacon (for visibility change / page unload)
  const sendSessionBeacon = useCallback(() => {
    if (!sessionIdRef.current) return;
    const metrics = getSessionMetrics();
    if (metrics) {
      api.sendSessionBeacon(sessionIdRef.current, metrics);
    }
    sessionIdRef.current = null;
    sessionStartTimeRef.current = null;
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, [getSessionMetrics]);

  // ============ Guest Save Functions ============

  const saveGuestGame = useCallback((state, name = 'Guest Save', options = {}) => {
    const { bypassValidation = false, bypassLock = false } = options;

    // Don't save if save lock is active (during restore operations)
    if (saveLockRef.current && !bypassLock) {
      console.log('[SaveGuard] Blocked guest save: restore in progress');
      return null;
    }

    // Validate state before saving to prevent corrupted saves
    if (!bypassValidation && !isValidGameStateForSave(state)) {
      console.warn('[SaveGuard] Blocked guest save: state appears to be initial/empty state', {
        tick: state?.tick,
        machineCount: state?.machines?.length,
        credits: state?.credits
      });
      return null;
    }

    const guestSave = {
      id: 'guest',
      name,
      data: state,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(GUEST_SAVE_KEY, JSON.stringify(guestSave));
    lastSavedStateRef.current = state?.tick; // Track what we saved
    console.log('[SaveGuard] Guest save successful', { tick: state?.tick, machines: state?.machines?.length });
    return guestSave;
  }, []);

  const loadGuestGame = useCallback(() => {
    const saved = localStorage.getItem(GUEST_SAVE_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }, []);

  const hasGuestSave = useCallback(() => {
    return localStorage.getItem(GUEST_SAVE_KEY) !== null;
  }, []);

  const clearGuestSave = useCallback(() => {
    localStorage.removeItem(GUEST_SAVE_KEY);
  }, []);

  // ============ Cloud Save Functions ============

  const loadSaves = useCallback(async () => {
    if (!isAuthenticated) {
      setSaves([]);
      return [];
    }

    setIsLoadingSaves(true);
    try {
      const { saves } = await api.getSaves();
      setSaves(saves);
      return saves;
    } catch (error) {
      console.error('Failed to load saves:', error);
      return [];
    } finally {
      setIsLoadingSaves(false);
    }
  }, [isAuthenticated]);

  const getLatestSave = useCallback(() => {
    if (isGuest && !isAuthenticated) {
      // For guests, return the local save if it exists
      const guestSave = loadGuestGame();
      return guestSave;
    }

    if (saves.length === 0) return null;
    return saves.reduce((latest, save) =>
      new Date(save.updatedAt) > new Date(latest.updatedAt) ? save : latest
    );
  }, [saves, isGuest, isAuthenticated, loadGuestGame]);

  // ============ Migration ============

  const migrateGuestSaveToCloud = useCallback(async () => {
    const guestSave = loadGuestGame();
    if (!guestSave || !isAuthenticated) return null;

    setIsMigrating(true);
    try {
      // Create a new cloud save with the guest data
      const { save } = await api.createSave({
        name: guestSave.name || 'Migrated Save',
        data: guestSave.data
      });

      // Clear the guest save after successful migration
      clearGuestSave();

      // Reload cloud saves
      await loadSaves();

      // Update store with new save info
      setSaveInfo(save.id, save.name);
      loadGameState(save.id, save.name, save.data);

      console.log('Successfully migrated guest save to cloud');
      return save;
    } catch (error) {
      console.error('Failed to migrate guest save:', error);
      throw error;
    } finally {
      setIsMigrating(false);
    }
  }, [loadGuestGame, isAuthenticated, clearGuestSave, loadSaves, setSaveInfo, loadGameState]);

  // Handle migration when user logs in after being a guest
  useEffect(() => {
    if (wasGuestBeforeLogin && isAuthenticated && hasGuestSave()) {
      migrateGuestSaveToCloud()
        .then(() => {
          clearWasGuestFlag();
        })
        .catch(() => {
          clearWasGuestFlag();
        });
    } else if (wasGuestBeforeLogin) {
      clearWasGuestFlag();
    }
  }, [wasGuestBeforeLogin, isAuthenticated, hasGuestSave, migrateGuestSaveToCloud, clearWasGuestFlag]);

  // ============ Game Operations ============

  const startNewGame = useCallback(async (name = 'New Game', slotSaveId = null) => {
    try {
      // Initialize engine state
      const newEngineState = initNewGame();

      if (isAuthenticated) {
        // If we're overwriting a slot, delete it first
        if (slotSaveId) {
          try {
            await api.deleteSave(slotSaveId);
          } catch (error) {
            console.error('Failed to delete existing save for slot:', error);
          }
        }

        // Create save in backend with engine state
        const { save } = await api.createSave({
          name,
          data: newEngineState
        });

        // Update store with save info
        setSaveInfo(save.id, save.name);

        await loadSaves();

        // Start session tracking for authenticated users
        startSessionTracking('new', save.id);

        return save;
      } else if (isGuest) {
        // Guest mode: save to localStorage
        // New games intentionally have initial state, so bypass validation
        const guestSave = saveGuestGame(newEngineState, name, { bypassValidation: true });
        setSaveInfo(guestSave.id, guestSave.name);
        return guestSave;
      } else {
        throw new Error('Must be authenticated or in guest mode to start a game');
      }
    } catch (error) {
      console.error('Failed to create new game:', error);
      clearGame();
      throw error;
    }
  }, [initNewGame, isAuthenticated, isGuest, setSaveInfo, clearGame, loadSaves, saveGuestGame, startSessionTracking]);

  const loadGame = useCallback(async (saveIdToLoad) => {
    try {
      if (saveIdToLoad === 'guest' || (isGuest && !isAuthenticated)) {
        // Load guest save from localStorage
        const guestSave = loadGuestGame();
        if (!guestSave) {
          throw new Error('No guest save found');
        }
        loadGameState(guestSave.id, guestSave.name, guestSave.data);
        // Explicitly set save info to ensure persist middleware captures it
        setSaveInfo(guestSave.id, guestSave.name);
        return guestSave;
      } else {
        // Load from backend
        const { save } = await api.getSave(saveIdToLoad);
        loadGameState(save.id, save.name, save.data);
        // Explicitly set save info to ensure persist middleware captures it
        // This ensures auto-saves go to the correct slot after page refresh
        setSaveInfo(save.id, save.name);

        // Start session tracking for authenticated users
        startSessionTracking('load', save.id);

        return save;
      }
    } catch (error) {
      console.error('Failed to load game:', error);
      throw error;
    }
  }, [isGuest, isAuthenticated, loadGuestGame, loadGameState, setSaveInfo, startSessionTracking]);

  const continueLatestGame = useCallback(async () => {
    const latest = getLatestSave();
    if (latest) {
      return loadGame(latest.id);
    }
    return null;
  }, [getLatestSave, loadGame]);

  const saveGame = useCallback(async (options = {}) => {
    const { bypassLock = false, bypassValidation = false } = options;

    if (!engineState) return null;

    // Check save lock (can be bypassed for manual saves)
    if (saveLockRef.current && !bypassLock) {
      console.log('[SaveGame] Blocked: save lock active');
      return null;
    }

    const currentState = getStateForSave();

    // Validate state (can be bypassed for intentional saves)
    if (!bypassValidation && !isValidGameStateForSave(currentState)) {
      console.warn('[SaveGame] Blocked: state appears invalid', {
        tick: currentState?.tick,
        machines: currentState?.machines?.length
      });
      return null;
    }

    if (isGuest && !isAuthenticated) {
      // Guest mode: save to localStorage
      const guestSave = saveGuestGame(currentState, saveName || 'Guest Save', { bypassValidation: true });
      return guestSave;
    } else if (isAuthenticated && saveId && saveId !== 'guest') {
      // Authenticated: save to backend
      try {
        const { save } = await api.updateSave(saveId, { data: currentState });
        setSaveInfo(save.id, save.name);
        console.log('[SaveGame] Backend save successful, tick:', currentState?.tick);
        return save;
      } catch (error) {
        console.error('[SaveGame] Failed to save game:', error);
        throw error;
      }
    }

    return null;
  }, [engineState, getStateForSave, isGuest, isAuthenticated, saveId, saveName, saveGuestGame, setSaveInfo]);

  const exitToMenu = useCallback(async () => {
    // End session tracking before exiting
    await endSessionTracking();

    // Auto-save before exiting if we have a game
    if (engineState) {
      try {
        await saveGame();
      } catch (error) {
        console.error('Failed to auto-save on exit:', error);
      }
    }
    clearGame();
  }, [engineState, saveGame, clearGame, endSessionTracking]);

  const deleteSave = useCallback(async (saveIdToDelete) => {
    if (saveIdToDelete === 'guest') {
      clearGuestSave();
      if (saveId === 'guest') {
        clearGame();
      }
      return;
    }

    try {
      await api.deleteSave(saveIdToDelete);
      await loadSaves();
      if (saveId === saveIdToDelete) {
        clearGame();
      }
    } catch (error) {
      console.error('Failed to delete save:', error);
      throw error;
    }
  }, [saveId, loadSaves, clearGame, clearGuestSave]);

  // ============ Auto-restore ============

  const hasAttemptedRestore = useRef(false);
  useEffect(() => {
    const autoRestore = async () => {
      // Skip if already restoring or already have engine state
      if (engineState || isAutoRestoring || hasAttemptedRestore.current) return;

      // For guests, try to restore from localStorage
      if (isGuest && !isAuthenticated) {
        const guestSave = loadGuestGame();
        if (guestSave) {
          hasAttemptedRestore.current = true;
          setIsAutoRestoring(true);
          saveLockRef.current = true; // Block saves during restore
          try {
            console.log('[AutoRestore] Restoring guest save, tick:', guestSave.data?.tick);
            loadGameState(guestSave.id, guestSave.name, guestSave.data);
          } catch (error) {
            console.error('[AutoRestore] Failed to auto-restore guest game:', error);
          } finally {
            setIsAutoRestoring(false);
            // Delay unlock to let any pending state updates settle
            setTimeout(() => {
              saveLockRef.current = false;
              console.log('[AutoRestore] Save lock released');
            }, 1000);
          }
        }
        return;
      }

      // For authenticated users, restore from backend if we have a saveId
      if (isAuthenticated && saveId && saveId !== 'guest') {
        hasAttemptedRestore.current = true;
        setIsAutoRestoring(true);
        saveLockRef.current = true; // Block saves during restore
        try {
          console.log(`[AutoRestore] Restoring from backend: ${saveName} (ID: ${saveId})`);
          await loadGame(saveId);
        } catch (error) {
          console.error('[AutoRestore] Failed to auto-restore game:', error);
          clearGame();
        } finally {
          setIsAutoRestoring(false);
          // Delay unlock to let any pending state updates settle
          setTimeout(() => {
            saveLockRef.current = false;
            console.log('[AutoRestore] Save lock released');
          }, 1000);
        }
      }
    };

    autoRestore();
  }, [saveId, engineState, isAutoRestoring, saveName, loadGame, clearGame, isGuest, isAuthenticated, loadGuestGame, loadGameState]);

  // ============ Auto-save ============

  // Auto-save every 30 seconds for authenticated users
  useEffect(() => {
    if (!isInGame || !isAuthenticated || saveId === 'guest') return;

    const autoSaveInterval = setInterval(() => {
      // The saveGame function already checks saveLockRef internally
      saveGame().catch(err => {
        // Only log actual errors, not blocked saves
        if (err) console.error('[AutoSave] Error:', err);
      });
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [isInGame, isAuthenticated, saveId, saveGame]);

  // Auto-save for guests when engine state changes (debounced)
  // Use a stable ref for the timeout ID to handle HMR better
  const guestSaveTimeoutRef = useRef(null);
  // Track the tick at which we scheduled the save to detect stale saves
  const scheduledSaveTickRef = useRef(null);

  useEffect(() => {
    if (!isInGame || !isGuest || isAuthenticated) return;

    // Don't schedule saves while restore is in progress
    if (saveLockRef.current) {
      console.log('[GuestAutoSave] Skipped scheduling: save lock active');
      return;
    }

    // Clear any existing timeout
    if (guestSaveTimeoutRef.current) {
      clearTimeout(guestSaveTimeoutRef.current);
      guestSaveTimeoutRef.current = null;
    }

    // Record the tick we're scheduling a save for
    const currentTick = engineState?.tick;
    scheduledSaveTickRef.current = currentTick;

    guestSaveTimeoutRef.current = setTimeout(() => {
      // Double-check the save lock at execution time
      if (saveLockRef.current) {
        console.log('[GuestAutoSave] Blocked at execution: save lock active');
        return;
      }

      const currentState = getStateForSave();

      // Verify the state we're about to save is the same or newer than what we scheduled
      // This catches cases where the state regressed (e.g., during HMR)
      if (currentState?.tick !== undefined && scheduledSaveTickRef.current !== undefined) {
        if (currentState.tick < scheduledSaveTickRef.current) {
          console.warn('[GuestAutoSave] Blocked: state regressed', {
            scheduledTick: scheduledSaveTickRef.current,
            currentTick: currentState.tick
          });
          return;
        }
      }

      if (currentState) {
        saveGuestGame(currentState, saveName || 'Guest Save');
      }
    }, 5000);

    return () => {
      if (guestSaveTimeoutRef.current) {
        clearTimeout(guestSaveTimeoutRef.current);
        guestSaveTimeoutRef.current = null;
      }
    };
  }, [isInGame, isGuest, isAuthenticated, engineState, getStateForSave, saveGuestGame, saveName]);

  // Save on page unload
  useEffect(() => {
    const saveOnUnload = () => {
      const currentSaveId = useGameStore.getState().saveId;
      const currentEngineState = useGameStore.getState().engineState;

      if (!currentEngineState) {
        console.log('[SaveOnUnload] Skipped: no engine state');
        return;
      }

      // Check save lock - don't save during restore operations
      if (saveLockRef.current) {
        console.log('[SaveOnUnload] Skipped: save lock active (restore in progress)');
        return;
      }

      // Validate state to prevent saving corrupted/initial state
      if (!isValidGameStateForSave(currentEngineState)) {
        console.warn('[SaveOnUnload] Skipped: state appears invalid', {
          tick: currentEngineState?.tick,
          machines: currentEngineState?.machines?.length,
          credits: currentEngineState?.credits
        });
        return;
      }

      // For guests, save to localStorage
      if (isGuest && !isAuthenticated) {
        const guestSave = {
          id: 'guest',
          name: useGameStore.getState().saveName || 'Guest Save',
          data: currentEngineState,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(GUEST_SAVE_KEY, JSON.stringify(guestSave));
        console.log('[SaveOnUnload] Guest save successful, tick:', currentEngineState?.tick);
        return;
      }

      // For authenticated users, save to backend
      if (!currentSaveId || currentSaveId === 'guest') return;

      const token = localStorage.getItem('token');
      if (!token) return;

      const saveData = JSON.stringify({ data: currentEngineState });
      const saveUrl = `${API_URL}/game/saves/${currentSaveId}`;

      // Use sendBeacon for more reliable unload saves
      // sendBeacon doesn't support custom headers, so we include token in body
      // and the backend should accept it from there as a fallback
      if (navigator.sendBeacon) {
        const blob = new Blob(
          [JSON.stringify({ data: currentEngineState, _token: token })],
          { type: 'application/json' }
        );
        const sent = navigator.sendBeacon(saveUrl, blob);
        if (sent) return; // sendBeacon succeeded, no need for fallback
      }

      // Fallback to fetch with keepalive
      fetch(saveUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: saveData,
        keepalive: true
      }).catch(() => {
        // Ignore errors on unload
      });
    };

    const handleBeforeUnload = () => {
      sendSessionBeacon();
      saveOnUnload();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendSessionBeacon();
        saveOnUnload();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isGuest, isAuthenticated, sendSessionBeacon]);

  // Cleanup session tracking on unmount
  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  const value = {
    currentGame,
    saves,
    isInGame,
    isLoadingSaves,
    isAutoRestoring,
    isMigrating,
    maxCloudSaves: MAX_CLOUD_SAVES,
    loadSaves,
    getLatestSave,
    startNewGame,
    loadGame,
    continueLatestGame,
    saveGame,
    exitToMenu,
    deleteSave,
    hasGuestSave,
    migrateGuestSaveToCloud,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
