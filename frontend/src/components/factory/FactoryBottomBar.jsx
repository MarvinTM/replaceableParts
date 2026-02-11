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
import AddIcon from '@mui/icons-material/Add';
import useGameStore from '../../stores/gameStore';
import MaterialIcon from '../common/MaterialIcon';
import TickProgressIndicator from '../common/TickProgressIndicator';
import { getMaterialName } from '../../utils/translationHelpers';
import { formatCredits } from '../../utils/currency';
import InventoryBrowserDrawer from './InventoryBrowserDrawer';
import useInventoryInsights from './useInventoryInsights';

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

const INVENTORY_HEIGHT = {
  xs: 180,
  sm: 220,
};

function calculateObsolescence(age, discoveredRecipes, rules) {
  if (!rules?.market?.obsolescenceEnabled) {
    return 1.0;
  }

  const nextAge = age + 1;
  if (nextAge > 7) {
    return 1.0;
  }

  const nextAgeFinalGoods = (rules?.recipes || []).filter((recipe) => {
    const outputs = Object.keys(recipe.outputs || {});
    return outputs.some((outputId) => {
      const material = (rules?.materials || []).find((m) => m.id === outputId);
      return material && material.category === 'final' && material.age === nextAge;
    });
  });

  const totalNextAgeRecipes = nextAgeFinalGoods.length;
  if (totalNextAgeRecipes === 0) {
    return 1.0;
  }

  const discoveredSet = new Set(discoveredRecipes || []);
  const discoveredNextAgeRecipes = nextAgeFinalGoods.filter((recipe) =>
    discoveredSet.has(recipe.id)
  ).length;

  const progress = discoveredNextAgeRecipes / totalNextAgeRecipes;
  const maxDebuff = Number.isFinite(rules?.market?.obsolescenceMaxDebuff)
    ? rules.market.obsolescenceMaxDebuff
    : 0;
  const debuff = progress * maxDebuff;

  return 1.0 - debuff;
}

function getMaxStack(material, inventoryCapacity) {
  if (!Number.isFinite(inventoryCapacity) || inventoryCapacity <= 0) {
    return null;
  }
  const weight = Number(material?.weight);
  const safeWeight = Number.isFinite(weight) && weight > 0 ? weight : 1;
  return Math.max(1, Math.floor(inventoryCapacity / safeWeight));
}

