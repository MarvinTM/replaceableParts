import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { api } from '../services/api';
import useGameStore from '../stores/gameStore';

const GameContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function GameProvider({ children }) {
  const [saves, setSaves] = useState([]);
  const [isLoadingSaves, setIsLoadingSaves] = useState(false);
  const [isAutoRestoring, setIsAutoRestoring] = useState(false);

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

  const loadSaves = useCallback(async () => {
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
  }, []);

  const getLatestSave = useCallback(() => {
    if (saves.length === 0) return null;
    return saves.reduce((latest, save) =>
      new Date(save.updatedAt) > new Date(latest.updatedAt) ? save : latest
    );
  }, [saves]);

  const startNewGame = useCallback(async (name = 'New Game') => {
    try {
      // Initialize engine state
      const newEngineState = initNewGame();

      // Create save in backend with engine state
      const { save } = await api.createSave({
        name,
        data: newEngineState
      });

      // Update store with save info
      setSaveInfo(save.id, save.name);

      await loadSaves();
      return save;
    } catch (error) {
      console.error('Failed to create new game:', error);
      clearGame();
      throw error;
    }
  }, [initNewGame, setSaveInfo, clearGame, loadSaves]);

  const loadGame = useCallback(async (saveIdToLoad) => {
    try {
      const { save } = await api.getSave(saveIdToLoad);

      // Load engine state from saved data
      loadGameState(save.id, save.name, save.data);

      return save;
    } catch (error) {
      console.error('Failed to load game:', error);
      throw error;
    }
  }, [loadGameState]);

  const continueLatestGame = useCallback(async () => {
    const latest = getLatestSave();
    if (latest) {
      return loadGame(latest.id);
    }
    return null;
  }, [getLatestSave, loadGame]);

  const saveGame = useCallback(async () => {
    if (!saveId || !engineState) return null;
    try {
      const currentState = getStateForSave();
      const { save } = await api.updateSave(saveId, { data: currentState });
      setSaveInfo(save.id, save.name);
      return save;
    } catch (error) {
      console.error('Failed to save game:', error);
      throw error;
    }
  }, [saveId, engineState, getStateForSave, setSaveInfo]);

  const exitToMenu = useCallback(async () => {
    // Auto-save before exiting if we have a game
    if (saveId && engineState) {
      try {
        await saveGame();
      } catch (error) {
        console.error('Failed to auto-save on exit:', error);
      }
    }
    clearGame();
  }, [saveId, engineState, saveGame, clearGame]);

  const deleteSave = useCallback(async (saveIdToDelete) => {
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
  }, [saveId, loadSaves, clearGame]);

  // Auto-restore last played game on mount (after page refresh)
  const hasAttemptedRestore = useRef(false);
  useEffect(() => {
    const autoRestore = async () => {
      // If there's a saveId in localStorage but no engineState in memory,
      // it means the page was refreshed - restore the game from backend
      if (saveId && !engineState && !isAutoRestoring && !hasAttemptedRestore.current) {
        hasAttemptedRestore.current = true;
        setIsAutoRestoring(true);
        try {
          console.log(`Auto-restoring last played game: ${saveName} (ID: ${saveId})`);
          await loadGame(saveId);
        } catch (error) {
          console.error('Failed to auto-restore game:', error);
          // Clear the stale saveId if the restore fails
          clearGame();
        } finally {
          setIsAutoRestoring(false);
        }
      }
    };

    autoRestore();
  }, [saveId, engineState, isAutoRestoring, saveName, loadGame, clearGame]); // React to changes

  // Auto-save every 30 seconds while in game
  useEffect(() => {
    if (!isInGame || !saveId) return;

    const autoSaveInterval = setInterval(() => {
      saveGame().catch(console.error);
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [isInGame, saveId, saveGame]);

  // Save on page unload (refresh, close tab, navigate away)
  useEffect(() => {
    const saveOnUnload = () => {
      const currentSaveId = useGameStore.getState().saveId;
      const currentEngineState = useGameStore.getState().engineState;

      if (!currentSaveId || !currentEngineState) return;

      const token = localStorage.getItem('token');
      if (!token) return;

      // Use fetch with keepalive to allow request to complete after page unloads
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

    const handleBeforeUnload = (event) => {
      saveOnUnload();
      // Note: Modern browsers ignore custom messages, but we still need to set returnValue
      // to trigger the browser's default "unsaved changes" dialog if desired
    };

    const handleVisibilityChange = () => {
      // Save when tab becomes hidden (user switches tabs, minimizes, etc.)
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
  }, []); // Empty deps - we read from store directly to avoid stale closures

  const value = {
    currentGame,
    saves,
    isInGame,
    isLoadingSaves,
    isAutoRestoring,
    loadSaves,
    getLatestSave,
    startNewGame,
    loadGame,
    continueLatestGame,
    saveGame,
    exitToMenu,
    deleteSave
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
