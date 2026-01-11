import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import BoltIcon from '@mui/icons-material/Bolt';

export default function PlaceableMachinesPanel({ inventory, rules, onDragStart, onDragEnd }) {
  const { t } = useTranslation();

  // Get all machine types that have items in inventory
  const availableMachines = rules.machines
    .map(machineType => ({
      ...machineType,
      count: inventory[machineType.itemId] || 0
    }))
    .filter(machine => machine.count > 0);

  const handleDragStart = (e, machine) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      itemType: 'machine',
      itemId: machine.itemId,
      machineType: machine.id,
      sizeX: machine.sizeX,
      sizeY: machine.sizeY
    }));
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.('machine', machine.itemId, machine.sizeX, machine.sizeY);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  // Calculate preview box size based on machine dimensions
  const getPreviewSize = (sizeX, sizeY) => {
    const baseSize = 16;
    return {
      width: sizeX * baseSize,
      height: sizeY * baseSize
    };
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          {t('game.factory.machines')}
        </Typography>
        {availableMachines.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('game.factory.noMachinesInInventory', 'No machines in inventory')}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {availableMachines.map((machine) => {
              const previewSize = getPreviewSize(machine.sizeX, machine.sizeY);
              return (
                <Box
                  key={machine.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, machine)}
                  onDragEnd={handleDragEnd}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    cursor: 'grab',
                    backgroundColor: 'background.paper',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      borderColor: 'primary.main'
                    },
                    '&:active': {
                      cursor: 'grabbing'
                    }
                  }}
                >
                  {/* Machine preview - colored box based on size */}
                  <Box
                    sx={{
                      width: previewSize.width,
                      height: previewSize.height,
                      backgroundColor: 'grey.500',
                      borderRadius: 0.5,
                      border: '1px solid',
                      borderColor: 'grey.700',
                      flexShrink: 0
                    }}
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" noWrap>
                      {machine.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <BoltIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                      <Typography variant="caption" color="text.secondary">
                        -{machine.energyConsumption}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={`x${machine.count}`}
                    size="small"
                    color="primary"
                  />
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
