import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import FactoryIcon from '@mui/icons-material/Factory';
import BoltIcon from '@mui/icons-material/Bolt';
import ExploreIcon from '@mui/icons-material/Explore';
import ScienceIcon from '@mui/icons-material/Science';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import TerrainIcon from '@mui/icons-material/Terrain';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

/**
 * Tutorial overlay that shows when starting a new game.
 * Displays 5 screens explaining the core game mechanics.
 */
export default function TutorialOverlay({ open, onComplete }) {
  const { t } = useTranslation();
  const [currentScreen, setCurrentScreen] = useState(0);

  const screens = [
    {
      id: 'factory',
      icon: FactoryIcon,
      secondaryIcon: PrecisionManufacturingIcon,
      title: t('tutorial.factory.title'),
      description: t('tutorial.factory.description'),
      hint: t('tutorial.factory.hint'),
      gradient: 'linear-gradient(180deg, rgba(139, 90, 43, 0.2) 0%, rgba(139, 90, 43, 0) 60%)',
      iconColor: 'primary.main',
    },
    {
      id: 'power',
      icon: BoltIcon,
      title: t('tutorial.power.title'),
      description: t('tutorial.power.description'),
      hint: t('tutorial.power.hint'),
      gradient: 'linear-gradient(180deg, rgba(46, 125, 50, 0.2) 0%, rgba(46, 125, 50, 0) 60%)',
      iconColor: 'success.main',
    },
    {
      id: 'exploration',
      icon: ExploreIcon,
      secondaryIcon: TerrainIcon,
      title: t('tutorial.exploration.title'),
      description: t('tutorial.exploration.description'),
      hint: t('tutorial.exploration.hint'),
      gradient: 'linear-gradient(180deg, rgba(205, 133, 63, 0.2) 0%, rgba(205, 133, 63, 0) 60%)',
      iconColor: 'secondary.main',
    },
    {
      id: 'research',
      icon: ScienceIcon,
      title: t('tutorial.research.title'),
      description: t('tutorial.research.description'),
      hint: t('tutorial.research.hint'),
      gradient: 'linear-gradient(180deg, rgba(156, 39, 176, 0.2) 0%, rgba(156, 39, 176, 0) 60%)',
      iconColor: '#9c27b0',
    },
    {
      id: 'market',
      icon: StorefrontIcon,
      secondaryIcon: AccountBalanceIcon,
      title: t('tutorial.market.title'),
      description: t('tutorial.market.description'),
      hint: t('tutorial.market.hint'),
      gradient: 'linear-gradient(180deg, rgba(184, 134, 11, 0.2) 0%, rgba(184, 134, 11, 0) 60%)',
      iconColor: 'warning.main',
    },
  ];

  const currentScreenData = screens[currentScreen];
  const isFirstScreen = currentScreen === 0;
  const isLastScreen = currentScreen === screens.length - 1;

  const handleNext = () => {
    if (isLastScreen) {
      onComplete();
    } else {
      setCurrentScreen((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstScreen) {
      setCurrentScreen((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const IconComponent = currentScreenData.icon;
  const SecondaryIconComponent = currentScreenData.secondaryIcon;

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: 500,
          bgcolor: 'background.paper',
          backgroundImage: currentScreenData.gradient,
          overflow: 'hidden',
        },
      }}
    >
      {/* Skip button */}
      <IconButton
        onClick={handleSkip}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1,
          color: 'text.secondary',
        }}
        aria-label={t('tutorial.skip')}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent sx={{ p: 0 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 460,
            py: 4,
            px: 3,
          }}
        >
          {/* Icon section */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              mb: 2,
            }}
          >
            <IconComponent
              sx={{
                fontSize: 100,
                color: currentScreenData.iconColor,
                animation: 'float 3s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-10px)' },
                },
              }}
            />
            {SecondaryIconComponent && (
              <SecondaryIconComponent
                sx={{
                  fontSize: 60,
                  color: currentScreenData.iconColor,
                  opacity: 0.6,
                  animation: 'float 3s ease-in-out infinite 0.5s',
                }}
              />
            )}
          </Box>

          {/* Content section */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              maxWidth: 500,
              gap: 2,
            }}
          >
            <Typography
              variant="h4"
              fontWeight="bold"
              color="text.primary"
              sx={{ mb: 1 }}
            >
              {currentScreenData.title}
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ lineHeight: 1.7, fontSize: '1.1rem' }}
            >
              {currentScreenData.description}
            </Typography>

            {currentScreenData.hint && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  {currentScreenData.hint}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Progress dots */}
          <Box sx={{ display: 'flex', gap: 1, my: 3 }}>
            {screens.map((_, index) => (
              <Box
                key={index}
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: index === currentScreen ? 'primary.main' : 'divider',
                  transition: 'background-color 0.3s ease',
                  cursor: 'pointer',
                }}
                onClick={() => setCurrentScreen(index)}
              />
            ))}
          </Box>

          {/* Navigation buttons */}
          <Box sx={{ display: 'flex', gap: 2, width: '100%', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={handlePrev}
              disabled={isFirstScreen}
              startIcon={<ArrowBackIcon />}
              sx={{ minWidth: 120 }}
            >
              {t('tutorial.previous')}
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={!isLastScreen && <ArrowForwardIcon />}
              sx={{ minWidth: 120 }}
            >
              {isLastScreen ? t('tutorial.startPlaying') : t('tutorial.next')}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
