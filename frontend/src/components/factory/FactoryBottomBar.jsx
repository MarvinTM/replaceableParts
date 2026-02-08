import { forwardRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
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

function getMaxStack(material, inventoryCapacity) {
  if (!Number.isFinite(inventoryCapacity) || inventoryCapacity <= 0) {
    return null;
  }
  const weight = Number(material?.weight);
  const safeWeight = Number.isFinite(weight) && weight > 0 ? weight : 1;
  return Math.max(1, Math.floor(inventoryCapacity / safeWeight));
}

/**
 * FactoryBottomBar - Bottom bar with inventory (wrapping grid) and play controls
 */
const FactoryBottomBar = forwardRef(function FactoryBottomBar({
  inventory,
  rules,
  tick,
  materialThroughput = new Map(),
  inventoryCapacity = null,
}, ref) {
  const { t } = useTranslation();

  const materialsById = useMemo(
    () => new Map((rules?.materials || []).map((material) => [material.id, material])),
    [rules?.materials]
  );

  const inventoryEntries = useMemo(
    () => Object.entries(inventory).sort(([idA], [idB]) => {
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

      const matA = materialsById.get(idA);
      const matB = materialsById.get(idB);
      return getMaterialName(idA, matA?.name).localeCompare(getMaterialName(idB, matB?.name));
    }),
    [inventory, materialThroughput, materialsById]
  );

  const finalGoodsEntries = useMemo(
    () => inventoryEntries.filter(([itemId]) => materialsById.get(itemId)?.category === 'final'),
    [inventoryEntries, materialsById]
  );

  const partAndMaterialEntries = useMemo(
    () => inventoryEntries.filter(([itemId]) => materialsById.get(itemId)?.category !== 'final'),
    [inventoryEntries, materialsById]
  );

  const totalItems = Object.values(inventory).reduce((a, b) => a + b, 0);
  const finalGoodsCount = finalGoodsEntries.length;
  const partsCount = partAndMaterialEntries.length;
  const hasCategorySplit = finalGoodsCount > 0 && partsCount > 0;
  const summaryLabel = `${t('game.factory.finalGoodsShort', 'FG')} ${finalGoodsCount} · ${t('game.factory.partsShort', 'P')} ${partsCount}`;

  const renderInventoryChip = ([itemId, quantity], isPartBoundary = false) => {
    const material = materialsById.get(itemId);
    const tp = materialThroughput.get(itemId);
    const hasTP = tp && (tp.produced > 0 || tp.consumed > 0);
    const isFinalGood = material?.category === 'final';
    const name = getMaterialName(itemId, material?.name);
    const maxStack = getMaxStack(material, inventoryCapacity);
    const storageRatio = maxStack ? Math.min(quantity / maxStack, 1) : null;
    const storagePercent = storageRatio !== null ? Math.round(storageRatio * 100) : 0;
    const isStorageNearFull = storageRatio !== null && storageRatio >= 0.85 && storageRatio < 1;
    const isStorageFull = maxStack !== null && quantity >= maxStack;
    const quantityLabel = maxStack ? `${quantity}/${maxStack}` : `${quantity}`;
    const label = hasTP
      ? `${name}: ${quantityLabel} (${tp.consumed}/${tp.produced})`
      : `${name}: ${quantityLabel}`;

    let baseBackground = 'transparent';
    let borderColor = 'divider';

    if (isFinalGood && hasTP) {
      if (tp.consumed > tp.produced) {
        baseBackground = 'rgba(244, 67, 54, 0.08)';
        borderColor = 'rgba(244, 67, 54, 0.4)';
      } else {
        baseBackground = 'rgba(76, 175, 80, 0.08)';
        borderColor = 'rgba(76, 175, 80, 0.4)';
      }
    }

    if (isFinalGood && isStorageNearFull) {
      borderColor = 'rgba(237, 108, 2, 0.55)';
    }
    if (isFinalGood && isStorageFull) {
      borderColor = 'rgba(244, 67, 54, 0.7)';
    }

    const storageFillColor = isFinalGood
      ? isStorageFull
        ? 'rgba(244, 67, 54, 0.22)'
        : isStorageNearFull
          ? 'rgba(237, 108, 2, 0.20)'
          : 'rgba(25, 118, 210, 0.15)'
      : 'rgba(25, 118, 210, 0.15)';

    const chipSx = {
      borderColor,
      backgroundColor: baseBackground,
      backgroundImage: storageRatio !== null
        ? `linear-gradient(90deg, ${storageFillColor} 0%, ${storageFillColor} ${storagePercent}%, ${baseBackground} ${storagePercent}%, ${baseBackground} 100%)`
        : undefined,
      ...(isPartBoundary ? { ml: 0.75, boxShadow: 'inset 2px 0 0 rgba(25, 118, 210, 0.6)' } : {}),
    };

    const labelNode = (
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        <span>{label}</span>
        {isFinalGood && isStorageFull && (
          <WarningAmberIcon
            sx={{ fontSize: 14, color: 'error.main' }}
            aria-label={t('game.factory.storageFull', 'Storage full')}
          />
        )}
      </Box>
    );

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
        label={labelNode}
        variant="outlined"
        size="small"
        sx={chipSx}
      />
    );
  };

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
          {inventoryEntries.length > 0 && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: 'monospace', display: { xs: 'none', md: 'inline' } }}
            >
              {summaryLabel}
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
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 0.75,
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
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', gap: 0.5 }}>
            {finalGoodsEntries.map((entry) => renderInventoryChip(entry))}
            {partAndMaterialEntries.map((entry, index) => renderInventoryChip(entry, hasCategorySplit && index === 0))}
          </Box>
        )}
      </Box>
    </Paper>
  );
});

export default FactoryBottomBar;
