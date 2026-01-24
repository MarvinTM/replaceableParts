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
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LanguageIcon from '@mui/icons-material/Language';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import SaveSelectorDialog from '../components/SaveSelectorDialog';
import SaveSlotDialog from '../components/SaveSlotDialog';

export default function MainMenuPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, isAdmin, isAuthenticated, isGuest, enterGuestMode } = useAuth();
  const {
    saves,
    isLoadingSaves,
    loadSaves,
    getLatestSave,
    startNewGame,
    loadGame,
    hasGuestSave,
    isMigrating,
  } = useGame();

  const [loading, setLoading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [guestOverwriteDialogOpen, setGuestOverwriteDialogOpen] = useState(false);
  const [langAnchorEl, setLangAnchorEl] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadSaves();
    }
  }, [loadSaves, isAuthenticated]);

  const latestSave = getLatestSave();
  const hasSaves = isAuthenticated ? saves.length > 0 : hasGuestSave();

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
    if (isAuthenticated) {
      // Authenticated users: show slot selection dialog
      setSlotDialogOpen(true);
    } else if (isGuest) {
      // Guest users: check if there's an existing save
      if (hasGuestSave()) {
        setGuestOverwriteDialogOpen(true);
      } else {
        await createNewGuestGame();
      }
    } else {
      // Not authenticated or guest - this shouldn't happen from menu
      // but handle it gracefully
      navigate('/login');
    }
  };

  const createNewGuestGame = async () => {
    setLoading(true);
    try {
      await startNewGame('Guest Save');
      navigate('/game');
    } catch (error) {
      console.error('Failed to start new game:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestOverwriteConfirm = async () => {
    setGuestOverwriteDialogOpen(false);
    await createNewGuestGame();
  };

  const handleSelectSlot = async (slotIndex, isOverwrite, existingSaveId) => {
    setSlotDialogOpen(false);
    setLoading(true);
    try {
      const name = `Save ${slotIndex + 1}`;
      await startNewGame(name, existingSaveId);
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
    navigate('/');
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  const handlePlayAsGuest = () => {
    enterGuestMode();
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

  if (isLoadingSaves || isMigrating) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'background.default',
          gap: 2,
        }}
      >
        <CircularProgress />
        {isMigrating && (
          <Typography color="text.secondary">
            {t('saves.migrating')}
          </Typography>
        )}
      </Box>
    );
  }

  // Determine what UI to show
  const showGuestUI = isGuest && !isAuthenticated;
  const showAuthUI = isAuthenticated;
  const showLandingUI = !isGuest && !isAuthenticated;

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
        <IconButton
          onClick={handleLangMenu}
          sx={{ color: 'text.secondary' }}
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
        {isAdmin && (
          <IconButton
            onClick={handleAdmin}
            sx={{ color: 'text.secondary' }}
          >
            <AdminPanelSettingsIcon />
          </IconButton>
        )}
      </Box>

      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              component="img"
              src="/assets/transLogo.png"
              alt={t('app.name')}
              sx={{
                maxWidth: '180px',
                width: '100%',
                height: 'auto',
                mb: 2,
              }}
            />
            <Typography variant="body1" color="text.secondary">
              {showAuthUI
                ? t('menu.welcomeBack', { name: user?.name || 'Player' })
                : showGuestUI
                ? t('menu.welcomeGuest')
                : t('app.tagline')}
            </Typography>
          </Box>

          {/* Guest mode warning */}
          {showGuestUI && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {t('menu.guestSaveWarning')}
            </Alert>
          )}

          {/* Menu buttons */}
          <Stack spacing={2}>
            {/* Landing UI - not logged in, not guest */}
            {showLandingUI && (
              <>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<LoginIcon />}
                  onClick={handleSignIn}
                  fullWidth
                >
                  {t('menu.signIn')}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<PersonIcon />}
                  onClick={handlePlayAsGuest}
                  fullWidth
                >
                  {t('menu.playAsGuest')}
                </Button>
              </>
            )}

            {/* Guest UI */}
            {showGuestUI && (
              <>
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

                <Divider sx={{ my: 1 }} />

                <Button
                  variant="text"
                  size="large"
                  startIcon={<LoginIcon />}
                  onClick={handleSignIn}
                  disabled={loading}
                  fullWidth
                >
                  {t('menu.signIn')}
                </Button>

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
              </>
            )}

            {/* Authenticated UI */}
            {showAuthUI && (
              <>
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
              </>
            )}
          </Stack>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Save selector dialog (for Load Game) */}
      <SaveSelectorDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSelect={handleSelectSave}
        saves={saves}
      />

      {/* Save slot dialog (for New Game - authenticated) */}
      <SaveSlotDialog
        open={slotDialogOpen}
        onClose={() => setSlotDialogOpen(false)}
        onSelectSlot={handleSelectSlot}
        saves={saves}
      />

      {/* Guest overwrite confirmation dialog */}
      <Dialog
        open={guestOverwriteDialogOpen}
        onClose={() => setGuestOverwriteDialogOpen(false)}
      >
        <DialogTitle>{t('menu.newGame')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('saves.guestOverwriteWarning')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGuestOverwriteDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleGuestOverwriteConfirm} color="error">
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
