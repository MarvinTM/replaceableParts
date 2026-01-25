import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import Slide from '@mui/material/Slide';
import useGameStore from '../../stores/gameStore';

/**
 * Non-blocking tip snackbar that appears at the bottom of the screen.
 * Tips are queued and shown one at a time. User must dismiss to see the next tip.
 */
export default function TipSnackbar() {
  const { t } = useTranslation();
  const tipQueue = useGameStore((state) => state.tipQueue);
  const dismissTip = useGameStore((state) => state.dismissTip);

  const currentTip = tipQueue[0] || null;
  const [visible, setVisible] = useState(false);

  // Animate in when a new tip appears
  useEffect(() => {
    if (currentTip) {
      // Small delay before showing to allow for smooth transition
      const timer = setTimeout(() => setVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [currentTip?.id]);

  const handleDismiss = () => {
    setVisible(false);
    // Wait for exit animation before removing from queue
    setTimeout(() => {
      dismissTip();
    }, 200);
  };

  if (!currentTip) {
    return null;
  }

  return (
    <Slide direction="up" in={visible} mountOnEnter unmountOnExit>
      <Paper
        elevation={6}
        sx={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1400,
          maxWidth: 480,
          minWidth: 320,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'primary.light',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Accent bar at top */}
        <Box
          sx={{
            height: 3,
            bgcolor: 'primary.main',
          }}
        />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.5,
            p: 2,
            pr: 1,
          }}
        >
          {/* Lightbulb icon */}
          <LightbulbIcon
            sx={{
              color: 'warning.main',
              fontSize: 24,
              flexShrink: 0,
              mt: 0.25,
            }}
          />

          {/* Tip content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              color="text.primary"
              sx={{ lineHeight: 1.5 }}
            >
              {t(currentTip.messageKey)}
            </Typography>
          </Box>

          {/* Close button */}
          <IconButton
            size="small"
            onClick={handleDismiss}
            sx={{
              flexShrink: 0,
              color: 'text.secondary',
              '&:hover': {
                color: 'text.primary',
              },
            }}
            aria-label={t('common.close', 'Close')}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    </Slide>
  );
}
