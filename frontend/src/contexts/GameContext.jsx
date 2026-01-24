import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import useGameStore from '../stores/gameStore';

const GameContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || '/api';
const GUEST_SAVE_KEY = 'replaceableParts-guestSave';
const MAX_CLOUD_SAVES = 5;

export function GameProvider({ children }) {
  const { isAuthenticated, isGuest, wasGuestBeforeLogin, clearWasGuestFlag } = useAuth();

  const [saves, setSaves] = useState([]);
  const [isLoadingSaves, setIsLoadingSaves] = useState(false);
  const [isAutoRestoring, setIsAutoRestoring] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

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

  // ============ Guest Save Functions ============

  const saveGuestGame = useCallback((state, name = 'Guest Save') => {
    const guestSave = {
      id: 'guest',
      name,
      data: state,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(GUEST_SAVE_KEY, JSON.stringify(guestSave));
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
        return save;
      } else if (isGuest) {
        // Guest mode: save to localStorage
        const guestSave = saveGuestGame(newEngineState, name);
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
  }, [initNewGame, isAuthenticated, isGuest, setSaveInfo, clearGame, loadSaves, saveGuestGame]);

  const loadGame = useCallback(async (saveIdToLoad) => {
    try {
      if (saveIdToLoad === 'guest' || (isGuest && !isAuthenticated)) {
        // Load guest save from localStorage
        const guestSave = loadGuestGame();
        if (!guestSave) {
          throw new Error('No guest save found');
        }
        loadGameState(guestSave.id, guestSave.name, guestSave.data);
        return guestSave;
      } else {
        // Load from backend
        const { save } = await api.getSave(saveIdToLoad);
        loadGameState(save.id, save.name, save.data);
        return save;
      }
    } catch (error) {
      console.error('Failed to load game:', error);
      throw error;
    }
  }, [isGuest, isAuthenticated, loadGuestGame, loadGameState]);

  const continueLatestGame = useCallback(async () => {
    const latest = getLatestSave();
    if (latest) {
      return loadGame(latest.id);
    }
    return null;
  }, [getLatestSave, loadGame]);

  const saveGame = useCallback(async () => {
    if (!engineState) return null;

    const currentState = getStateForSave();

    if (isGuest && !isAuthenticated) {
      // Guest mode: save to localStorage
      const guestSave = saveGuestGame(currentState, saveName || 'Guest Save');
      return guestSave;
    } else if (isAuthenticated && saveId && saveId !== 'guest') {
      // Authenticated: save to backend
      try {
        const { save } = await api.updateSave(saveId, { data: currentState });
        setSaveInfo(save.id, save.name);
        return save;
      } catch (error) {
        console.error('Failed to save game:', error);
        throw error;
      }
    }

    return null;
  }, [engineState, getStateForSave, isGuest, isAuthenticated, saveId, saveName, saveGuestGame, setSaveInfo]);

  const exitToMenu = useCallback(async () => {
    // Auto-save before exiting if we have a game
    if (engineState) {
      try {
        await saveGame();
      } catch (error) {
        console.error('Failed to auto-save on exit:', error);
      }
    }
    clearGame();
  }, [engineState, saveGame, clearGame]);

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
          try {
            console.log('Auto-restoring guest save');
            loadGameState(guestSave.id, guestSave.name, guestSave.data);
          } catch (error) {
            console.error('Failed to auto-restore guest game:', error);
          } finally {
            setIsAutoRestoring(false);
          }
        }
        return;
      }

      // For authenticated users, restore from backend if we have a saveId
      if (isAuthenticated && saveId && saveId !== 'guest') {
        hasAttemptedRestore.current = true;
        setIsAutoRestoring(true);
        try {
          console.log(`Auto-restoring last played game: ${saveName} (ID: ${saveId})`);
          await loadGame(saveId);
        } catch (error) {
          console.error('Failed to auto-restore game:', error);
          clearGame();
        } finally {
          setIsAutoRestoring(false);
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
      saveGame().catch(console.error);
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [isInGame, isAuthenticated, saveId, saveGame]);

  // Auto-save for guests when engine state changes (debounced)
  const guestSaveTimeoutRef = useRef(null);
  useEffect(() => {
    if (!isInGame || !isGuest || isAuthenticated) return;

    // Debounce guest saves to every 5 seconds max
    if (guestSaveTimeoutRef.current) {
      clearTimeout(guestSaveTimeoutRef.current);
    }

    guestSaveTimeoutRef.current = setTimeout(() => {
      const currentState = getStateForSave();
      if (currentState) {
        saveGuestGame(currentState, saveName || 'Guest Save');
      }
    }, 5000);

    return () => {
      if (guestSaveTimeoutRef.current) {
        clearTimeout(guestSaveTimeoutRef.current);
      }
    };
  }, [isInGame, isGuest, isAuthenticated, engineState, getStateForSave, saveGuestGame, saveName]);

  // Save on page unload
  useEffect(() => {
    const saveOnUnload = () => {
      const currentSaveId = useGameStore.getState().saveId;
      const currentEngineState = useGameStore.getState().engineState;

      if (!currentEngineState) return;

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
        return;
      }

      // For authenticated users, save to backend
      if (!currentSaveId || currentSaveId === 'guest') return;

      const token = localStorage.getItem('token');
      if (!token) return;

      fetch(`${API_URL}/game/saves/${currentSaveId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ data: currentEngineState }),
        keepalive: true
      }).catch(() => {
        // Ignore errors on unload
      });
    };

    const handleBeforeUnload = () => {
      saveOnUnload();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveOnUnload();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isGuest, isAuthenticated]);

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
