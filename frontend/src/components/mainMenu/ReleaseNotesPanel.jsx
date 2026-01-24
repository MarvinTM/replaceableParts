import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import HistoryIcon from '@mui/icons-material/History';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BuildIcon from '@mui/icons-material/Build';
import BugReportIcon from '@mui/icons-material/BugReport';
import ReactMarkdown from 'react-markdown';

import InfoPanel from './InfoPanel';
import NewBadge from '../common/NewBadge';
import { useReleaseNotes } from '../../hooks/useContent';
import useReadStatus from '../../hooks/useReadStatus';

// Icons for change types
const CHANGE_ICONS = {
  feature: { icon: AutoAwesomeIcon, color: 'primary.main' },
  improvement: { icon: BuildIcon, color: 'info.main' },
  fix: { icon: BugReportIcon, color: 'success.main' },
};

/**
 * A single release entry component.
 */
function ReleaseEntry({ release, isNew, defaultExpanded = false, onView }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    if (!expanded && isNew && onView) {
      onView();
    }
    setExpanded(!expanded);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Box>
      {/* Header - clickable to expand */}
      <Box
        onClick={toggleExpanded}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          p: 1,
          mx: -1,
          borderRadius: 1,
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={`v${release.version}`}
            size="small"
            color={isNew ? 'primary' : 'default'}
            variant={isNew ? 'filled' : 'outlined'}
            sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}
          />
          {isNew && <NewBadge />}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {formatDate(release.date)}
          </Typography>
          <IconButton size="small" sx={{ p: 0.25 }}>
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>

      {/* Expanded content */}
      <Collapse in={expanded}>
        <Box sx={{ pl: 1, pr: 0.5, pb: 1 }}>
          {/* Highlights */}
          {release.highlights && (
            <Box
              sx={{
                mb: 1.5,
                '& p': {
                  m: 0,
                  fontSize: '0.85rem',
                  color: 'text.secondary',
                  fontStyle: 'italic',
                },
              }}
            >
              <ReactMarkdown>{release.highlights}</ReactMarkdown>
            </Box>
          )}

          {/* Changes list */}
          <List dense disablePadding>
            {release.changes.map((change, index) => {
              const changeConfig = CHANGE_ICONS[change.type] || CHANGE_ICONS.feature;
              const IconComponent = changeConfig.icon;

              return (
                <ListItem key={index} disablePadding sx={{ alignItems: 'flex-start', mb: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 28, mt: 0.5 }}>
                    <IconComponent sx={{ fontSize: 16, color: changeConfig.color }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          '& p': { m: 0, fontSize: '0.8rem', lineHeight: 1.4 },
                          '& strong': { fontWeight: 600 },
                        }}
                      >
                        <ReactMarkdown>{change.text}</ReactMarkdown>
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Collapse>
    </Box>
  );
}

/**
 * Release notes panel for the main menu.
 */
export default function ReleaseNotesPanel() {
  const { t } = useTranslation();
  const releaseNotes = useReleaseNotes();
  const { hasNewReleases, isReleaseNew, markReleasesAsRead } = useReadStatus(releaseNotes, null);

  if (!releaseNotes?.releases?.length) {
    return (
      <InfoPanel
        title={t('mainMenu.releaseNotes')}
        icon={<HistoryIcon />}
        side="right"
        hasNew={false}
      >
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {t('mainMenu.noReleaseNotes')}
        </Typography>
      </InfoPanel>
    );
  }

  return (
    <InfoPanel
      title={t('mainMenu.releaseNotes')}
      icon={<HistoryIcon />}
      side="right"
      hasNew={hasNewReleases}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {releaseNotes.releases.map((release, index) => (
          <Box key={release.version}>
            <ReleaseEntry
              release={release}
              isNew={isReleaseNew(release.version)}
              defaultExpanded={index === 0}
              onView={index === 0 ? markReleasesAsRead : undefined}
            />
            {index < releaseNotes.releases.length - 1 && <Divider sx={{ my: 0.5 }} />}
          </Box>
        ))}
      </Box>
    </InfoPanel>
  );
}
