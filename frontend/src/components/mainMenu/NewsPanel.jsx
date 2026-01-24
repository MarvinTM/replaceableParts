import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import ReactMarkdown from 'react-markdown';

import InfoPanel from './InfoPanel';
import NewBadge from '../common/NewBadge';
import { useNews } from '../../hooks/useContent';
import useReadStatus from '../../hooks/useReadStatus';

// Category colors
const CATEGORY_COLORS = {
  update: 'primary',
  event: 'secondary',
  announcement: 'info',
  tip: 'success',
};

/**
 * A single news item component.
 */
function NewsItem({ item, isNew, onRead }) {
  const { t } = useTranslation();

  const handleClick = () => {
    if (isNew && onRead) {
      onRead();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        cursor: isNew ? 'pointer' : 'default',
        '&:hover': isNew ? { bgcolor: 'action.hover' } : {},
        borderRadius: 1,
        p: 1,
        mx: -1,
      }}
    >
      {/* Header row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Chip
          label={t(`news.categories.${item.category}`)}
          size="small"
          color={CATEGORY_COLORS[item.category] || 'default'}
          sx={{ height: 20, fontSize: '0.7rem' }}
        />
        {isNew && <NewBadge />}
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
          {formatDate(item.date)}
        </Typography>
      </Box>

      {/* Title */}
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        {item.title}
      </Typography>

      {/* Content (Markdown) */}
      <Box
        sx={{
          '& p': {
            m: 0,
            mb: 1,
            fontSize: '0.85rem',
            color: 'text.secondary',
            lineHeight: 1.5,
          },
          '& p:last-child': { mb: 0 },
          '& strong': { color: 'text.primary', fontWeight: 600 },
          '& em': { fontStyle: 'italic' },
          '& a': { color: 'primary.main' },
        }}
      >
        <ReactMarkdown>{item.content}</ReactMarkdown>
      </Box>
    </Box>
  );
}

/**
 * News panel for the main menu.
 */
export default function NewsPanel() {
  const { t } = useTranslation();
  const news = useNews();
  const { isNewsItemRead, hasUnreadNews, markNewsAsRead } = useReadStatus(null, news);

  if (!news?.items?.length) {
    return (
      <InfoPanel
        title={t('mainMenu.news')}
        icon={<NewspaperIcon />}
        side="left"
        hasNew={false}
      >
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {t('mainMenu.noNews')}
        </Typography>
      </InfoPanel>
    );
  }

  return (
    <InfoPanel
      title={t('mainMenu.news')}
      icon={<NewspaperIcon />}
      side="left"
      hasNew={hasUnreadNews}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {news.items.map((item, index) => (
          <Box key={item.id}>
            <NewsItem
              item={item}
              isNew={!isNewsItemRead(item.id)}
              onRead={() => markNewsAsRead(item.id)}
            />
            {index < news.items.length - 1 && <Divider sx={{ my: 1 }} />}
          </Box>
        ))}
      </Box>
    </InfoPanel>
  );
}
