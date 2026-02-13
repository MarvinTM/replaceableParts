import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import useGameStore from '../../stores/gameStore';
import { useGame } from '../../contexts/GameContext';

const GOLD = '#FFD700';

/**
 * Full-screen victory celebration when the Singularity Engine prototype is completed.
 * Watches engineState.victory and shows once, with a "Continue Playing" dismiss.
 */
export default function VictoryScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { exitToMenu } = useGame();
  const victory = useGameStore((state) => state.engineState?.victory);
  const [dismissed, setDismissed] = useState(false);
  const [returningToMenu, setReturningToMenu] = useState(false);

  // Reset dismissed if victory is cleared (new game)
  useEffect(() => {
    if (!victory) {
      setDismissed(false);
      setReturningToMenu(false);
    }
  }, [victory]);

  const show = victory?.achieved && !dismissed;

  const handleBackToMenu = async () => {
    if (returningToMenu) return;
    setReturningToMenu(true);
    try {
      await exitToMenu();
      navigate('/menu');
    } catch (error) {
      console.error('Failed to return to main menu from victory screen:', error);
      setReturningToMenu(false);
    }
  };

  if (!show) return null;

  return (
    <Dialog
      open
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: 450,
          bgcolor: '#0d0a00',
          backgroundImage: `
            radial-gradient(ellipse at 50% 0%, rgba(255, 215, 0, 0.25) 0%, transparent 60%),
            radial-gradient(ellipse at 50% 100%, rgba(255, 179, 0, 0.10) 0%, transparent 50%)
          `,
          border: `1px solid rgba(255, 215, 0, 0.4)`,
          boxShadow: '0 0 80px rgba(255, 215, 0, 0.15), 0 0 40px rgba(255, 179, 0, 0.10)',
          overflow: 'hidden',
          position: 'relative',
        }
      }}
    >
      {/* Sparkle particles */}
      <Box sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        '& .sparkle': {
          position: 'absolute',
          width: 4,
          height: 4,
          borderRadius: '50%',
          bgcolor: GOLD,
          animation: 'sparkleFloat 3s ease-in-out infinite',
          opacity: 0,
        },
        '@keyframes sparkleFloat': {
          '0%': { opacity: 0, transform: 'translateY(0) scale(0.5)' },
          '20%': { opacity: 1 },
          '80%': { opacity: 0.6 },
          '100%': { opacity: 0, transform: 'translateY(-120px) scale(0.2)' },
        },
      }}>
        {Array.from({ length: 20 }, (_, i) => (
          <Box
            key={i}
            className="sparkle"
            sx={{
              left: `${5 + Math.random() * 90}%`,
              bottom: `${Math.random() * 30}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              width: 2 + Math.random() * 4,
              height: 2 + Math.random() * 4,
            }}
          />
        ))}
      </Box>

      <DialogContent>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          gap: 3,
          py: 4,
          position: 'relative',
          zIndex: 1,
        }}>
          <AutoAwesomeIcon sx={{
            fontSize: 120,
            color: GOLD,
            filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))',
            animation: 'victoryPulse 2s ease-in-out infinite',
            '@keyframes victoryPulse': {
              '0%, 100%': { transform: 'scale(1) rotate(0deg)', opacity: 1 },
              '50%': { transform: 'scale(1.15) rotate(5deg)', opacity: 0.9 },
            },
          }} />

          <Typography
            variant="h3"
            fontWeight="bold"
            textAlign="center"
            sx={{
              color: GOLD,
              textShadow: '0 0 30px rgba(255, 215, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.5)',
            }}
          >
            {t('victory.title', 'Technological Singularity Achieved!')}
          </Typography>

          <Typography
            variant="body1"
            textAlign="center"
            sx={{
              color: 'rgba(255, 245, 220, 0.85)',
              maxWidth: 420,
              lineHeight: 1.7,
            }}
          >
            {t('victory.description', 'From humble wooden planks to the pinnacle of technology — you have built the Singularity Engine and transcended the limits of human engineering. The future is now yours to shape.')}
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ mt: 2, width: { xs: '100%', sm: 'auto' } }}
          >
            <Button
              variant="outlined"
              size="large"
              onClick={handleBackToMenu}
              disabled={returningToMenu}
              sx={{
                borderColor: 'rgba(255, 215, 0, 0.6)',
                color: 'rgba(255, 235, 170, 0.95)',
                fontWeight: 700,
                '&:hover': {
                  borderColor: GOLD,
                  bgcolor: 'rgba(255, 215, 0, 0.08)',
                },
              }}
            >
              {returningToMenu ? (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} sx={{ color: 'inherit' }} />
                  {t('victory.returningToMenu', 'Returning to Main Menu...')}
                </Box>
              ) : (
                t('victory.backToMenu', 'Back to Main Menu')
              )}
            </Button>

            <Button
              variant="contained"
              size="large"
              onClick={() => setDismissed(true)}
              disabled={returningToMenu}
              sx={{
                px: 4,
                py: 1.5,
                bgcolor: GOLD,
                color: '#000',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                '&:hover': {
                  bgcolor: '#FFC400',
                },
              }}
            >
              {t('victory.continuePlaying', 'Continue Playing')}
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
