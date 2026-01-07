import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../services/api';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [currentGame, setCurrentGame] = useState(null);
  const [saves, setSaves] = useState([]);
  const [isLoadingSaves, setIsLoadingSaves] = useState(false);

  const isInGame = !!currentGame;

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
      const { save } = await api.createSave({
        name,
        data: {
          startedAt: new Date().toISOString(),
          // Initial game state will go here
          factory: {},
          exploration: {},
          research: {},
          market: {},
          resources: {},
          credits: 1000
        }
      });
      setCurrentGame(save);
      await loadSaves();
      return save;
    } catch (error) {
      console.error('Failed to create new game:', error);
      throw error;
    }
  }, [loadSaves]);

  const loadGame = useCallback(async (saveId) => {
    try {
      const { save } = await api.getSave(saveId);
      setCurrentGame(save);
      return save;
    } catch (error) {
      console.error('Failed to load game:', error);
      throw error;
    }
  }, []);

  const continueLatestGame = useCallback(async () => {
    const latest = getLatestSave();
    if (latest) {
      return loadGame(latest.id);
    }
    return null;
  }, [getLatestSave, loadGame]);

  const saveGame = useCallback(async (data) => {
    if (!currentGame) return null;
    try {
      const { save } = await api.updateSave(currentGame.id, { data });
      setCurrentGame(save);
      return save;
    } catch (error) {
      console.error('Failed to save game:', error);
      throw error;
    }
  }, [currentGame]);

  const exitToMenu = useCallback(() => {
    setCurrentGame(null);
  }, []);

  const deleteSave = useCallback(async (saveId) => {
    try {
      await api.deleteSave(saveId);
      await loadSaves();
      if (currentGame?.id === saveId) {
        setCurrentGame(null);
      }
    } catch (error) {
      console.error('Failed to delete save:', error);
      throw error;
    }
  }, [currentGame, loadSaves]);

  const value = {
    currentGame,
    saves,
    isInGame,
    isLoadingSaves,
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
