import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

// Static imports for content files (following i18n.js pattern)
import releaseNotesEn from '../content/releaseNotes/en.json';
import releaseNotesEs from '../content/releaseNotes/es.json';
import newsEn from '../content/news/en.json';
import newsEs from '../content/news/es.json';

const contentByLanguage = {
  en: {
    releaseNotes: releaseNotesEn,
    news: newsEn,
  },
  es: {
    releaseNotes: releaseNotesEs,
    news: newsEs,
  },
};

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
    const lang = i18n.language?.startsWith('es') ? 'es' : 'en';

    // Get content for the language
    const langContent = contentByLanguage[lang];
    const enContent = contentByLanguage.en;

    // For each content type, use the language version if valid, otherwise fallback to English
    const releaseNotes = isValidContent(langContent?.releaseNotes, 'releaseNotes')
      ? langContent.releaseNotes
      : enContent.releaseNotes;

    const news = isValidContent(langContent?.news, 'news')
      ? langContent.news
      : enContent.news;

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
