import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

// Eager-load all JSON content files so Vite bundles them and we can map by code
const releaseNotesFiles = import.meta.glob('../content/releaseNotes/*.json', { eager: true });
const newsFiles = import.meta.glob('../content/news/*.json', { eager: true });

function buildContentMap(files) {
  return Object.entries(files).reduce((acc, [path, mod]) => {
    const match = path.match(/\/([a-z]{2})\.json$/i);
    if (!match) return acc;
    const code = match[1].toLowerCase();
    acc[code] = mod.default ?? mod;
    return acc;
  }, {});
}

const releaseNotesByLang = buildContentMap(releaseNotesFiles);
const newsByLang = buildContentMap(newsFiles);

/**
 * Check if content is valid (exists and has items)
 */
function isValidContent(content, key) {
  if (!content) return false;
  if (key === 'releaseNotes') {
    return content.releases && content.releases.length > 0;
  }
  if (key === 'news') {
    return content.items && content.items.length > 0;
  }
  return false;
}

/**
 * Hook to load content based on current language.
 * Falls back to English if the current language content is not available or empty.
 */
export function useContent() {
  const { i18n } = useTranslation();

  const content = useMemo(() => {
    // Determine language (handle variants like 'es-ES' -> 'es')
    const lng = i18n.language || 'en';
    const lang = (lng.split('-')[0] || 'en').toLowerCase();

    // Get content maps
    const langRelease = releaseNotesByLang[lang];
    const langNews = newsByLang[lang];
    const enRelease = releaseNotesByLang.en;
    const enNews = newsByLang.en;

    // For each content type, use the language version if valid, otherwise fallback to English
    const releaseNotes = isValidContent(langRelease, 'releaseNotes') ? langRelease : enRelease;

    const news = isValidContent(langNews, 'news') ? langNews : enNews;

    return {
      releaseNotes,
      news,
    };
  }, [i18n.language]);

  return content;
}

/**
 * Hook to get only release notes content.
 */
export function useReleaseNotes() {
  const { releaseNotes } = useContent();
  return releaseNotes;
}

/**
 * Hook to get only news content.
 */
export function useNews() {
  const { news } = useContent();
  return news;
}

export default useContent;
