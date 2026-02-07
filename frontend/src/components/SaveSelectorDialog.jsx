import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { useGame } from '../contexts/GameContext';

export default function SaveSelectorDialog({ open, onClose, onSelect, saves, onExport }) {
  const { t } = useTranslation();
  const { deleteSave } = useGame();
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async (e, save) => {
    e.stopPropagation();
    if (deleteConfirm === save.id) {
      await deleteSave(save.id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(save.id);
    }
  };

  const handleClose = () => {
    setDeleteConfirm(null);
    onClose();
  };

  // Sort saves by updatedAt descending
  const sortedSaves = [...saves].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('menu.loadGame')}</DialogTitle>
      <DialogContent dividers>
        {sortedSaves.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <SportsEsportsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography color="text.secondary">
              {t('saves.noSaves')}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {sortedSaves.map((save, index) => (
              <ListItem
                key={save.id}
                disablePadding
                divider={index < sortedSaves.length - 1}
              >
                <ListItemButton onClick={() => onSelect(save)}>
                  <ListItemText
                    primary={save.name}
                    secondary={
                      <>
                        {t('saves.lastPlayed')}: {formatDate(save.updatedAt)}
                        <br />
                        {t('saves.created')}: {formatDate(save.createdAt)}
                      </>
                    }
                  />
                </ListItemButton>
                <ListItemSecondaryAction>
                  {onExport && (
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExport(save);
                      }}
                      title={t('saves.export')}
                    >
                      <DownloadIcon />
                    </IconButton>
                  )}
                  <IconButton
                    edge="end"
                    onClick={(e) => handleDelete(e, save)}
                    color={deleteConfirm === save.id ? 'error' : 'default'}
                    title={deleteConfirm === save.id ? t('saves.confirmDelete') : t('common.delete')}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('common.cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
}
