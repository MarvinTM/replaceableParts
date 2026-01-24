import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';

const TOTAL_SLOTS = 5;

export default function SaveSlotDialog({ open, onClose, onSelectSlot, saves }) {
  const { t } = useTranslation();
  const [confirmSlot, setConfirmSlot] = useState(null);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Create an array of 5 slots, filling in saves where they exist
  // We'll use the save's position in the array as the slot index
  const slots = Array.from({ length: TOTAL_SLOTS }, (_, index) => {
    // Find a save for this slot (we'll use array index order)
    const save = saves[index] || null;
    return {
      index,
      save,
      isEmpty: !save,
    };
  });

  const handleSlotClick = (slot) => {
    if (slot.isEmpty) {
      // Empty slot - create new game immediately
      onSelectSlot(slot.index, false, null);
    } else {
      // Occupied slot - need confirmation
      if (confirmSlot === slot.index) {
        // Second click - confirm overwrite
        onSelectSlot(slot.index, true, slot.save.id);
        setConfirmSlot(null);
      } else {
        // First click - show confirmation state
        setConfirmSlot(slot.index);
      }
    }
  };

  const handleClose = () => {
    setConfirmSlot(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('saves.selectSlot')}</DialogTitle>
      <DialogContent dividers>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 2,
            py: 1,
          }}
        >
          {slots.map((slot) => (
            <Card
              key={slot.index}
              sx={{
                border: confirmSlot === slot.index ? '2px solid' : '1px solid',
                borderColor: confirmSlot === slot.index ? 'error.main' : 'divider',
                transition: 'all 0.2s ease',
              }}
            >
              <CardActionArea onClick={() => handleSlotClick(slot)}>
                <CardContent
                  sx={{
                    minHeight: 120,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                  }}
                >
                  {slot.isEmpty ? (
                    <>
                      <AddIcon
                        sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {t('saves.emptySlot')}
                      </Typography>
                      <Chip
                        label={t('saves.create')}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </>
                  ) : (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <SportsEsportsIcon color="primary" />
                        <Typography variant="subtitle1" fontWeight="medium">
                          {slot.save.name}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {t('saves.lastPlayed')}: {formatDate(slot.save.updatedAt)}
                      </Typography>
                      {confirmSlot === slot.index ? (
                        <Chip
                          label={t('saves.confirmOverwrite')}
                          size="small"
                          color="error"
                        />
                      ) : (
                        <Chip
                          label={t('saves.overwrite')}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                    </>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>

        {confirmSlot !== null && (
          <Typography
            variant="body2"
            color="error"
            sx={{ mt: 2, textAlign: 'center' }}
          >
            {t('saves.confirmOverwriteHint')}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('common.cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
}
