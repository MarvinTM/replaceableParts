import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { api } from '../services/api';

export default function InviteFriendDialog({ open, onClose }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleClose = () => {
    if (!loading) {
      setEmail('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    // Validate email
    if (!email.trim()) {
      setError(t('invite.emailRequired'));
      return;
    }

    if (!validateEmail(email.trim())) {
      setError(t('invite.emailInvalid'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.sendInvite(email.trim());
      setSuccess(true);

      // Close dialog after showing success message
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err.message || t('invite.sendError'));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Enter
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{t('invite.title')}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {t('invite.sendSuccess')}
          </Alert>
        )}
        <TextField
          autoFocus
          fullWidth
          type="email"
          label={t('invite.emailLabel')}
          placeholder={t('invite.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading || success}
          inputProps={{ maxLength: 254 }}
          sx={{ mt: 1 }}
          required
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || success}
          startIcon={loading && <CircularProgress size={16} />}
        >
          {loading ? t('invite.sending') : t('invite.send')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
