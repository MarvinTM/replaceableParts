import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LanguageIcon from '@mui/icons-material/Language';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import SaveSelectorDialog from '../components/SaveSelectorDialog';

export default function MainMenuPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const { saves, isLoadingSaves, loadSaves, getLatestSave, startNewGame, loadGame } = useGame();

  const [loading, setLoading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [langAnchorEl, setLangAnchorEl] = useState(null);

  useEffect(() => {
    loadSaves();
  }, [loadSaves]);

  const latestSave = getLatestSave();
  const hasSaves = saves.length > 0;

  const handleContinue = async () => {
    if (!latestSave) return;
    setLoading(true);
    try {
      await loadGame(latestSave.id);
      navigate('/game');
    } catch (error) {
      console.error('Failed to continue game:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewGame = async () => {
    setLoading(true);
    try {
      await startNewGame();
      navigate('/game');
    } catch (error) {
      console.error('Failed to start new game:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadGame = () => {
    setSaveDialogOpen(true);
  };

  const handleSelectSave = async (save) => {
    setSaveDialogOpen(false);
    setLoading(true);
    try {
      await loadGame(save.id);
      navigate('/game');
    } catch (error) {
      console.error('Failed to load game:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleAdmin = () => {
    navigate('/admin');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleLangMenu = (event) => {
    setLangAnchorEl(event.currentTarget);
  };

  const handleLangClose = () => {
    setLangAnchorEl(null);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    handleLangClose();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoadingSaves) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'background.default',
        p: 2
      }}
    >
      {/* Top bar with language and admin */}
      <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
        <IconButton color="inherit" onClick={handleLangMenu}>
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
        {isAdmin && (
          <IconButton color="inherit" onClick={handleAdmin}>
            <AdminPanelSettingsIcon />
          </IconButton>
        )}
      </Box>

      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom>
              {t('app.name')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('menu.welcomeBack', { name: user?.name || 'Player' })}
            </Typography>
          </Box>

          {/* Menu buttons */}
          <Stack spacing={2}>
            {hasSaves && (
              <>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleContinue}
                  disabled={loading}
                  fullWidth
                >
                  {t('menu.continue')}
                </Button>
                {latestSave && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textAlign: 'center', mt: -1 }}
                  >
                    {latestSave.name} - {formatDate(latestSave.updatedAt)}
                  </Typography>
                )}
              </>
            )}

            <Button
              variant={hasSaves ? 'outlined' : 'contained'}
              size="large"
              startIcon={<AddIcon />}
              onClick={handleNewGame}
              disabled={loading}
              fullWidth
            >
              {t('menu.newGame')}
            </Button>

            {hasSaves && (
              <Button
                variant="outlined"
                size="large"
                startIcon={<FolderOpenIcon />}
                onClick={handleLoadGame}
                disabled={loading}
                fullWidth
              >
                {t('menu.loadGame')}
              </Button>
            )}

            <Divider sx={{ my: 1 }} />

            <Button
              variant="text"
              size="large"
              startIcon={<SettingsIcon />}
              onClick={handleSettings}
              disabled={loading}
              fullWidth
            >
              {t('menu.settings')}
            </Button>

            <Button
              variant="text"
              size="large"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              disabled={loading}
              color="inherit"
              fullWidth
            >
              {t('nav.logout')}
            </Button>
          </Stack>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </CardContent>
      </Card>

      <SaveSelectorDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSelect={handleSelectSave}
        saves={saves}
      />
    </Box>
  );
}
