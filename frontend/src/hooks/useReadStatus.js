import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEYS = {
  lastSeenVersion: 'replaceableParts_lastSeenVersion',
  readNewsIds: 'replaceableParts_readNewsIds',
};

/**
 * Hook to track read/unread status for release notes and news.
 * Persists to localStorage.
 */
export function useReadStatus(releaseNotes, news) {
  // Release notes state
  const [lastSeenVersion, setLastSeenVersion] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.lastSeenVersion) || null;
    } catch {
      return null;
    }
  });

  // News state
  const [readNewsIds, setReadNewsIds] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.readNewsIds);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist lastSeenVersion to localStorage
  useEffect(() => {
    try {
      if (lastSeenVersion) {
        localStorage.setItem(STORAGE_KEYS.lastSeenVersion, lastSeenVersion);
      }
    } catch (e) {
      console.warn('Failed to save lastSeenVersion to localStorage:', e);
    }
  }, [lastSeenVersion]);

  // Persist readNewsIds to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.readNewsIds, JSON.stringify(readNewsIds));
    } catch (e) {
      console.warn('Failed to save readNewsIds to localStorage:', e);
    }
  }, [readNewsIds]);

  // Get latest version from release notes
  const latestVersion = useMemo(() => {
    return releaseNotes?.releases?.[0]?.version || null;
  }, [releaseNotes]);

  // Check if there are new releases
  const hasNewReleases = useMemo(() => {
    if (!latestVersion || !lastSeenVersion) {
      // If never seen any version, there are new releases (if any exist)
      return latestVersion !== null && lastSeenVersion === null;
    }
    // Simple string comparison works for semantic versioning with consistent format
    return latestVersion > lastSeenVersion;
  }, [latestVersion, lastSeenVersion]);

  // Count new releases
  const newReleasesCount = useMemo(() => {
    if (!releaseNotes?.releases || !lastSeenVersion) {
      return lastSeenVersion === null ? (releaseNotes?.releases?.length || 0) : 0;
    }
    return releaseNotes.releases.filter(r => r.version > lastSeenVersion).length;
  }, [releaseNotes, lastSeenVersion]);

  // Mark releases as read (set lastSeenVersion to latest)
  const markReleasesAsRead = useCallback(() => {
    if (latestVersion) {
      setLastSeenVersion(latestVersion);
    }
  }, [latestVersion]);

  // Check if a specific release is new
  const isReleaseNew = useCallback((version) => {
    if (!lastSeenVersion) return true;
    return version > lastSeenVersion;
  }, [lastSeenVersion]);

  // Check if a news item is read
  const isNewsItemRead = useCallback((id) => {
    return readNewsIds.includes(id);
  }, [readNewsIds]);

  // Check if there are unread news items
  const hasUnreadNews = useMemo(() => {
    if (!news?.items) return false;
    return news.items.some(item => !readNewsIds.includes(item.id));
  }, [news, readNewsIds]);

  // Count unread news items
  const unreadNewsCount = useMemo(() => {
    if (!news?.items) return 0;
    return news.items.filter(item => !readNewsIds.includes(item.id)).length;
  }, [news, readNewsIds]);

  // Mark a news item as read
  const markNewsAsRead = useCallback((id) => {
    setReadNewsIds(prev => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }, []);

  // Mark all news as read
  const markAllNewsAsRead = useCallback(() => {
    if (news?.items) {
      setReadNewsIds(news.items.map(item => item.id));
    }
  }, [news]);

  return {
    // Release notes
    lastSeenVersion,
    latestVersion,
    hasNewReleases,
    newReleasesCount,
    markReleasesAsRead,
    isReleaseNew,

    // News
    readNewsIds,
    isNewsItemRead,
    hasUnreadNews,
    unreadNewsCount,
    markNewsAsRead,
    markAllNewsAsRead,
  };
}

export default useReadStatus;
