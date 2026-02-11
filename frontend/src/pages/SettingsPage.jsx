import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import useGameStore from '../stores/gameStore';
import { useAuth } from '../contexts/AuthContext';
import { SUPPORTED_LANGUAGES } from '../i18n';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, deleteAccount } = useAuth();
  // const rules = useGameStore((state) => state.rules);
  const machineAnimationMode = useGameStore((state) => state.machineAnimationMode);
  const productionAnimationStyle = useGameStore((state) => state.productionAnimationStyle);
  // const disableResearch = useGameStore((state) => state.disableResearch);
  // const setExpansionType = useGameStore((state) => state.setExpansionType);
  const setMachineAnimationMode = useGameStore((state) => state.setMachineAnimationMode);
  const setProductionAnimationStyle = useGameStore((state) => state.setProductionAnimationStyle);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  // const setDisableResearch = useGameStore((state) => state.setDisableResearch);
  const isDeleteConfirmationValid = deleteConfirmation === 'DELETE';

  const handleLanguageChange = (event) => {
    i18n.changeLanguage(event.target.value);
  };

  // const handleExpansionChange = (event) => {
  //   setExpansionType(event.target.value);
  // };

  const handleMachineAnimationModeChange = (event) => {
    setMachineAnimationMode(event.target.value);
  };

  const handleProductionAnimationChange = (event) => {
    setProductionAnimationStyle(event.target.value);
  };

  const handleOpenDeleteDialog = () => {
    setDeleteConfirmation('');
    setDeleteError('');
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    if (isDeleting) return;
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteAccount = async () => {
    if (!isDeleteConfirmationValid || isDeleting) {
      return;
    }

    setDeleteError('');
    setIsDeleting(true);
    try {
      await deleteAccount();
      setIsDeleteDialogOpen(false);
      navigate('/menu', { replace: true });
    } catch (error) {
      setDeleteError(error.message || t('settings.deleteAccount.deleteFailed'));
    } finally {
      setIsDeleting(false);
    }
  };

  // const handleDisableResearchChange = (event) => {
  //   setDisableResearch(event.target.checked);
  // };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('settings.title')}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Card sx={{ maxWidth: 600 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('settings.general')}
            </Typography>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="language-select-label">{t('language.select')}</InputLabel>
              <Select
                labelId="language-select-label"
                value={i18n.language}
                label={t('language.select')}
                onChange={handleLanguageChange}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {t(lang.labelKey)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* <FormControl fullWidth sx={{ mt: 3 }}>
            <InputLabel id="expansion-select-label">Expansion Logic</InputLabel>
            <Select
              labelId="expansion-select-label"
              value={rules.floorSpace.expansionType}
              label="Expansion Logic"
              onChange={handleExpansionChange}
            >
              <MenuItem value="spiral">Spiral (Chunks)</MenuItem>
              <MenuItem value="fractal">Fractal (Strips)</MenuItem>
            </Select>
          </FormControl> */}

            <FormControl fullWidth sx={{ mt: 3 }}>
              <InputLabel id="machine-anim-label">{t('settings.machineAnimation')}</InputLabel>
              <Select
                labelId="machine-anim-label"
                value={machineAnimationMode}
                label={t('settings.machineAnimation')}
                onChange={handleMachineAnimationModeChange}
              >
                <MenuItem value="disabled">{t('settings.machineAnimations.disabled')}</MenuItem>
                <MenuItem value="sometimes">{t('settings.machineAnimations.sometimes')}</MenuItem>
                <MenuItem value="continuous">{t('settings.machineAnimations.continuous')}</MenuItem>
              </Select>
            </FormControl>

            {machineAnimationMode !== 'disabled' && (
              <FormControl fullWidth sx={{ mt: 3 }}>
                <InputLabel id="production-anim-label">{t('settings.productionAnimation')}</InputLabel>
                <Select
                  labelId="production-anim-label"
                  value={productionAnimationStyle}
                  label={t('settings.productionAnimation')}
                  onChange={handleProductionAnimationChange}
                >
                  <MenuItem value="floatingFadeOut">{t('settings.productionAnimations.floatingFadeOut')}</MenuItem>
                  <MenuItem value="popAndFloat">{t('settings.productionAnimations.popAndFloat')}</MenuItem>
                  <MenuItem value="flyToInventory">{t('settings.productionAnimations.flyToInventory')}</MenuItem>
                  <MenuItem value="collectThenFly">{t('settings.productionAnimations.collectThenFly')}</MenuItem>
                </Select>
              </FormControl>
            )}

            {/* <FormControlLabel
            sx={{ mt: 3, display: 'flex' }}
            control={
              <Switch
                checked={disableResearch}
                onChange={handleDisableResearchChange}
              />
            }
            label={t('settings.disableResearch')}
          /> */}
          </CardContent>
        </Card>

        {isAuthenticated && (
          <Card
            sx={{
              maxWidth: 600,
              borderColor: 'error.light',
              borderWidth: 1,
              borderStyle: 'solid'
            }}
          >
            <CardContent>
              <Typography variant="h6" color="error.main" gutterBottom>
                {t('settings.deleteAccount.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('settings.deleteAccount.description')}
              </Typography>
              <Button color="error" variant="outlined" onClick={handleOpenDeleteDialog}>
                {t('settings.deleteAccount.action')}
              </Button>
            </CardContent>
          </Card>
        )}
      </Box>

      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t('settings.deleteAccount.dialogTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('settings.deleteAccount.dialogBody')}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {t('settings.deleteAccount.typePrompt')}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            placeholder="DELETE"
            disabled={isDeleting}
          />
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={isDeleting}>
            {t('settings.deleteAccount.cancel')}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteAccount}
            disabled={!isDeleteConfirmationValid || isDeleting}
          >
            {isDeleting
              ? t('settings.deleteAccount.deleting')
              : t('settings.deleteAccount.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
