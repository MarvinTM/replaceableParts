import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import BoltIcon from '@mui/icons-material/Bolt';
import { useTranslation } from 'react-i18next';
import { getMaterialName } from '../../utils/translationHelpers';

/**
 * BuildSelectionPopup - A modal for selecting which machine/generator to build
 * Shows a grid of available items with their images, names, and energy info
 */
export default function BuildSelectionPopup({
  open,
  onClose,
  onSelect,
  items,
  itemType, // 'machine' or 'generator'
  title,
}) {
  const { t } = useTranslation();
  const isGenerator = itemType === 'generator';
  const color = isGenerator ? 'warning' : 'primary';

  const getImageSrc = (item) => {
    if (isGenerator) {
      return `/assets/factory/${item.id}.png`;
    }
    return `/assets/factory/${item.id}_idle.png`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" component="span">
          {title || (isGenerator
            ? t('game.factory.selectGenerator', 'Select Generator to Build')
            : t('game.factory.selectMachine', 'Select Machine to Build'))}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        {items.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            {isGenerator
              ? t('game.factory.noGeneratorsAvailable', 'No generators available to build')
              : t('game.factory.noMachinesAvailable', 'No machines available to build')}
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 1.5,
            }}
          >
            {items.map((item) => (
              <Box
                key={item.id}
                onClick={() => onSelect(item)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    borderColor: `${color}.main`,
                    transform: 'translateY(-2px)',
                    boxShadow: 1,
                  },
                }}
              >
                <Box
                  component="img"
                  src={getImageSrc(item)}
                  alt={getMaterialName(item.id, item.name)}
                  sx={{
                    width: 64,
                    height: 64,
                    objectFit: 'contain',
                    imageRendering: 'pixelated',
                    mb: 1,
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    textAlign: 'center',
                    fontWeight: 500,
                    lineHeight: 1.2,
                    mb: 0.5,
                  }}
                >
                  {getMaterialName(item.id, item.name)}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <BoltIcon
                    sx={{
                      fontSize: 14,
                      color: isGenerator ? 'success.main' : 'warning.main',
                    }}
                  />
                  <Typography
                    variant="caption"
                    color={isGenerator ? 'success.main' : 'text.secondary'}
                  >
                    {isGenerator ? `+${item.energyOutput}` : `-${item.energyConsumption}`}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
