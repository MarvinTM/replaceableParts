import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import LanguageIcon from '@mui/icons-material/Language';
import { keyframes } from '@mui/system';
import { loadAllAssets, areAssetsLoaded } from '../services/assetLoaderService';
import { defaultRules } from '../engine/defaultRules';
import LoadingProgress from '../components/LoadingProgress';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
`;

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [langAnchorEl, setLangAnchorEl] = useState(null);
  const [assetsLoading, setAssetsLoading] = useState(!areAssetsLoaded());
  const [loadProgress, setLoadProgress] = useState({ loaded: 0, total: 0 });

  const handleContinue = useCallback(() => {
    // Only allow navigation if assets are loaded
    if (assetsLoading) return;
    navigate('/menu');
  }, [navigate, assetsLoading]);

  // Load assets on mount
  useEffect(() => {
    // Skip if already loaded
    if (areAssetsLoaded()) {
      setAssetsLoading(false);
      return;
    }

    loadAllAssets(defaultRules, (progress) => {
      setLoadProgress(progress);
    }).then(() => {
      setAssetsLoading(false);
    });
  }, []);

  // Handle click anywhere
  const handleClick = useCallback((e) => {
    // Don't trigger if clicking on language menu
    if (e.target.closest('[data-lang-menu]')) {
      return;
    }
    // Don't trigger if still loading
    if (assetsLoading) return;
    handleContinue();
  }, [handleContinue, assetsLoading]);

  // Handle any key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input or if menu is open
      if (e.target.tagName === 'INPUT' || langAnchorEl) {
        return;
      }
      // Ignore if still loading
      if (assetsLoading) return;
      handleContinue();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleContinue, langAnchorEl, assetsLoading]);

  const handleLangMenu = (event) => {
    event.stopPropagation();
    setLangAnchorEl(event.currentTarget);
  };

  const handleLangClose = () => {
    setLangAnchorEl(null);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    handleLangClose();
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'background.default',
        cursor: assetsLoading ? 'default' : 'pointer',
        userSelect: 'none',
        p: 2,
        position: 'relative',
      }}
    >
      {/* Language selector */}
      <Box
        data-lang-menu
        sx={{ position: 'absolute', top: 16, right: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        <IconButton
          onClick={handleLangMenu}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              color: 'text.primary',
            },
          }}
        >
          <LanguageIcon />
        </IconButton>
        <Menu
          anchorEl={langAnchorEl}
          open={Boolean(langAnchorEl)}
          onClose={handleLangClose}
        >
          <MenuItem onClick={() => changeLanguage('en')}>
            {t('language.en')}
          </MenuItem>
          <MenuItem onClick={() => changeLanguage('es')}>
            {t('language.es')}
          </MenuItem>
        </Menu>
      </Box>

      {/* Main content */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: `${fadeIn} 1s ease-out`,
        }}
      >
        {/* Logo */}
        <Box
          component="img"
          src="/assets/bigLogo.png"
          alt={t('app.name')}
          sx={{
            maxWidth: '500px',
            width: '90%',
            height: 'auto',
            mb: 3,
          }}
        />

        {/* Tagline */}
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{
            textAlign: 'center',
            animation: `${fadeIn} 1s ease-out 0.3s both`,
          }}
        >
          {t('app.tagline')}
        </Typography>
      </Box>

      {/* Loading progress or click to continue prompt */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 48,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {assetsLoading ? (
          <LoadingProgress progress={loadProgress} />
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              textAlign: 'center',
              animation: `${fadeIn} 0.5s ease-out, ${pulse} 2s ease-in-out 0.5s infinite`,
            }}
          >
            {t('landing.clickToContinue')}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
