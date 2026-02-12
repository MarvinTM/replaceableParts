import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api, AUTH_EXPIRED_EVENT } from '../services/api';

const AuthContext = createContext(null);

const GUEST_MODE_KEY = 'replaceableParts-guestMode';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Track if we just transitioned from guest to authenticated (for migration)
  const wasGuestRef = useRef(false);
  const [wasGuestBeforeLogin, setWasGuestBeforeLogin] = useState(false);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'ADMIN';

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const guestMode = localStorage.getItem(GUEST_MODE_KEY);

    if (token) {
      api.getCurrentUser()
        .then(({ user }) => setUser(user))
        .catch(() => {
          localStorage.removeItem('token');
          // If auth failed but guest mode was on, restore guest mode
          if (guestMode === 'true') {
            setIsGuest(true);
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      // Check if was in guest mode
      if (guestMode === 'true') {
        setIsGuest(true);
      }
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleAuthExpired = () => {
      localStorage.removeItem('token');
      setUser(null);
      setSessionExpired(true);
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, []);

  const enterGuestMode = useCallback(() => {
    localStorage.setItem(GUEST_MODE_KEY, 'true');
    setSessionExpired(false);
    setIsGuest(true);
  }, []);

  const exitGuestMode = useCallback(() => {
    localStorage.removeItem(GUEST_MODE_KEY);
    setIsGuest(false);
  }, []);

  const login = useCallback(async (credential) => {
    setError(null);

    // Track if user was a guest before login (for migration)
    const wasGuest = isGuest;
    wasGuestRef.current = wasGuest;

    try {
      const { token, user } = await api.loginWithGoogle(credential);
      localStorage.setItem('token', token);
      setSessionExpired(false);

      // Clear guest mode since we're now authenticated
      localStorage.removeItem(GUEST_MODE_KEY);
      setIsGuest(false);

      setUser(user);

      // Set flag so GameContext can check and migrate if needed
      if (wasGuest) {
        setWasGuestBeforeLogin(true);
      }

      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isGuest]);

  // Function for GameContext to clear the migration flag after handling it
  const clearWasGuestFlag = useCallback(() => {
    setWasGuestBeforeLogin(false);
    wasGuestRef.current = false;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('token');
      setSessionExpired(false);
      setUser(null);
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    await api.deleteProfile();
    localStorage.removeItem('token');
    setSessionExpired(false);
    setUser(null);
  }, []);

  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { user } = await api.getCurrentUser();
      setUser(user);
      return user;
    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem('token');
        setUser(null);
      }
      throw err;
    }
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    isGuest,
    sessionExpired,
    error,
    login,
    logout,
    deleteAccount,
    refreshUser,
    enterGuestMode,
    exitGuestMode,
    wasGuestBeforeLogin,
    clearWasGuestFlag,
    clearSessionExpired,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
