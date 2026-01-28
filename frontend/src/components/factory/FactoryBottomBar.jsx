import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import InventoryIcon from '@mui/icons-material/Inventory';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FastForwardIcon from '@mui/icons-material/FastForward';
import useGameStore from '../../stores/gameStore';
import MaterialIcon from '../common/MaterialIcon';

/**
 * PlayControls - Three-button play control group (pause, play, fast)
 */
function PlayControls() {
  const { t } = useTranslation();
  const currentSpeed = useGameStore(state => state.currentSpeed);
  const startGameLoop = useGameStore(state => state.startGameLoop);
  const stopGameLoop = useGameStore(state => state.stopGameLoop);

  return (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
      <Tooltip title={t('game.controls.pause', 'Pause')}>
        <IconButton
          onClick={stopGameLoop}
          color={currentSpeed === 'paused' ? 'primary' : 'default'}
          size="small"
        >
          <PauseIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('game.controls.play', 'Play')}>
        <IconButton
          onClick={() => startGameLoop('normal')}
          color={currentSpeed === 'normal' ? 'primary' : 'default'}
          size="small"
        >
          <PlayArrowIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('game.controls.fast', 'Fast')}>
        <IconButton
          onClick={() => startGameLoop('fast')}
          color={currentSpeed === 'fast' ? 'primary' : 'default'}
          size="small"
        >
          <FastForwardIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

/**
 * FactoryBottomBar - Bottom bar with inventory (horizontal scroll) and play controls
 */
const FactoryBottomBar = forwardRef(function FactoryBottomBar({ inventory, rules }, ref) {
  const { t } = useTranslation();

  const inventoryEntries = Object.entries(inventory);
  const totalItems = Object.values(inventory).reduce((a, b) => a + b, 0);

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        borderTop: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      {/* Inventory Section */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', px: 1.5, py: 1, minWidth: 0, overflow: 'hidden' }}>
        <InventoryIcon sx={{ color: 'info.main', fontSize: 20, mr: 1, flexShrink: 0 }} />
        <Typography variant="subtitle2" fontWeight={600} sx={{ mr: 1, flexShrink: 0 }}>
          {t('game.factory.inventory')}
        </Typography>
        {totalItems > 0 && (
          <Typography
            variant="caption"
            sx={{
              backgroundColor: 'action.selected',
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontWeight: 500,
              mr: 1.5,
              flexShrink: 0,
            }}
          >
            {totalItems}
          </Typography>
        )}

        {/* Scrollable inventory chips */}
        <Box
          ref={ref}
          sx={{
            flex: 1,
            display: 'flex',
            gap: 0.5,
            overflowX: 'auto',
            minWidth: 0,
            py: 0.5,
            '&::-webkit-scrollbar': {
              height: 6,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'action.disabled',
              borderRadius: 3,
            },
          }}
        >
          {inventoryEntries.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t('game.factory.emptyInventory')}
            </Typography>
          ) : (
            inventoryEntries.map(([itemId, quantity]) => {
              const material = rules.materials.find(m => m.id === itemId);
              return (
                <Chip
                  key={itemId}
                  icon={
                    <MaterialIcon
                      materialId={itemId}
                      materialName={material?.name}
                      category={material?.category}
                      size={16}
                    />
                  }
                  label={`${material?.name || itemId}: ${quantity}`}
                  variant="outlined"
                  size="small"
                  sx={{ flexShrink: 0 }}
                />
              );
            })
          )}
        </Box>
      </Box>

      {/* Divider */}
      <Box
        sx={{
          width: '1px',
          height: 32,
          backgroundColor: 'divider',
          flexShrink: 0,
        }}
      />

      {/* Play Controls Section */}
      <Box sx={{ px: 1, py: 1, flexShrink: 0 }}>
        <PlayControls />
      </Box>
    </Paper>
  );
});

export default FactoryBottomBar;
