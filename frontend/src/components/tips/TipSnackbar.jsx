import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import Slide from '@mui/material/Slide';
import useGameStore from '../../stores/gameStore';

/**
 * Non-blocking tip snackbar that appears at the bottom of the screen.
 * Tips are queued and can be navigated with arrows when multiple tips exist.
 * User must dismiss each tip to mark it as shown.
 */
export default function TipSnackbar() {
  const { t } = useTranslation();
  const tipQueue = useGameStore((state) => state.tipQueue);
  const dismissAllTips = useGameStore((state) => state.dismissAllTips);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  const tipCount = tipQueue.length;
  const hasMultipleTips = tipCount > 1;
  const currentTip = tipQueue[currentIndex] || null;

  // Reset index if it goes out of bounds (e.g., after dismissing)
  useEffect(() => {
    if (currentIndex >= tipCount && tipCount > 0) {
      setCurrentIndex(tipCount - 1);
    }
  }, [tipCount, currentIndex]);

  // Animate in when tips appear
  useEffect(() => {
    if (tipCount > 0) {
      const timer = setTimeout(() => setVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      setCurrentIndex(0);
    }
  }, [tipCount > 0]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < tipCount - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleDismiss = () => {
    // Dismiss all tips at once
    dismissAllTips();
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
          maxWidth: 500,
          minWidth: 340,
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

            {/* Navigation row - only show when multiple tips */}
            {hasMultipleTips && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  mt: 1.5,
                  pt: 1,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <IconButton
                  size="small"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: 'text.primary' },
                    '&.Mui-disabled': { color: 'action.disabled' },
                  }}
                  aria-label={t('common.previous', 'Previous')}
                >
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ minWidth: 40, textAlign: 'center' }}
                >
                  {currentIndex + 1} / {tipCount}
                </Typography>

                <IconButton
                  size="small"
                  onClick={handleNext}
                  disabled={currentIndex === tipCount - 1}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: 'text.primary' },
                    '&.Mui-disabled': { color: 'action.disabled' },
                  }}
                  aria-label={t('common.next', 'Next')}
                >
                  <ChevronRightIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
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
