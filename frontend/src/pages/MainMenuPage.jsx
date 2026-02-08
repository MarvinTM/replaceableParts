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
import TextField from '@mui/material/TextField';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SettingsIcon from '@mui/icons-material/Settings';
import FeedbackIcon from '@mui/icons-material/Feedback';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LanguageMenu from '../components/common/LanguageMenu';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import SaveSelectorDialog from '../components/SaveSelectorDialog';
import SaveSlotDialog from '../components/SaveSlotDialog';
import SaveImportDialog from '../components/SaveImportDialog';
import FeedbackDialog from '../components/FeedbackDialog';
import InviteFriendDialog from '../components/InviteFriendDialog';
import NewsPanel from '../components/mainMenu/NewsPanel';
import ReleaseNotesPanel from '../components/mainMenu/ReleaseNotesPanel';

export default function MainMenuPage() {
  const { t } = useTranslation();
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
    exportSavePayload,
    importSaveIntoSlot
  } = useGame();

  const [loading, setLoading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [guestNameDialogOpen, setGuestNameDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [slotDialogMode, setSlotDialogMode] = useState('new');
  const [pendingImportPayload, setPendingImportPayload] = useState(null);
  const [pendingImportSuggestedName, setPendingImportSuggestedName] = useState('');
  const [guestGameName, setGuestGameName] = useState('');
  const [isGuestOverwrite, setIsGuestOverwrite] = useState(false);

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
      await loadGame(latestSave.id, { reason: 'continue_button' });
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
      setSlotDialogMode('new');
      setSlotDialogOpen(true);
    } else if (isGuest) {
      // Guest users: show naming dialog
      setIsGuestOverwrite(hasGuestSave());
      setGuestGameName('');
      setGuestNameDialogOpen(true);
    } else {
      // Not authenticated or guest - this shouldn't happen from menu
      // but handle it gracefully
      navigate('/login');
    }
  };

  const handleGuestNameConfirm = async () => {
    setGuestNameDialogOpen(false);
    setLoading(true);
    try {
      const name = guestGameName.trim() || t('saves.defaultGameName');
      await startNewGame(name);
      navigate('/game');
    } catch (error) {
      console.error('Failed to start new game:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleGuestNameConfirm();
    }
  };

  const handleSelectSlot = async (slotIndex, isOverwrite, existingSaveId, name) => {
    setSlotDialogOpen(false);
    setLoading(true);
    try {
      if (slotDialogMode === 'import') {
        if (!pendingImportPayload) {
          throw new Error('No import payload selected');
        }
        await importSaveIntoSlot({
          targetSaveId: existingSaveId || null,
          name,
          payload: pendingImportPayload
        });
        setPendingImportPayload(null);
        setPendingImportSuggestedName('');
      } else {
        await startNewGame(name, existingSaveId);
        navigate('/game');
      }
    } catch (error) {
      if (slotDialogMode === 'import') {
        console.error('Failed to import save:', error);
      } else {
        console.error('Failed to start new game:', error);
      }
    } finally {
      setLoading(false);
      setSlotDialogMode('new');
    }
  };

  const handleLoadGame = () => {
    setSaveDialogOpen(true);
  };

  const handleImportGame = () => {
    setImportDialogOpen(true);
  };

  const handleImportReady = ({ payload, suggestedName }) => {
    setImportDialogOpen(false);
    setPendingImportPayload(payload);
    setPendingImportSuggestedName(suggestedName || '');
    setSlotDialogMode('import');
    setSlotDialogOpen(true);
  };

  const handleSelectSave = async (save) => {
    setSaveDialogOpen(false);
    setLoading(true);
    try {
      await loadGame(save.id, { reason: 'load_selector' });
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

  const downloadPayload = (fileName, payload) => {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'save-export.rpsave.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportSave = async (save) => {
    setLoading(true);
    try {
      const response = await exportSavePayload(save.id);
      downloadPayload(response.fileName, response.payload);
    } catch (error) {
      console.error('Failed to export save:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = () => {
    setFeedbackDialogOpen(true);
  };

  const handleInvite = () => {
    setInviteDialogOpen(true);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSlotDialogClose = () => {
    setSlotDialogOpen(false);
    if (slotDialogMode === 'import') {
      setPendingImportPayload(null);
      setPendingImportSuggestedName('');
    }
    setSlotDialogMode('new');
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'background.default',
        p: 2,
        gap: 3,
      }}
    >
      {/* Top bar with language and admin */}
      <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
        <LanguageMenu color="text.secondary" />
        {isAdmin && (
          <IconButton
            onClick={handleAdmin}
            sx={{ color: 'text.secondary' }}
          >
            <AdminPanelSettingsIcon />
          </IconButton>
        )}
      </Box>

      {/* Left Panel - News (hidden on small screens) */}
      <Box sx={{ display: { xs: 'none', lg: 'block' }, alignSelf: 'center' }}>
        <NewsPanel />
      </Box>

      {/* Center - Main Menu Card */}
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              component="img"
              src="/assets/transLogo.png"
              alt={t('app.name')}
              sx={{
                maxWidth: '400px',
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

                {isAdmin && (
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<UploadFileIcon />}
                    onClick={handleImportGame}
                    disabled={loading}
                    fullWidth
                  >
                    {t('menu.importSave')}
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
                  startIcon={<FeedbackIcon />}
                  onClick={handleFeedback}
                  disabled={loading}
                  fullWidth
                >
                  {t('menu.sendFeedback')}
                </Button>

                <Button
                  variant="text"
                  size="large"
                  startIcon={<PersonAddIcon />}
                  onClick={handleInvite}
                  disabled={loading}
                  fullWidth
                >
                  {t('invite.button')}
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

      {/* Right Panel - Release Notes (hidden on small screens) */}
      <Box sx={{ display: { xs: 'none', lg: 'block' }, alignSelf: 'center' }}>
        <ReleaseNotesPanel />
      </Box>

      {/* Save selector dialog (for Load Game) */}
      <SaveSelectorDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSelect={handleSelectSave}
        saves={saves}
        onExport={isAdmin ? handleExportSave : undefined}
      />

      {/* Save slot dialog (for New Game - authenticated) */}
      <SaveSlotDialog
        open={slotDialogOpen}
        onClose={handleSlotDialogClose}
        onSelectSlot={handleSelectSlot}
        saves={saves}
        defaultName={slotDialogMode === 'import' ? pendingImportSuggestedName : ''}
      />

      {/* Save import dialog (admin only) */}
      <SaveImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImportReady={handleImportReady}
      />

      {/* Guest game naming dialog */}
      <Dialog
        open={guestNameDialogOpen}
        onClose={() => setGuestNameDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('saves.nameYourGame')}</DialogTitle>
        <DialogContent>
          {isGuestOverwrite && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {t('saves.guestOverwriteWarning')}
            </Alert>
          )}
          <TextField
            autoFocus
            fullWidth
            label={t('saves.gameName')}
            placeholder={t('saves.gameNamePlaceholder')}
            value={guestGameName}
            onChange={(e) => setGuestGameName(e.target.value)}
            onKeyDown={handleGuestNameKeyDown}
            inputProps={{ maxLength: 50 }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGuestNameDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleGuestNameConfirm}
            color={isGuestOverwrite ? 'warning' : 'primary'}
          >
            {isGuestOverwrite ? t('saves.overwriteAndCreate') : t('saves.createGame')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback dialog */}
      <FeedbackDialog
        open={feedbackDialogOpen}
        onClose={() => setFeedbackDialogOpen(false)}
      />

      {/* Invite friend dialog */}
      <InviteFriendDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
      />
    </Box>
  );
}
