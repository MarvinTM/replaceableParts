import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import BoltIcon from '@mui/icons-material/Bolt';

export default function PlaceableGeneratorsPanel({ inventory, rules, onDragStart, onDragEnd }) {
  const { t } = useTranslation();

  // Get all generator types that have items in inventory
  const availableGenerators = rules.generators
    .map(genType => ({
      ...genType,
      count: inventory[genType.itemId] || 0
    }))
    .filter(gen => gen.count > 0);

  const handleDragStart = (e, generator) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      itemType: 'generator',
      itemId: generator.itemId,
      generatorType: generator.id,
      sizeX: generator.sizeX,
      sizeY: generator.sizeY
    }));
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.('generator', generator.itemId, generator.id, generator.sizeX, generator.sizeY);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  // Fixed preview size for all generators (equivalent to 2x2 building)
  const PREVIEW_SIZE = 48;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          {t('game.factory.generators')}
        </Typography>
        {availableGenerators.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('game.factory.noGeneratorsInInventory', 'No generators in inventory')}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {availableGenerators.map((generator) => {
              return (
                <Box
                  key={generator.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, generator)}
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
                      borderColor: 'warning.main'
                    },
                    '&:active': {
                      cursor: 'grabbing'
                    }
                  }}
                >
                  {/* Generator preview - actual generator image at fixed size */}
                  <Box
                    component="img"
                    src={`/assets/factory/${generator.id}.png`}
                    alt={generator.name}
                    sx={{
                      width: PREVIEW_SIZE,
                      height: PREVIEW_SIZE,
                      objectFit: 'contain',
                      flexShrink: 0,
                      imageRendering: 'pixelated'
                    }}
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.target.style.display = 'none';
                    }}
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" noWrap>
                      {generator.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <BoltIcon sx={{ fontSize: 14, color: 'success.main' }} />
                      <Typography variant="caption" color="success.main">
                        +{generator.energyOutput}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={`x${generator.count}`}
                    size="small"
                    color="warning"
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
