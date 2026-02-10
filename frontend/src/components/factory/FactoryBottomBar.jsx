import { forwardRef, useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FastForwardIcon from '@mui/icons-material/FastForward';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import useGameStore from '../../stores/gameStore';
import MaterialIcon from '../common/MaterialIcon';
import TickProgressIndicator from '../common/TickProgressIndicator';
import { getMaterialName } from '../../utils/translationHelpers';
import { formatCredits } from '../../utils/currency';

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
  lastShipmentTick = 0,
  shipmentCooldownTicks = 12,
}, ref) {
  const { t } = useTranslation();
  const shipGoods = useGameStore(state => state.shipGoods);

  const [shippedItems, setShippedItems] = useState(null);
  const [earnedCredits, setEarnedCredits] = useState(null);

  // Clear shipped items animation after delay
  useEffect(() => {
    if (shippedItems) {
      const timer = setTimeout(() => setShippedItems(null), 600);
      return () => clearTimeout(timer);
    }
  }, [shippedItems]);

  // Clear earned credits animation after delay
  useEffect(() => {
    if (earnedCredits !== null) {
      const timer = setTimeout(() => setEarnedCredits(null), 1200);
      return () => clearTimeout(timer);
    }
  }, [earnedCredits]);

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
  const hasBothCategories = finalGoodsEntries.length > 0 && partAndMaterialEntries.length > 0;

  // Ship Goods state
  const ticksSinceShipment = tick - lastShipmentTick;
  const isOnCooldown = ticksSinceShipment < shipmentCooldownTicks;
  const cooldownRemaining = isOnCooldown ? shipmentCooldownTicks - ticksSinceShipment : 0;
  const cooldownProgress = isOnCooldown ? (ticksSinceShipment / shipmentCooldownTicks) * 100 : 100;
  const hasFinalGoods = finalGoodsEntries.length > 0;
  const canShip = !isOnCooldown && hasFinalGoods;

  const handleShipGoods = useCallback(() => {
    if (!canShip) return;
    // Capture current final goods for animation
    const captured = finalGoodsEntries.map(([itemId, qty]) => ({ itemId, quantity: qty }));
    const result = shipGoods();
    if (!result.error && result.shipmentResult) {
      setShippedItems(captured);
      setEarnedCredits(result.shipmentResult.totalCredits);
    }
  }, [canShip, finalGoodsEntries, shipGoods]);

  const shipButtonTooltip = isOnCooldown
    ? t('game.factory.shipCooldown', 'Next shipment in {{ticks}} ticks', { ticks: cooldownRemaining })
    : !hasFinalGoods
      ? t('game.factory.nothingToShip', 'No final goods to ship')
      : t('game.factory.shipGoodsTooltip', 'Sell all final goods');

  const renderInventoryChip = ([itemId, quantity], isShipping = false) => {
    const material = materialsById.get(itemId);
    const isFinalGood = material?.category === 'final';
    const tp = materialThroughput.get(itemId);
    const hasTP = !isFinalGood && tp && (tp.produced > 0 || tp.consumed > 0);
    const hasDeficit = hasTP && tp.consumed > tp.produced;
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

    if (hasTP) {
      if (hasDeficit) {
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
      : hasTP
        ? hasDeficit
          ? 'rgba(244, 67, 54, 0.18)'
          : 'rgba(76, 175, 80, 0.18)'
        : 'rgba(25, 118, 210, 0.15)';

    const chipSx = {
      borderColor,
      backgroundColor: baseBackground,
      backgroundImage: storageRatio !== null
        ? `linear-gradient(90deg, ${storageFillColor} 0%, ${storageFillColor} ${storagePercent}%, ${baseBackground} ${storagePercent}%, ${baseBackground} 100%)`
        : undefined,
      ...(isShipping && {
        '@keyframes shipOut': {
          '0%': { opacity: 1, transform: 'translateY(0) scale(1)' },
          '100%': { opacity: 0, transform: 'translateY(20px) scale(0.7)' },
        },
        animation: 'shipOut 600ms ease-in forwards',
      }),
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
        key={isShipping ? `shipping-${itemId}` : itemId}
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

  const renderFinalGoodsHeader = (count) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, pt: 0.75, pb: 0.25 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600 }}
      >
        {t('game.factory.finalGoods', 'Final Goods')} ({count})
      </Typography>
      <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <Tooltip title={shipButtonTooltip}>
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<LocalShippingIcon sx={{ fontSize: 14 }} />}
              disabled={!canShip}
              onClick={handleShipGoods}
              sx={{
                minWidth: 0,
                py: 0,
                px: 1,
                fontSize: '0.7rem',
                lineHeight: 1.6,
                textTransform: 'none',
                borderColor: canShip ? 'primary.main' : 'action.disabled',
              }}
            >
              {t('game.factory.shipGoods', 'Ship Goods')}
            </Button>
          </span>
        </Tooltip>
        {isOnCooldown && (
          <LinearProgress
            variant="determinate"
            value={cooldownProgress}
            sx={{
              position: 'absolute',
              bottom: -2,
              left: 0,
              right: 0,
              height: 2,
              borderRadius: 1,
            }}
          />
        )}
        {earnedCredits !== null && (
          <Typography
            sx={{
              position: 'absolute',
              top: -24,
              left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: '#d4a017',
              pointerEvents: 'none',
              '@keyframes floatUp': {
                '0%': { opacity: 1, transform: 'translateX(-50%) translateY(0)' },
                '100%': { opacity: 0, transform: 'translateX(-50%) translateY(-40px)' },
              },
              animation: 'floatUp 1200ms ease-out forwards',
            }}
          >
            +{formatCredits(earnedCredits)}
          </Typography>
        )}
      </Box>
    </Box>
  );

  const renderFinalGoodsContent = () => {
    // Show ghost chips for shipped items, or current inventory
    if (shippedItems) {
      return shippedItems.map((item) =>
        renderInventoryChip([item.itemId, item.quantity], true)
      );
    }
    return finalGoodsEntries.map((entry) => renderInventoryChip(entry));
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

      {/* Inventory content area */}
      <Box
        ref={ref}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {inventoryEntries.length === 0 && !shippedItems ? (
          <Box sx={{ p: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('game.factory.emptyInventory')}
            </Typography>
          </Box>
        ) : hasBothCategories || shippedItems ? (
          <>
            {/* Final Goods column */}
            <Box
              sx={{
                flex: { xs: 'none', sm: '0 0 35%' },
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                minHeight: 0,
              }}
            >
              {renderFinalGoodsHeader(shippedItems ? shippedItems.length : finalGoodsEntries.length)}
              <Box
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  px: 1,
                  pb: 0.5,
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignContent: 'flex-start',
                  gap: 0.5,
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-thumb': { backgroundColor: 'action.disabled', borderRadius: 3 },
                }}
              >
                {renderFinalGoodsContent()}
              </Box>
            </Box>
            {/* Vertical divider */}
            <Box sx={{ width: '1px', backgroundColor: 'divider', flexShrink: 0 }} />
            {/* Parts & Materials column */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                minHeight: 0,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, px: 1, pt: 0.75, pb: 0.25 }}
              >
                {t('game.factory.parts', 'Parts')} ({partAndMaterialEntries.length})
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  px: 1,
                  pb: 0.5,
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignContent: 'flex-start',
                  gap: 0.5,
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-thumb': { backgroundColor: 'action.disabled', borderRadius: 3 },
                }}
              >
                {partAndMaterialEntries.map((entry) => renderInventoryChip(entry))}
              </Box>
            </Box>
          </>
        ) : (
          /* Single category - full width */
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              minHeight: 0,
            }}
          >
            {finalGoodsEntries.length > 0
              ? renderFinalGoodsHeader(finalGoodsEntries.length)
              : (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, px: 1, pt: 0.75, pb: 0.25 }}
                >
                  {t('game.factory.parts', 'Parts')} ({partAndMaterialEntries.length})
                </Typography>
              )
            }
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                px: 1,
                pb: 0.5,
                display: 'flex',
                flexWrap: 'wrap',
                alignContent: 'flex-start',
                gap: 0.5,
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-thumb': { backgroundColor: 'action.disabled', borderRadius: 3 },
              }}
            >
              {finalGoodsEntries.length > 0
                ? renderFinalGoodsContent()
                : partAndMaterialEntries.map((entry) => renderInventoryChip(entry))
              }
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
});

export default FactoryBottomBar;
