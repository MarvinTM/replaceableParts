import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const DEFAULT_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB (allows legacy large exports)

function getSuggestedName(payload, fileName) {
  const fromPayload = payload?.save?.name || payload?.name || '';
  if (typeof fromPayload === 'string' && fromPayload.trim()) {
    return fromPayload.trim().slice(0, 50);
  }
  const fromFile = String(fileName || '').replace(/\.[^/.]+$/, '').trim();
  if (fromFile) {
    return fromFile.slice(0, 50);
  }
  return 'Imported Save';
}

export default function SaveImportDialog({
  open,
  onClose,
  onImportReady,
  maxFileSizeBytes = DEFAULT_MAX_FILE_SIZE_BYTES
}) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState('');

  const parseFile = useCallback(async (file) => {
    if (!file) return;
    setError('');

    if (file.size > maxFileSizeBytes) {
      setError(t('saves.importFileTooLarge'));
      return;
    }

    setIsParsing(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);

      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error('Invalid payload');
      }

      onImportReady({
        payload,
        suggestedName: getSuggestedName(payload, file.name)
      });
    } catch {
      setError(t('saves.importInvalidFile'));
    } finally {
      setIsParsing(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, [maxFileSizeBytes, onImportReady, t]);

  const handleInputChange = async (event) => {
    const file = event.target.files?.[0];
    await parseFile(file);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer?.files?.[0];
    await parseFile(file);
  };

  const handleBrowse = () => {
    inputRef.current?.click();
  };

  return (
    <Dialog open={open} onClose={isParsing ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('saves.importTitle')}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('saves.importDescription')}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          onDragEnter={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          sx={{
            border: '2px dashed',
            borderColor: isDragging ? 'primary.main' : 'divider',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            backgroundColor: isDragging ? 'action.hover' : 'transparent'
          }}
        >
          {isParsing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={26} />
              <Typography variant="body2">{t('common.loading')}</Typography>
            </Box>
          ) : (
            <>
              <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1" sx={{ mb: 1 }}>
                {t('saves.dropFileHere')}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                {t('saves.importAcceptedFormats')}
              </Typography>
              <Button variant="outlined" onClick={handleBrowse}>
                {t('saves.chooseFile')}
              </Button>
            </>
          )}
        </Box>

        <input
          data-testid="save-import-file-input"
          ref={inputRef}
          type="file"
          accept=".json,.rpsave,.rpsave.json,application/json"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isParsing}>
          {t('common.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
