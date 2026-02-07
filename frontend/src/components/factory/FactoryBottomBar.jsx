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
import TickProgressIndicator from '../common/TickProgressIndicator';
import { getMaterialName } from '../../utils/translationHelpers';

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

// Minimum height for the inventory area (in pixels)
const INVENTORY_MIN_HEIGHT = 160;

/**
 * FactoryBottomBar - Bottom bar with inventory (wrapping grid) and play controls
 */
const FactoryBottomBar = forwardRef(function FactoryBottomBar({ inventory, rules, tick, materialThroughput = new Map() }, ref) {
  const { t } = useTranslation();

  const inventoryEntries = Object.entries(inventory).sort(([idA], [idB]) => {
    const tA = materialThroughput.get(idA);
    const tB = materialThroughput.get(idB);
    const activeA = tA && (tA.produced > 0 || tA.consumed > 0);
    const activeB = tB && (tB.produced > 0 || tB.consumed > 0);

    if (activeA && !activeB) return -1;
    if (!activeA && activeB) return 1;

    if (activeA && activeB) {
      const deficitA = tA.consumed > tA.produced;
      const deficitB = tB.consumed > tB.produced;
      if (deficitA && !deficitB) return -1;
      if (!deficitA && deficitB) return 1;
    }

    const matA = rules.materials.find(m => m.id === idA);
    const matB = rules.materials.find(m => m.id === idB);
    return getMaterialName(idA, matA?.name).localeCompare(getMaterialName(idB, matB?.name));
  });
  const totalItems = Object.values(inventory).reduce((a, b) => a + b, 0);

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        borderTop: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        overflow: 'hidden',
        width: '100%',
        minHeight: INVENTORY_MIN_HEIGHT,
      }}
    >
      {/* Header row with title and play controls */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 0.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'action.hover',
        }}
      >
        {/* Inventory label */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon sx={{ color: 'info.main', fontSize: 20 }} />
          <Typography variant="subtitle2" fontWeight={600}>
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
              }}
            >
              {totalItems}
            </Typography>
          )}
        </Box>

        {/* Tick Progress and Play Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1, fontFamily: 'monospace' }}>
            {t('game.tick')}: {tick}
          </Typography>
          <TickProgressIndicator />
          <PlayControls />
        </Box>
      </Box>

      {/* Inventory content area - wrapping grid with vertical scroll */}
      <Box
        ref={ref}
        sx={{
          flex: 1,
          display: 'flex',
          flexWrap: 'wrap',
          alignContent: 'flex-start',
          gap: 0.5,
          p: 1,
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: 6,
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
            const tp = materialThroughput.get(itemId);
            const hasTP = tp && (tp.produced > 0 || tp.consumed > 0);
            const name = getMaterialName(itemId, material?.name);
            const label = hasTP
              ? `${name}: ${quantity} (${tp.consumed}/${tp.produced})`
              : `${name}: ${quantity}`;

            const chipSx = hasTP
              ? tp.consumed > tp.produced
                ? { backgroundColor: 'rgba(244, 67, 54, 0.12)', borderColor: 'rgba(244, 67, 54, 0.4)' }
                : { backgroundColor: 'rgba(76, 175, 80, 0.12)', borderColor: 'rgba(76, 175, 80, 0.4)' }
              : {};

            return (
              <Chip
                key={itemId}
                icon={
                  <MaterialIcon
                    materialId={itemId}
                    materialName={name}
                    category={material?.category}
                    size={16}
                  />
                }
                label={label}
                variant="outlined"
                size="small"
                sx={chipSx}
              />
            );
          })
        )}
      </Box>
    </Paper>
  );
});

export default FactoryBottomBar;
