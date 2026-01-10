import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import BoltIcon from '@mui/icons-material/Bolt';

export default function PlaceableMachinesPanel({ inventory, rules, onDragStart, onDragEnd }) {
  const { t } = useTranslation();

  const machineItemId = rules.machines.itemId;
  const machineCount = inventory[machineItemId] || 0;
  const machineEnergy = rules.machines.baseEnergy;
  const machineSizeX = rules.machines.baseSizeX;
  const machineSizeY = rules.machines.baseSizeY;

  // Get material name for display
  const material = rules.materials.find(m => m.id === machineItemId);
  const machineName = material?.name || 'Production Machine';

  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      itemType: 'machine',
      itemId: machineItemId,
      sizeX: machineSizeX,
      sizeY: machineSizeY
    }));
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.('machine', machineItemId, machineSizeX, machineSizeY);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          {t('game.factory.machines')}
        </Typography>
        {machineCount === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('game.factory.noMachinesInInventory', 'No machines in inventory')}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Box
              draggable={true}
              onDragStart={handleDragStart}
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
              {/* Machine preview - colored box representing 1x3 machine */}
              <Box
                sx={{
                  width: 16,
                  height: 48,
                  backgroundColor: 'grey.500',
                  borderRadius: 0.5,
                  border: '1px solid',
                  borderColor: 'grey.700',
                  flexShrink: 0
                }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <Typography variant="body2" noWrap>
                  {machineName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <BoltIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                  <Typography variant="caption" color="text.secondary">
                    -{machineEnergy}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={`x${machineCount}`}
                size="small"
                color="primary"
                sx={{ ml: 'auto' }}
              />
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
