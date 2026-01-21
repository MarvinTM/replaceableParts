import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
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

// Age-based colors for chart lines
const AGE_COLORS = {
  1: '#8B4513', // Brown (wood age)
  2: '#CD7F32', // Bronze
  3: '#708090', // Slate gray (industrial)
  4: '#FF8C00', // Dark orange (combustion)
  5: '#4169E1', // Royal blue (electric)
  6: '#9370DB', // Medium purple (digital)
  7: '#00CED1'  // Dark turquoise (future)
};

// Custom Legend with Material Icons
function CustomLegend({ payload }) {
  if (!payload || payload.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 2 }}>
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
  const [ageFilters, setAgeFilters] = useState({
    1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true
  });
  const [sortBy, setSortBy] = useState('age'); // 'age' | 'price' | 'quantity' | 'popularity'
  const [salesHistory, setSalesHistory] = useState([]); // Track sales for analytics

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

  // Calculate current price for an item (includes popularity and obsolescence, but not diversification)
  const getCurrentPrice = (itemId) => {
    const material = rules.materials.find(m => m.id === itemId);
    if (!material) return 0;

    const popularity = engineState.marketPopularity?.[itemId] || 1.0;
    const obsolescence = getObsolescence(material.age);
    return Math.floor(material.basePrice * popularity * obsolescence);
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

  // Get all final goods in inventory with details
  const inventoryFinalGoods = useMemo(() => {
    const discovered = getDiscoveredFinalGoods();

    return discovered
      .map(material => ({
        ...material,
        quantity: getInventoryQuantity(material.id),
        currentPrice: getCurrentPrice(material.id),
        popularity: getPopularity(material.id),
        obsolescence: getObsolescence(material.age)
      }))
      .filter(item => item.quantity > 0 || true) // Show all discovered, even if qty=0
      .filter(item => ageFilters[item.age]) // Apply age filters
      .sort((a, b) => {
        if (sortBy === 'age') return a.age - b.age;
        if (sortBy === 'price') return b.currentPrice - a.currentPrice;
        if (sortBy === 'quantity') return b.quantity - a.quantity;
        if (sortBy === 'popularity') return b.popularity - a.popularity;
        return 0;
      });
  }, [engineState.inventory, engineState.marketPopularity, engineState.tick, ageFilters, sortBy]);

  // Market intelligence - hot and cold items
  const marketIntelligence = useMemo(() => {
    const discovered = getDiscoveredFinalGoods();
    const allItems = discovered.map(material => ({
      ...material,
      popularity: getPopularity(material.id),
      currentPrice: getCurrentPrice(material.id)
    }));

    const hot = allItems
      .filter(item => item.popularity >= 1.2)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5);

    const cold = allItems
      .filter(item => item.popularity <= 0.8)
      .sort((a, b) => a.popularity - b.popularity)
      .slice(0, 5);

    return { hot, cold };
  }, [engineState.marketPopularity, engineState.tick]);

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
  }, [engineState.marketRecentSales, engineState.tick]);

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
  }, [engineState.discoveredRecipes, engineState.tick]);

  // Revenue analytics
  const revenueAnalytics = useMemo(() => {
    const totalRevenue = salesHistory.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const last100Ticks = salesHistory
      .filter(sale => sale.tick >= engineState.tick - 100)
      .reduce((sum, sale) => sum + sale.totalPrice, 0);

    // Top sellers
    const salesByItem = {};
    salesHistory.forEach(sale => {
      if (!salesByItem[sale.itemId]) {
        salesByItem[sale.itemId] = { revenue: 0, quantity: 0, name: sale.itemName };
      }
      salesByItem[sale.itemId].revenue += sale.totalPrice;
      salesByItem[sale.itemId].quantity += sale.quantity;
    });

    const topSellers = Object.entries(salesByItem)
      .map(([itemId, data]) => ({ itemId, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return { totalRevenue, last100Ticks, topSellers };
  }, [salesHistory, engineState.tick]);

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

  // Prepare chart data
  const chartData = useMemo(() => {
    return engineState.marketPriceHistory || [];
  }, [engineState.marketPriceHistory]);

  const discoveredFinalGoods = getDiscoveredFinalGoods();

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 2, p: 2 }}>
      {/* LEFT SIDEBAR - Filters */}
      <Paper sx={{ width: 250, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6">Filters</Typography>
        <Divider />

        <Box>
          <Typography variant="subtitle2" gutterBottom>Age Groups</Typography>
          {[1, 2, 3, 4, 5, 6, 7].map(age => (
            <FormControlLabel
              key={age}
              control={
                <Checkbox
                  checked={ageFilters[age]}
                  onChange={(e) => setAgeFilters(prev => ({ ...prev, [age]: e.target.checked }))}
                  size="small"
                />
              }
              label={`Age ${age}`}
            />
          ))}
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle2" gutterBottom>Sort By</Typography>
          {['age', 'price', 'quantity', 'popularity'].map(sort => (
            <Button
              key={sort}
              fullWidth
              variant={sortBy === sort ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setSortBy(sort)}
              sx={{ mb: 0.5, justifyContent: 'flex-start' }}
            >
              {sort.charAt(0).toUpperCase() + sort.slice(1)}
            </Button>
          ))}
        </Box>
      </Paper>

      {/* MAIN CONTENT - Charts and Items */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflow: 'auto' }}>
        {/* Price Trends Chart */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Price Trends</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="tick"
                label={{ value: 'Tick', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                label={{ value: 'Price', angle: -90, position: 'insideLeft' }}
              />
              <RechartsTooltip />
              <Legend content={<CustomLegend />} />
              {discoveredFinalGoods.map(item => (
                <Line
                  key={item.id}
                  type="monotone"
                  dataKey={item.id}
                  name={item.name}
                  stroke={AGE_COLORS[item.age]}
                  dot={false}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          {discoveredFinalGoods.length === 0 && (
            <Typography variant="body2" color="text.secondary" align="center">
              No final goods discovered yet. Research recipes to unlock them!
            </Typography>
          )}
        </Paper>

        {/* Market Intelligence */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Market Intelligence</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Hot Items */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocalFireDepartmentIcon color="error" />
                <Typography variant="subtitle2">Hot Items (High Demand)</Typography>
              </Box>
              {marketIntelligence.hot.length > 0 ? (
                marketIntelligence.hot.map(item => (
                  <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <MaterialIcon materialId={item.id} size={20} />
                    <Typography variant="body2">{item.name}</Typography>
                    <Chip
                      label={`${(item.popularity * 100).toFixed(0)}%`}
                      size="small"
                      color="success"
                      icon={<TrendingUpIcon />}
                    />
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">No hot items</Typography>
              )}
            </Box>

            {/* Cold Items */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AcUnitIcon color="info" />
                <Typography variant="subtitle2">Saturated Markets</Typography>
              </Box>
              {marketIntelligence.cold.length > 0 ? (
                marketIntelligence.cold.map(item => (
                  <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <MaterialIcon materialId={item.id} size={20} />
                    <Typography variant="body2">{item.name}</Typography>
                    <Chip
                      label={`${(item.popularity * 100).toFixed(0)}%`}
                      size="small"
                      color="error"
                      icon={<TrendingDownIcon />}
                    />
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">No saturated markets</Typography>
              )}
            </Box>
          </Box>

          {/* Diversification Bonus */}
          <Box sx={{ mt: 2, p: 1.5, bgcolor: diversificationStats.bonusPercent > 0 ? 'success.dark' : 'action.hover', borderRadius: 1, border: 1, borderColor: diversificationStats.bonusPercent > 0 ? 'success.main' : 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Diversification Bonus
              </Typography>
              {diversificationStats.bonusPercent > 0 && (
                <Chip
                  label={`+${diversificationStats.bonusPercent}%`}
                  color="success"
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              )}
            </Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {diversificationStats.uniqueItemsSold} unique item{diversificationStats.uniqueItemsSold !== 1 ? 's' : ''} sold recently
            </Typography>
            {diversificationStats.nextThreshold && (
              <Typography variant="caption" color="text.secondary">
                Sell {diversificationStats.nextThreshold - diversificationStats.uniqueItemsSold} more type{(diversificationStats.nextThreshold - diversificationStats.uniqueItemsSold) !== 1 ? 's' : ''} to unlock +{Math.round((diversificationStats.nextBonus - 1) * 100)}% bonus
              </Typography>
            )}
            {!diversificationStats.nextThreshold && diversificationStats.bonusPercent > 0 && (
              <Typography variant="caption" color="success.light">
                Maximum diversification bonus achieved!
              </Typography>
            )}
          </Box>

          {/* Age Obsolescence */}
          {obsolescenceStats.length > 0 && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'warning.dark', borderRadius: 1, border: 1, borderColor: 'warning.main' }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Technological Obsolescence
              </Typography>
              <Typography variant="body2" sx={{ mb: 1.5 }}>
                Older products lose value as you discover newer technology
              </Typography>
              {obsolescenceStats.map(stat => (
                <Box key={stat.age} sx={{ mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight="bold">
                      Age {stat.age} goods
                    </Typography>
                    <Chip
                      label={`-${stat.debuffPercent}%`}
                      color="warning"
                      size="small"
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {stat.discoveredNextAge}/{stat.totalNextAge} Age {stat.nextAge} recipes discovered ({stat.progressPercent}%)
                  </Typography>
                </Box>
              ))}
              <Typography variant="caption" color="warning.light" sx={{ mt: 1, display: 'block' }}>
                Research and produce higher-age goods to maintain profits!
              </Typography>
            </Box>
          )}

          {/* Recommendations */}
          <Box sx={{ mt: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              <InfoOutlinedIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
              Recommendations
            </Typography>
            {marketIntelligence.cold.length > 3 ? (
              <Typography variant="body2">
                Many markets are saturated. Consider switching to Age {Math.max(...marketIntelligence.hot.map(i => i.age)) + 1}+ goods for better prices.
              </Typography>
            ) : marketIntelligence.hot.length > 0 ? (
              <Typography variant="body2">
                Focus on producing {marketIntelligence.hot[0].name} and other high-demand items for maximum profit.
              </Typography>
            ) : (
              <Typography variant="body2">
                Markets are stable. Diversify your production to maintain steady revenue.
              </Typography>
            )}
          </Box>
        </Paper>

        {/* Item Grid */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Inventory - Final Goods</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 2 }}>
            {inventoryFinalGoods.map(item => {
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
                      <Typography variant="body1" fontWeight="bold">{item.name}</Typography>
                      <Typography variant="caption" color="text.secondary">Age {item.age}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Chip label={status.label} color={status.color} size="small" />
                      {item.obsolescence < 1.0 && (
                        <Chip
                          label={`-${Math.round((1 - item.obsolescence) * 100)}% Obsolete`}
                          color="warning"
                          size="small"
                        />
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2">In Stock: {item.quantity}</Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      ${item.currentPrice}
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
                      Sell All (${item.currentPrice * item.quantity})
                    </Button>
                  </Box>
                </Paper>
              );
            })}
          </Box>
          {inventoryFinalGoods.length === 0 && (
            <Typography variant="body2" color="text.secondary" align="center">
              No final goods in inventory. Produce some items to sell!
            </Typography>
          )}
        </Paper>
      </Box>

      {/* RIGHT PANEL - Sell Interface & Analytics */}
      <Paper sx={{ width: 350, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Sell Panel */}
        {selectedItem ? (
          <Box>
            <Typography variant="h6" gutterBottom>Sell Panel</Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <MaterialIcon materialId={selectedItem.id} size={48} />
              <Box>
                <Typography variant="body1" fontWeight="bold">{selectedItem.name}</Typography>
                <Typography variant="caption" color="text.secondary">Age {selectedItem.age}</Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Available: {selectedItem.quantity}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Price per unit: ${selectedItem.currentPrice}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Market status: {getPopularityStatus(selectedItem.popularity).label}
              </Typography>
            </Box>

            <TextField
              label="Quantity"
              type="number"
              fullWidth
              size="small"
              value={sellQuantity}
              onChange={(e) => setSellQuantity(Math.max(1, Math.min(selectedItem.quantity, parseInt(e.target.value) || 1)))}
              inputProps={{ min: 1, max: selectedItem.quantity }}
              sx={{ mb: 2 }}
            />

            <Typography variant="h6" gutterBottom>
              Total: ${selectedItem.currentPrice * sellQuantity}
            </Typography>

            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<SellIcon />}
              disabled={selectedItem.quantity === 0 || sellQuantity > selectedItem.quantity}
              onClick={() => handleSell(selectedItem.id, sellQuantity)}
            >
              Sell {sellQuantity} for ${selectedItem.currentPrice * sellQuantity}
            </Button>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Select an item to sell
            </Typography>
          </Box>
        )}

        <Divider />

        {/* Revenue Analytics */}
        <Box>
          <Typography variant="h6" gutterBottom>Revenue Analytics</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
              <Typography variant="h5" color="success.main">
                ${revenueAnalytics.totalRevenue.toLocaleString()}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">Last 100 Ticks</Typography>
              <Typography variant="h6">
                ${revenueAnalytics.last100Ticks.toLocaleString()}
              </Typography>
            </Box>

            <Divider />

            <Typography variant="subtitle2" gutterBottom>Top Sellers</Typography>
            {revenueAnalytics.topSellers.length > 0 ? (
              revenueAnalytics.topSellers.map((seller, index) => (
                <Box key={seller.itemId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">
                    {index + 1}. {seller.name}
                  </Typography>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight="bold">
                      ${seller.revenue}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {seller.quantity} sold
                    </Typography>
                  </Box>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No sales yet
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
