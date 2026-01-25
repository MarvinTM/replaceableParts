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

export default function FeedbackDialog({ open, onClose }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleClose = () => {
    if (!loading) {
      setTitle('');
      setBody('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  const handleSubmit = async () => {
    // Validate fields
    if (!title.trim()) {
      setError(t('feedback.titleRequired'));
      return;
    }

    if (!body.trim()) {
      setError(t('feedback.bodyRequired'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.sendFeedback(title.trim(), body.trim());
      setSuccess(true);

      // Close dialog after showing success message
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err.message || t('feedback.sendError'));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
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
      <DialogTitle>{t('feedback.title')}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {t('feedback.sendSuccess')}
          </Alert>
        )}
        <TextField
          autoFocus
          fullWidth
          label={t('feedback.feedbackTitle')}
          placeholder={t('feedback.titlePlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading || success}
          inputProps={{ maxLength: 200 }}
          sx={{ mt: 1, mb: 2 }}
          required
        />
        <TextField
          fullWidth
          multiline
          rows={6}
          label={t('feedback.feedbackBody')}
          placeholder={t('feedback.bodyPlaceholder')}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading || success}
          inputProps={{ maxLength: 2000 }}
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
          {loading ? t('feedback.sending') : t('feedback.send')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