const FactoryBottomBar = forwardRef(function FactoryBottomBar({
  inventory,
  rules,
  tick,
  materialThroughput = new Map(),
  inventoryCapacity = null,
  lastShipmentTick = 0,
  shipmentCooldownTicks = 12,
  credits = 0,
}, ref) {
  const { t } = useTranslation();
  const shipGoods = useGameStore(state => state.shipGoods);
  const buyInventorySpace = useGameStore(state => state.buyInventorySpace);
  const marketPopularity = useGameStore(state => state.engineState?.marketPopularity);
  const marketEvents = useGameStore(state => state.engineState?.marketEvents);
  const marketRecentSales = useGameStore(state => state.engineState?.marketRecentSales);
  const discoveredRecipes = useGameStore(state => state.engineState?.discoveredRecipes);

  const [shippedItems, setShippedItems] = useState(null);
  const [earnedCredits, setEarnedCredits] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!shippedItems) {
      return undefined;
    }
    const timer = setTimeout(() => setShippedItems(null), 600);
    return () => clearTimeout(timer);
  }, [shippedItems]);

  useEffect(() => {
    if (earnedCredits === null) {
      return undefined;
    }
    const timer = setTimeout(() => setEarnedCredits(null), 1200);
    return () => clearTimeout(timer);
  }, [earnedCredits]);

  const materialsById = useMemo(
    () => new Map((rules?.materials || []).map((material) => [material.id, material])),
    [rules?.materials]
  );

  const inventoryEntries = useMemo(
    () => Object.entries(inventory || {}).sort(([idA], [idB]) => {
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

  const inventoryInsights = useInventoryInsights({
    inventory,
    materialsById,
    materialThroughput,
    inventoryCapacity,
  });

  const bottleneckEntries = useMemo(
    () => inventoryInsights.bottlenecks.map((row) => [row.itemId, row.quantity]),
    [inventoryInsights.bottlenecks]
  );

  const stockpileEntries = useMemo(
    () => inventoryInsights.stockpile.map((row) => [row.itemId, row.quantity]),
    [inventoryInsights.stockpile]
  );

  const readyToShipEntries = useMemo(
    () => inventoryInsights.readyToShip.map((row) => [row.itemId, row.quantity]),
    [inventoryInsights.readyToShip]
  );

  const totalItems = Object.values(inventory || {}).reduce((a, b) => a + b, 0);

  const upgradeAmount = rules?.inventorySpace?.upgradeAmount ?? 100;
  const currentLevel = Math.floor((inventoryCapacity || 0) / upgradeAmount);
  const upgradeCost = Math.floor(
    (rules?.inventorySpace?.baseCost ?? 50) * Math.pow(rules?.inventorySpace?.costGrowth ?? 1.5, currentLevel)
  );
  const canAffordUpgrade = credits >= upgradeCost;

  const ticksSinceShipment = tick - lastShipmentTick;
  const isOnCooldown = ticksSinceShipment < shipmentCooldownTicks;
  const cooldownRemaining = isOnCooldown ? shipmentCooldownTicks - ticksSinceShipment : 0;
  const cooldownProgress = isOnCooldown ? (ticksSinceShipment / shipmentCooldownTicks) * 100 : 100;
  const hasFinalGoods = readyToShipEntries.length > 0;
  const canShip = !isOnCooldown && hasFinalGoods;

  const projectedShipment = useMemo(() => {
    const finalGoods = Object.entries(inventory || {}).filter(([itemId, qty]) => {
      const material = materialsById.get(itemId);
      return qty > 0 && material?.category === 'final';
    });

    if (finalGoods.length === 0) {
      return { totalCredits: 0, itemsSold: [] };
    }

    const marketRules = rules?.market || {};
    const recentWindow = tick - (marketRules.diversificationWindow ?? 0);
    const uniqueRecentSales = new Set(
      (marketRecentSales || [])
        .filter((sale) => sale.tick > recentWindow)
        .map((sale) => sale.itemId)
    );
    const bonusThresholds = Object.keys(marketRules.diversificationBonuses || {})
      .map(Number)
      .sort((a, b) => b - a);

    let totalCredits = 0;
    const itemsSold = [];

    for (const [itemId, quantity] of finalGoods) {
      const material = materialsById.get(itemId);
      if (!material) continue;

      let diversificationBonus = 1.0;
      for (const threshold of bonusThresholds) {
        if (uniqueRecentSales.size >= threshold) {
          diversificationBonus = marketRules.diversificationBonuses[threshold];
          break;
        }
      }

      const basePrice = Number(material.basePrice) || 0;
      const popularity = marketPopularity?.[itemId] || 1.0;
      const obsolescence = calculateObsolescence(material.age, discoveredRecipes, rules);
      const eventModifier = marketEvents?.[itemId]?.modifier || 1.0;
      const pricePerUnit = basePrice * popularity * diversificationBonus * obsolescence * eventModifier;
      const credits = Math.floor(pricePerUnit * quantity);

      itemsSold.push({ itemId, quantity, credits });
      totalCredits += credits;
      uniqueRecentSales.add(itemId);
    }

    return { totalCredits, itemsSold };
  }, [
    inventory,
    materialsById,
    rules,
    tick,
    marketRecentSales,
    marketPopularity,
    marketEvents,
    discoveredRecipes,
  ]);

  const handleShipGoods = useCallback(() => {
    if (!canShip || typeof shipGoods !== 'function') {
      return;
    }

    const captured = readyToShipEntries.map(([itemId, quantity]) => ({ itemId, quantity }));
    const result = shipGoods();

    if (!result?.error && result?.shipmentResult) {
      setShippedItems(captured);
      setEarnedCredits(result.shipmentResult.totalCredits);
    }
  }, [canShip, readyToShipEntries, shipGoods]);

  const shipButtonTooltip = !hasFinalGoods
    ? t('game.factory.nothingToShip', 'No final goods to ship')
    : (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        <Typography variant="caption" sx={{ color: 'inherit', fontWeight: 600 }}>
          {isOnCooldown
            ? t('game.factory.shipCooldown', 'Next shipment in {{ticks}} ticks', { ticks: cooldownRemaining })
            : t('game.factory.shipGoodsTooltip', 'Sell all final goods')}
        </Typography>
        <Typography variant="caption" sx={{ color: 'inherit' }}>
          {t('game.factory.shipTotalPreview', 'Total: +{{credits}}', {
            credits: formatCredits(projectedShipment.totalCredits),
          })}
        </Typography>
        {projectedShipment.itemsSold.map(({ itemId, quantity, credits: lineCredits }) => (
          <Typography key={`ship-preview-${itemId}`} variant="caption" component="div" sx={{ color: 'inherit' }}>
            {t('game.factory.shipBreakdownLine', '{{name}} x{{quantity}}: +{{credits}}', {
              name: getMaterialName(itemId, materialsById.get(itemId)?.name),
              quantity,
              credits: formatCredits(lineCredits),
            })}
          </Typography>
        ))}
      </Box>
    );

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

  const renderChipCollection = (entries, { isShipping = false } = {}) => (
    entries.map((entry) => renderInventoryChip(entry, isShipping))
  );

  const renderSectionCard = ({ title, count, children, actions = null, footer = null, scrollable = true }) => (
    <Paper
      variant="outlined"
      sx={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 1,
          py: 0.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'action.hover',
          gap: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {title} ({count})
        </Typography>
        {actions}
      </Box>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: scrollable ? 'auto' : 'hidden',
          p: 1,
          display: 'flex',
          flexWrap: 'wrap',
          alignContent: 'flex-start',
          gap: 0.5,
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': { backgroundColor: 'action.disabled', borderRadius: 3 },
        }}
      >
        {children}
      </Box>
      {footer && (
        <Box
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            px: 1,
            py: 0.25,
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
          }}
        >
          {footer}
        </Box>
      )}
    </Paper>
  );

  const renderInventoryContent = () => {
    if (inventoryEntries.length === 0 && !shippedItems) {
      return (
        <Box sx={{ p: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t('game.factory.emptyInventory')}
          </Typography>
        </Box>
      );
    }

    const displayedBottlenecks = bottleneckEntries.slice(0, 8);
    const displayedStockpile = stockpileEntries.slice(0, 6);
    const displayedReadyToShip = shippedItems
      ? shippedItems.slice(0, 8).map((item) => [item.itemId, item.quantity])
      : readyToShipEntries.slice(0, 8);

    const shipActions = (
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
              {hasFinalGoods
                ? t('game.factory.shipGoodsWithCredits', 'Ship Goods (+{{credits}})', {
                  credits: formatCredits(projectedShipment.totalCredits),
                })
                : t('game.factory.shipGoods', 'Ship Goods')}
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
    );

    return (
      <Box
        ref={ref}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          overflow: 'hidden',
          minHeight: 0,
          gap: 1,
          p: 1,
        }}
      >
        {renderSectionCard({
          title: t('game.factory.readyToShip', 'Ready to Ship'),
          count: shippedItems ? shippedItems.length : readyToShipEntries.length,
          actions: shipActions,
          children: displayedReadyToShip.length > 0
            ? renderChipCollection(displayedReadyToShip, { isShipping: Boolean(shippedItems) })
            : <Typography variant="body2" color="text.secondary">{t('game.factory.nothingToShip', 'No final goods to ship')}</Typography>,
        })}

        {renderSectionCard({
          title: t('game.factory.bottlenecks', 'Bottlenecks'),
          count: bottleneckEntries.length,
          children: displayedBottlenecks.length > 0
            ? renderChipCollection(displayedBottlenecks)
            : <Typography variant="body2" color="text.secondary">{t('game.factory.noBottlenecks', 'No bottlenecks detected')}</Typography>,
        })}

        {renderSectionCard({
          title: t('game.factory.stockpile', 'Stockpile'),
          count: stockpileEntries.length,
          scrollable: false,
          children: displayedStockpile.length > 0
            ? renderChipCollection(displayedStockpile)
            : <Typography variant="body2" color="text.secondary">{t('game.factory.noStockpileItems', 'No high-stock items')}</Typography>,
          footer: stockpileEntries.length > displayedStockpile.length ? (
            <Button
              size="small"
              variant="text"
              onClick={() => setDrawerOpen(true)}
              sx={{ py: 0, px: 0, minWidth: 0, textTransform: 'none', fontSize: '0.75rem' }}
            >
              {t('game.factory.moreStockpileItems', '+{{count}} more stock items', {
                count: stockpileEntries.length - displayedStockpile.length,
              })}
            </Button>
          ) : null,
        })}
      </Box>
    );
  };

  return (
    <>
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
          minHeight: INVENTORY_HEIGHT,
          maxHeight: INVENTORY_HEIGHT,
        }}
      >
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
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
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
            <Tooltip title={t('game.factory.expandInventoryTooltip', '+{{amount}} capacity ({{cost}})', { amount: upgradeAmount, cost: formatCredits(upgradeCost) })}>
              <span>
                <IconButton
                  size="small"
                  disabled={!canAffordUpgrade}
                  onClick={() => buyInventorySpace?.()}
                  sx={{ p: 0.25 }}
                >
                  <AddIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setDrawerOpen(true)}
              sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
            >
              {t('game.factory.browseAllParts', 'Browse all parts')}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1, fontFamily: 'monospace' }}>
              {t('game.tick')}: {tick}
            </Typography>
            <TickProgressIndicator />
            <PlayControls />
          </Box>
        </Box>

        {renderInventoryContent()}
      </Paper>

      <InventoryBrowserDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        rows={inventoryInsights.rows}
      />
    </>
  );
});

export default FactoryBottomBar;
