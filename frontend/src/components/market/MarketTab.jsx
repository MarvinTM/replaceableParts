import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SellIcon from '@mui/icons-material/Sell';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import useGameStore from '../../stores/gameStore';
import MaterialIcon from '../common/MaterialIcon';
import { formatCredits } from '../../utils/currency';
import { getMaterialName } from '../../utils/translationHelpers';

const CHART_COLORS = [
  '#2563EB', // Blue
  '#F97316', // Orange
  '#16A34A', // Green
  '#E11D48', // Rose
  '#8B5CF6', // Purple
  '#0EA5E9', // Sky
  '#F59E0B', // Amber
  '#10B981'  // Teal
];

// Custom Legend with Material Icons
function CustomLegend({ payload }) {
  if (!payload || payload.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 1 }}>
      {payload.map((entry, index) => (
        <Box
          key={`legend-${index}`}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1,
            py: 0.5,
            borderRadius: 1,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider'
          }}
        >
          <MaterialIcon materialId={entry.dataKey} size={16} />
          <Box
            sx={{
              width: 20,
              height: 3,
              bgcolor: entry.color,
              borderRadius: 1
            }}
          />
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
            {entry.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export default function MarketTab() {
  const { t } = useTranslation();

  // Game state
  const engineState = useGameStore((state) => state.engineState);
  const rules = useGameStore((state) => state.rules);
  const sellGoods = useGameStore((state) => state.sellGoods);

  // Local state
  const [selectedItem, setSelectedItem] = useState(null);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [ageFilters, setAgeFilters] = useState({
    1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true
  });
  const [sortBy, setSortBy] = useState('quantity'); // 'age' | 'price' | 'quantity' | 'popularity'
  const [salesHistory, setSalesHistory] = useState([]); // Track sales for analytics
  const [sessionStartCredits, setSessionStartCredits] = useState(null);

  useEffect(() => {
    if (engineState && sessionStartCredits === null) {
      setSessionStartCredits(engineState.credits || 0);
    }
  }, [engineState, sessionStartCredits]);

  // Get discovered final goods based on discoveredRecipes
  const getDiscoveredFinalGoods = () => {
    const discoveredRecipes = engineState.discoveredRecipes || [];

    // Get all final goods from discovered recipes
    const discoveredFinalGoodIds = new Set();

    discoveredRecipes.forEach(recipeId => {
      const recipe = rules.recipes.find(r => r.id === recipeId);
      if (recipe && recipe.outputs) {
        Object.keys(recipe.outputs).forEach(outputId => {
          const material = rules.materials.find(m => m.id === outputId);
          if (material && material.category === 'final') {
            discoveredFinalGoodIds.add(outputId);
          }
        });
      }
    });

    // Convert to full material objects
    return Array.from(discoveredFinalGoodIds)
      .map(id => rules.materials.find(m => m.id === id))
      .filter(Boolean);
  };

  // Get market event for an item (if any)
  const getMarketEvent = (itemId) => {
    return engineState.marketEvents?.[itemId] || null;
  };

  // Get event modifier for an item
  const getEventModifier = (itemId) => {
    const event = getMarketEvent(itemId);
    return event?.modifier || 1.0;
  };

  // Calculate current price for an item (includes popularity, obsolescence, and event modifier)
  const getCurrentPrice = (itemId) => {
    const material = rules.materials.find(m => m.id === itemId);
    if (!material) return 0;

    const popularity = engineState.marketPopularity?.[itemId] || 1.0;
    const obsolescence = getObsolescence(material.age);
    const eventModifier = getEventModifier(itemId);
    return Math.floor(material.basePrice * popularity * obsolescence * eventModifier);
  };

  // Get popularity for an item
  const getPopularity = (itemId) => {
    return engineState.marketPopularity?.[itemId] || 1.0;
  };

  // Get inventory quantity
  const getInventoryQuantity = (itemId) => {
    return engineState.inventory?.[itemId] || 0;
  };

  // Calculate obsolescence for an age
  const getObsolescence = (age) => {
    if (!rules.market.obsolescenceEnabled) {
      return 1.0;
    }

    const nextAge = age + 1;
    if (nextAge > 7) {
      return 1.0;
    }

    // Count total final goods recipes for next age
    const nextAgeFinalGoods = rules.recipes.filter(recipe => {
      const outputs = Object.keys(recipe.outputs || {});
      return outputs.some(outputId => {
        const material = rules.materials.find(m => m.id === outputId);
        return material && material.category === 'final' && material.age === nextAge;
      });
    });

    const totalNextAgeRecipes = nextAgeFinalGoods.length;
    if (totalNextAgeRecipes === 0) {
      return 1.0;
    }

    // Count discovered final goods recipes from next age
    const discoveredRecipes = engineState.discoveredRecipes || [];
    const discoveredNextAgeRecipes = nextAgeFinalGoods.filter(recipe =>
      discoveredRecipes.includes(recipe.id)
    ).length;

    // Calculate progress and debuff
    const progress = discoveredNextAgeRecipes / totalNextAgeRecipes;
    const debuff = progress * rules.market.obsolescenceMaxDebuff;

    return 1.0 - debuff;
  };

  // Final goods list with filters
  const filteredFinalGoods = useMemo(() => {
    const discovered = getDiscoveredFinalGoods();
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return discovered
      .map(material => {
        const event = getMarketEvent(material.id);
        return {
          ...material,
          quantity: getInventoryQuantity(material.id),
          currentPrice: getCurrentPrice(material.id),
          popularity: getPopularity(material.id),
          obsolescence: getObsolescence(material.age),
          eventModifier: event?.modifier || null,
          eventType: event?.type || null,
          eventExpiresAt: event?.expiresAt || null
        };
      })
      .filter(item => ageFilters[item.age])
      .filter(item => {
        if (!normalizedQuery) return true;
        const name = getMaterialName(item.id, item.name).toLowerCase();
        return name.includes(normalizedQuery);
      });
  }, [
    engineState.inventory,
    engineState.marketPopularity,
    engineState.marketEvents,
    engineState.discoveredRecipes,
    engineState.tick,
    ageFilters,
    searchQuery,
    rules
  ]);

  const inStockItems = useMemo(() => {
    const items = filteredFinalGoods.filter(item => item.quantity > 0);
    const sorted = [...items];

    if (sortBy === 'age') sorted.sort((a, b) => a.age - b.age);
    if (sortBy === 'price') sorted.sort((a, b) => b.currentPrice - a.currentPrice);
    if (sortBy === 'quantity') sorted.sort((a, b) => b.quantity - a.quantity);
    if (sortBy === 'popularity') sorted.sort((a, b) => b.popularity - a.popularity);

    return sorted;
  }, [filteredFinalGoods, sortBy]);

  const outOfStockItems = useMemo(() => {
    return filteredFinalGoods
      .filter(item => item.quantity === 0)
      .sort((a, b) => {
        if (a.age !== b.age) return a.age - b.age;
        const aName = getMaterialName(a.id, a.name);
        const bName = getMaterialName(b.id, b.name);
        return aName.localeCompare(bName);
      });
  }, [filteredFinalGoods]);

  // Market intelligence - hot and cold items
  const marketIntelligence = useMemo(() => {
    const discovered = getDiscoveredFinalGoods();
    const allItems = discovered.map(material => ({
      ...material,
      popularity: getPopularity(material.id),
      currentPrice: getCurrentPrice(material.id)
    }));

    const intelligenceLimit = 3;

    const hotItems = allItems
      .filter(item => item.popularity >= 1.2)
      .sort((a, b) => b.popularity - a.popularity);
    const coldItems = allItems
      .filter(item => item.popularity <= 0.8)
      .sort((a, b) => a.popularity - b.popularity);

    const hot = hotItems.slice(0, intelligenceLimit);
    const cold = coldItems.slice(0, intelligenceLimit);

    return {
      hot,
      cold,
      hotCount: hotItems.length,
      coldCount: coldItems.length
    };
  }, [engineState.marketPopularity, engineState.discoveredRecipes, engineState.tick, rules]);

  // Diversification bonus calculation
  const diversificationStats = useMemo(() => {
    const recentSales = engineState.marketRecentSales || [];
    const windowStart = engineState.tick - rules.market.diversificationWindow;
    const validSales = recentSales.filter(sale => sale.tick > windowStart);
    const uniqueItemsSold = new Set(validSales.map(sale => sale.itemId)).size;

    // Find applicable bonus
    let bonusMultiplier = 1.0;
    let nextThreshold = null;
    const bonusThresholds = Object.keys(rules.market.diversificationBonuses)
      .map(Number)
      .sort((a, b) => b - a); // Sort descending

    for (const threshold of bonusThresholds) {
      if (uniqueItemsSold >= threshold) {
        bonusMultiplier = rules.market.diversificationBonuses[threshold];
        break;
      }
    }

    // Find next threshold to unlock
    const sortedAscending = [...bonusThresholds].sort((a, b) => a - b);
    for (const threshold of sortedAscending) {
      if (uniqueItemsSold < threshold) {
        nextThreshold = threshold;
        break;
      }
    }

    return {
      uniqueItemsSold,
      bonusMultiplier,
      bonusPercent: Math.round((bonusMultiplier - 1) * 100),
      nextThreshold,
      nextBonus: nextThreshold ? rules.market.diversificationBonuses[nextThreshold] : null
    };
  }, [engineState.marketRecentSales, engineState.tick, rules]);

  // Obsolescence stats (technological advancement penalties)
  const obsolescenceStats = useMemo(() => {
    const stats = [];

    for (let age = 1; age <= 7; age++) {
      const obsolescenceMultiplier = getObsolescence(age);
      const debuffPercent = Math.round((1.0 - obsolescenceMultiplier) * 100);

      if (debuffPercent > 0) {
        const nextAge = age + 1;

        // Count recipes discovered in next age
        const nextAgeFinalGoods = rules.recipes.filter(recipe => {
          const outputs = Object.keys(recipe.outputs || {});
          return outputs.some(outputId => {
            const material = rules.materials.find(m => m.id === outputId);
            return material && material.category === 'final' && material.age === nextAge;
          });
        });

        const discoveredRecipes = engineState.discoveredRecipes || [];
        const discoveredNextAge = nextAgeFinalGoods.filter(recipe =>
          discoveredRecipes.includes(recipe.id)
        ).length;
        const totalNextAge = nextAgeFinalGoods.length;

        stats.push({
          age,
          nextAge,
          debuffPercent,
          discoveredNextAge,
          totalNextAge,
          progressPercent: Math.round((discoveredNextAge / totalNextAge) * 100)
        });
      }
    }

    return stats;
  }, [engineState.discoveredRecipes, engineState.tick, rules]);

  const sessionRevenue = useMemo(() => {
    return salesHistory.reduce((sum, sale) => sum + sale.totalPrice, 0);
  }, [salesHistory]);

  const totalCredits = engineState.credits || 0;
  const sessionPercentIncrease = sessionStartCredits
    ? Math.round((sessionRevenue / sessionStartCredits) * 100)
    : 0;

  // Handle selling
  const handleSell = (itemId, quantity) => {
    const material = rules.materials.find(m => m.id === itemId);
    const inventoryQty = getInventoryQuantity(itemId);

    if (quantity > inventoryQty) {
      alert(`Not enough ${material.name} in inventory!`);
      return;
    }

    const pricePerUnit = getCurrentPrice(itemId);
    const totalPrice = pricePerUnit * quantity;

    // Dispatch sell action
    sellGoods(itemId, quantity);

    // Track sale
    setSalesHistory(prev => [...prev, {
      tick: engineState.tick,
      itemId,
      itemName: material.name,
      quantity,
      pricePerUnit,
      totalPrice
    }]);

    // Reset selection
    setSelectedItem(null);
    setSellQuantity(1);
  };

  // Handle sell all
  const handleSellAll = (itemId) => {
    const quantity = getInventoryQuantity(itemId);
    if (quantity > 0) {
      handleSell(itemId, quantity);
    }
  };

  // Get popularity status
  const getPopularityStatus = (popularity) => {
    if (popularity >= 1.2) return { label: 'Healthy', color: 'success', icon: <TrendingUpIcon /> };
    if (popularity >= 0.8) return { label: 'Stable', color: 'warning', icon: <TrendingFlatIcon /> };
    if (popularity >= 0.5) return { label: 'Saturated', color: 'error', icon: <TrendingDownIcon /> };
    return { label: 'Crashed', color: 'error', icon: <TrendingDownIcon /> };
  };

  const chartItems = useMemo(() => {
    const discovered = getDiscoveredFinalGoods();
    if (discovered.length === 0) return [];

    const history = engineState.marketPriceHistory || [];
    const hasHistory = history.length >= 2;

    const items = discovered.map(material => {
      const event = getMarketEvent(material.id);
      const eventMagnitude = event ? Math.abs(event.modifier - 1) : 0;
      const popularity = getPopularity(material.id);
      const popularityDeviation = Math.abs(popularity - 1);
      const quantity = getInventoryQuantity(material.id);
      let trendMagnitude = 0;

      if (hasHistory) {
        const first = history[0][material.id];
        const last = history[history.length - 1][material.id];
        if (typeof first === 'number' && typeof last === 'number' && first > 0) {
          trendMagnitude = Math.abs((last - first) / first);
        }
      }

      return {
        ...material,
        quantity,
        eventMagnitude,
        popularityDeviation,
        trendMagnitude
      };
    });

    const selected = [];
    const addUnique = (item) => {
      if (item && !selected.find(existing => existing.id === item.id)) {
        selected.push(item);
      }
    };

    const byEvent = items
      .filter(item => item.eventMagnitude > 0)
      .sort((a, b) => b.eventMagnitude - a.eventMagnitude);
    const byPopularity = items
      .filter(item => item.popularityDeviation >= 0.2)
      .sort((a, b) => b.popularityDeviation - a.popularityDeviation);
    const byTrend = items
      .filter(item => item.trendMagnitude > 0)
      .sort((a, b) => b.trendMagnitude - a.trendMagnitude);
    const byQuantity = items
      .filter(item => item.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity);

    byEvent.forEach(addUnique);
    byPopularity.forEach(addUnique);
    byTrend.forEach(addUnique);
    byQuantity.forEach(addUnique);
    items.forEach(addUnique);

    return selected.slice(0, 5);
  }, [
    engineState.marketEvents,
    engineState.marketPopularity,
    engineState.marketPriceHistory,
    engineState.inventory,
    engineState.discoveredRecipes,
    engineState.tick,
    rules
  ]);

  const chartColors = useMemo(() => {
    const colors = {};
    chartItems.forEach((item, index) => {
      colors[item.id] = CHART_COLORS[index % CHART_COLORS.length];
    });
    return colors;
  }, [chartItems]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return engineState.marketPriceHistory || [];
  }, [engineState.marketPriceHistory]);

  const discoveredFinalGoods = getDiscoveredFinalGoods();
  const hasDiscoveredFinalGoods = discoveredFinalGoods.length > 0;
  const hasFilteredItems = filteredFinalGoods.length > 0;

  const renderItemCard = (item) => {
    const status = getPopularityStatus(item.popularity);
    return (
      <Paper
        key={item.id}
        variant="outlined"
        sx={{
          p: 1.5,
          cursor: 'pointer',
          border: selectedItem?.id === item.id ? 2 : 1,
          borderColor: selectedItem?.id === item.id ? 'primary.main' : 'divider',
          '&:hover': { borderColor: 'primary.main' }
        }}
        onClick={() => {
          setSelectedItem(item);
          setSellQuantity(Math.min(1, item.quantity));
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <MaterialIcon materialId={item.id} size={32} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" fontWeight="bold">{getMaterialName(item.id, item.name)}</Typography>
            <Typography variant="caption" color="text.secondary">{t('market.age')} {item.age}</Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Chip label={t(`market.${status.label.toLowerCase()}`)} color={status.color} size="small" />
            {item.obsolescence < 1.0 && (
              <Chip
                label={`-${Math.round((1 - item.obsolescence) * 100)}% ${t('market.obsolete')}`}
                color="warning"
                size="small"
              />
            )}
            {item.eventModifier && (
              <Tooltip title={t('market.externalEvent', { ticks: item.eventExpiresAt - engineState.tick })}>
                <Chip
                  icon={item.eventType === 'positive' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  label={`${item.eventType === 'positive' ? '+' : ''}${Math.round((item.eventModifier - 1) * 100)}%`}
                  color={item.eventType === 'positive' ? 'success' : 'error'}
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              </Tooltip>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2">{t('market.inStock')}: {item.quantity}</Typography>
          <Typography variant="body2" fontWeight="bold" color="primary">
            {formatCredits(item.currentPrice, false)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            fullWidth
            startIcon={<SellIcon />}
            disabled={item.quantity === 0}
            onClick={(e) => {
              e.stopPropagation();
              handleSellAll(item.id);
            }}
          >
            {t('market.sellAll')} ({formatCredits(item.currentPrice * item.quantity)})
          </Button>
        </Box>
      </Paper>
    );
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 2, p: 2 }}>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Paper sx={{ p: 2, minWidth: 220, flex: '1 1 220px' }}>
            <Typography variant="subtitle2" color="text.secondary">
              {t('market.sessionRevenue')}
            </Typography>
            <Typography variant="h5" color="success.main">
              {formatCredits(sessionRevenue)}
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" color="text.secondary">
              {t('market.totalCredits')}
            </Typography>
            <Typography variant="h6">
              {formatCredits(totalCredits)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {t('market.sessionIncrease')}
              </Typography>
              <Chip
                label={`+${sessionPercentIncrease}%`}
                size="small"
                color={sessionRevenue > 0 ? 'success' : 'default'}
                variant={sessionRevenue > 0 ? 'filled' : 'outlined'}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {t('market.sinceOpen')}
            </Typography>
          </Paper>

          <Paper sx={{ p: 2, minWidth: 320, flex: '2 1 360px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6">{t('market.priceTrends')}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {chartItems.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {t('market.showingTopItems', { count: chartItems.length })}
                  </Typography>
                )}
                <Tooltip title={t('market.whyTheseItems')}>
                  <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
                </Tooltip>
              </Box>
            </Box>
            {chartItems.length > 0 && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tick" tickLine={false} />
                  <YAxis
                    tickFormatter={(value) => formatCredits(value, false)}
                    width={60}
                  />
                  <RechartsTooltip formatter={(value) => formatCredits(value)} />
                  <Legend content={<CustomLegend />} />
                  {chartItems.map(item => (
                    <Line
                      key={item.id}
                      type="monotone"
                      dataKey={item.id}
                      name={getMaterialName(item.id, item.name)}
                      stroke={chartColors[item.id]}
                      dot={false}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 6 }}>
                {hasDiscoveredFinalGoods ? t('market.noPriceHistory') : t('market.noFinalGoods')}
              </Typography>
            )}
          </Paper>

          <Paper sx={{ p: 2, minWidth: 220, flex: '1 1 240px' }}>
            <Typography variant="h6" gutterBottom>{t('market.marketIntelligence')}</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <LocalFireDepartmentIcon sx={{ fontSize: 18 }} color="error" />
                  <Typography variant="caption" fontWeight="bold">{t('market.hotItems')}</Typography>
                </Box>
                {marketIntelligence.hot.length > 0 ? (
                  marketIntelligence.hot.map(item => (
                    <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <MaterialIcon materialId={item.id} size={18} />
                      <Typography variant="caption" sx={{ flex: 1 }}>
                        {getMaterialName(item.id, item.name)}
                      </Typography>
                      <Chip
                        label={`${(item.popularity * 100).toFixed(0)}%`}
                        size="small"
                        color="success"
                      />
                    </Box>
                  ))
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    {t('market.noHotItems')}
                  </Typography>
                )}
              </Box>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <AcUnitIcon sx={{ fontSize: 18 }} color="info" />
                  <Typography variant="caption" fontWeight="bold">{t('market.saturatedMarkets')}</Typography>
                </Box>
                {marketIntelligence.cold.length > 0 ? (
                  marketIntelligence.cold.map(item => (
                    <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <MaterialIcon materialId={item.id} size={18} />
                      <Typography variant="caption" sx={{ flex: 1 }}>
                        {getMaterialName(item.id, item.name)}
                      </Typography>
                      <Chip
                        label={`${(item.popularity * 100).toFixed(0)}%`}
                        size="small"
                        color="error"
                      />
                    </Box>
                  ))
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    {t('market.noSaturatedMarkets')}
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        </Box>

        <Paper sx={{ p: 1.5 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
            <TextField
              label={t('market.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {t('market.ageGroups')}:
              </Typography>
              {[1, 2, 3, 4, 5, 6, 7].map(age => (
                <Chip
                  key={age}
                  label={age}
                  size="small"
                  color={ageFilters[age] ? 'primary' : 'default'}
                  variant={ageFilters[age] ? 'filled' : 'outlined'}
                  onClick={() => setAgeFilters(prev => ({ ...prev, [age]: !prev[age] }))}
                />
              ))}
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {t('market.sortBy')}:
              </Typography>
              {['age', 'price', 'quantity', 'popularity'].map(sort => (
                <Chip
                  key={sort}
                  label={t(`market.${sort}`)}
                  size="small"
                  color={sortBy === sort ? 'primary' : 'default'}
                  variant={sortBy === sort ? 'filled' : 'outlined'}
                  onClick={() => setSortBy(sort)}
                />
              ))}
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ p: 2, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom>{t('market.inventoryFinalGoods')}</Typography>

          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', pr: 0.5 }}>
            {inStockItems.length > 0 && (
              <Box sx={{ mb: outOfStockItems.length > 0 ? 2 : 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2">{t('market.inStockItems')}</Typography>
                  <Chip label={inStockItems.length} size="small" />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 2 }}>
                  {inStockItems.map(renderItemCard)}
                </Box>
              </Box>
            )}

            {outOfStockItems.length > 0 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2">{t('market.otherItems')}</Typography>
                  <Chip label={outOfStockItems.length} size="small" variant="outlined" />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 2 }}>
                  {outOfStockItems.map(renderItemCard)}
                </Box>
              </Box>
            )}

            {!hasFilteredItems && (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                {hasDiscoveredFinalGoods ? t('market.noMatchingItems') : t('market.noFinalGoods')}
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>

      <Box sx={{ width: 340, display: 'flex', flexDirection: 'column', gap: 2, overflow: 'auto' }}>
        <Paper sx={{ p: 2 }}>
          {selectedItem ? (
            <Box>
              <Typography variant="h6" gutterBottom>{t('market.sellPanel')}</Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MaterialIcon materialId={selectedItem.id} size={48} />
                <Box>
                  <Typography variant="body1" fontWeight="bold">{getMaterialName(selectedItem.id, selectedItem.name)}</Typography>
                  <Typography variant="caption" color="text.secondary">{t('market.age')} {selectedItem.age}</Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  {t('market.available')}: {selectedItem.quantity}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {t('market.pricePerUnit')}: {formatCredits(selectedItem.currentPrice, false)}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {t('market.marketStatus')}: {t(`market.${getPopularityStatus(selectedItem.popularity).label.toLowerCase()}`)}
                </Typography>
                {selectedItem.eventModifier && (
                  <Box sx={{
                    mt: 1,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: selectedItem.eventType === 'positive' ? 'success.dark' : 'rgba(198, 40, 40, 0.1)',
                    border: 1,
                    borderColor: selectedItem.eventType === 'positive' ? 'success.main' : 'error.main'
                  }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {selectedItem.eventType === 'positive' ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                      {t(`market.externalEvent${selectedItem.eventType === 'positive' ? 'Positive' : 'Negative'}`)}
                    </Typography>
                    <Typography variant="caption">
                      {selectedItem.eventType === 'positive' ? '+' : ''}{Math.round((selectedItem.eventModifier - 1) * 100)}% price modifier
                      ({selectedItem.eventExpiresAt - engineState.tick} ticks remaining)
                    </Typography>
                  </Box>
                )}
              </Box>

              <TextField
                label={t('market.quantity')}
                type="number"
                fullWidth
                size="small"
                value={sellQuantity}
                onChange={(e) => setSellQuantity(Math.max(1, Math.min(selectedItem.quantity, parseInt(e.target.value) || 1)))}
                inputProps={{ min: 1, max: selectedItem.quantity }}
                sx={{ mb: 2 }}
              />

              <Typography variant="h6" gutterBottom>
                {t('market.total')}: {formatCredits(selectedItem.currentPrice * sellQuantity)}
              </Typography>

              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<SellIcon />}
                disabled={selectedItem.quantity === 0 || sellQuantity > selectedItem.quantity}
                onClick={() => handleSell(selectedItem.id, sellQuantity)}
              >
                {t('market.sellFor', { quantity: sellQuantity, price: selectedItem.currentPrice * sellQuantity })}
              </Button>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                {t('market.selectItem')}
              </Typography>
            </Box>
          )}
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>{t('market.diversificationBonus')}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">
              {diversificationStats.uniqueItemsSold} {t(diversificationStats.uniqueItemsSold !== 1 ? 'market.uniqueItemsSoldPlural' : 'market.uniqueItemsSold')} {t('market.soldRecently')}
            </Typography>
            {diversificationStats.bonusPercent > 0 && (
              <Chip
                label={`+${diversificationStats.bonusPercent}%`}
                color="success"
                size="small"
              />
            )}
          </Box>
          {diversificationStats.nextThreshold && (
            <Typography variant="caption" color="text.secondary">
              {t((diversificationStats.nextThreshold - diversificationStats.uniqueItemsSold) !== 1 ? 'market.sellMoreTypesPlural' : 'market.sellMoreTypes', {
                count: diversificationStats.nextThreshold - diversificationStats.uniqueItemsSold,
                bonus: Math.round((diversificationStats.nextBonus - 1) * 100)
              })}
            </Typography>
          )}
          {!diversificationStats.nextThreshold && diversificationStats.bonusPercent > 0 && (
            <Typography variant="caption" color="success.main">
              {t('market.maxDiversification')}
            </Typography>
          )}
        </Paper>

        {obsolescenceStats.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>{t('market.technologicalObsolescence')}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {t('market.obsolescenceDesc')}
            </Typography>
            {obsolescenceStats.map(stat => (
              <Box key={stat.age} sx={{ mb: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight="bold">
                    {t('market.ageGoods', { age: stat.age })}
                  </Typography>
                  <Chip
                    label={`-${stat.debuffPercent}%`}
                    color="warning"
                    size="small"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {t('market.recipesDiscovered', {
                    discovered: stat.discoveredNextAge,
                    total: stat.totalNextAge,
                    age: stat.nextAge,
                    percent: stat.progressPercent
                  })}
                </Typography>
              </Box>
            ))}
            <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
              {t('market.obsolescenceWarning')}
            </Typography>
          </Paper>
        )}

        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            <InfoOutlinedIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
            {t('market.recommendations')}
          </Typography>
          {marketIntelligence.coldCount >= 2 ? (
            <Typography variant="body2">
              {t('market.marketsSaturated', { age: Math.max(...marketIntelligence.hot.map(i => i.age), 1) + 1 })}
            </Typography>
          ) : marketIntelligence.hot.length > 0 ? (
            <Typography variant="body2">
              {t('market.focusOnDemand', { item: getMaterialName(marketIntelligence.hot[0].id, marketIntelligence.hot[0].name) })}
            </Typography>
          ) : (
            <Typography variant="body2">
              {t('market.marketsStable')}
            </Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
