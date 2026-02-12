import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import TimerIcon from '@mui/icons-material/Timer';
import useGameStore from '../../stores/gameStore';
import MaterialIcon from '../common/MaterialIcon';
import StructureSpriteIcon from '../common/StructureSpriteIcon';
import RecipeIODisplay from '../common/RecipeIODisplay';
import { getMaterialName, getRecipeName, getMaterialDescription } from '../../utils/translationHelpers';
import { formatCredits } from '../../utils/currency';

const AGE_COLORS = {
  1: '#8B4513',
  2: '#CD7F32',
  3: '#708090',
  4: '#FF8C00',
  5: '#4169E1',
  6: '#9370DB',
  7: '#00CED1'
};

const VICTORY_COLOR = '#FFD700';

export default function EncyclopediaTab() {
  const { t } = useTranslation();

  const engineState = useGameStore((state) => state.engineState);
  const rules = useGameStore((state) => state.rules);

  const [searchQuery, setSearchQuery] = useState('');
  const [ageFilters, setAgeFilters] = useState({
    1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true
  });
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [machineFilter, setMachineFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);

  // Reverse lookup: recipe -> machines that produce it
  const recipeMachinesMap = useMemo(() => {
    const map = {};
    if (!rules?.machines) return map;
    for (const machine of rules.machines) {
      if (!machine.allowedRecipes) continue;
      for (const recipeId of machine.allowedRecipes) {
        if (!map[recipeId]) map[recipeId] = [];
        map[recipeId].push(machine);
      }
    }
    return map;
  }, [rules?.machines]);

  // Build visible recipes (discovered + unlocked only)
  const visibleRecipes = useMemo(() => {
    if (!rules?.recipes || !engineState) return [];
    const discovered = new Set(engineState.discoveredRecipes || []);
    const unlocked = new Set(engineState.unlockedRecipes || []);

    return rules.recipes
      .filter(r => discovered.has(r.id) || unlocked.has(r.id))
      .map(recipe => {
        const status = unlocked.has(recipe.id) ? 'unlocked' : 'discovered';
        const primaryOutputId = Object.keys(recipe.outputs)[0];
        const primaryOutputMat = rules.materials?.find(m => m.id === primaryOutputId);
        const category = primaryOutputMat?.category || 'unknown';
        const machines = recipeMachinesMap[recipe.id] || [];

        return {
          ...recipe,
          status,
          category,
          primaryOutputId,
          primaryOutputMat,
          machines,
        };
      });
  }, [rules?.recipes, rules?.materials, engineState?.discoveredRecipes, engineState?.unlockedRecipes, recipeMachinesMap]);

  // Filter and sort recipes
  const filteredRecipes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return visibleRecipes
      .filter(recipe => {
        // Age filter
        if (!ageFilters[recipe.age || 1]) return false;

        // Category filter
        if (categoryFilter !== 'all') {
          if (categoryFilter === 'parts' && recipe.category !== 'intermediate') return false;
          if (categoryFilter === 'finalGoods' && recipe.category !== 'final') return false;
        }

        // Machine filter
        if (machineFilter !== 'all') {
          if (!recipe.machines.some(m => m.id === machineFilter)) return false;
        }

        // Status filter
        if (statusFilter !== 'all' && recipe.status !== statusFilter) return false;

        // Text search
        if (query) {
          const recipeName = getRecipeName(recipe.id).toLowerCase();
          const outputName = recipe.primaryOutputId
            ? getMaterialName(recipe.primaryOutputId, recipe.primaryOutputMat?.name).toLowerCase()
            : '';
          if (!recipeName.includes(query) && !outputName.includes(query)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const ageDiff = (a.age || 1) - (b.age || 1);
        if (ageDiff !== 0) return ageDiff;
        return getRecipeName(a.id).localeCompare(getRecipeName(b.id));
      });
  }, [visibleRecipes, searchQuery, ageFilters, categoryFilter, machineFilter, statusFilter]);

  // Available machines for machine filter dropdown
  const availableMachines = useMemo(() => {
    const machineIds = new Set();
    for (const recipe of visibleRecipes) {
      for (const machine of recipe.machines) {
        machineIds.add(machine.id);
      }
    }
    return (rules?.machines || []).filter(m => machineIds.has(m.id));
  }, [visibleRecipes, rules?.machines]);

  const selectedRecipe = selectedRecipeId
    ? visibleRecipes.find(r => r.id === selectedRecipeId)
    : null;
  const generatorConfigById = useMemo(
    () => new Map((rules?.generators || []).map(generator => [generator.id, generator])),
    [rules?.generators]
  );
  const selectedFuelRequirement = useMemo(() => {
    if (!selectedRecipe) return null;

    const outputMaterialIds = Object.keys(selectedRecipe.outputs || {});
    const matchingGenerator =
      outputMaterialIds
        .map((materialId) => generatorConfigById.get(materialId))
        .find((generator) => generator?.fuelRequirement)
      || generatorConfigById.get(selectedRecipe.id);

    return matchingGenerator?.fuelRequirement || null;
  }, [selectedRecipe, generatorConfigById]);

  if (!engineState || !rules) return null;

  const renderRecipeMaterialIcon = (materialId, material, size) => {
    const materialName = getMaterialName(materialId, material?.name);
    const category = material?.category;

    if (category === 'equipment') {
      return (
        <StructureSpriteIcon
          structureId={materialId}
          materialId={materialId}
          materialName={materialName}
          category={category}
          size={size}
        />
      );
    }

    return (
      <MaterialIcon
        materialId={materialId}
        materialName={materialName}
        category={category}
        size={size}
      />
    );
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 2, p: 2 }}>
      {/* Left Panel - Filters + Grid */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
        {/* Filter Bar */}
        <Paper sx={{ p: 1.5 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
            <TextField
              label={t('encyclopedia.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {t('encyclopedia.age')}:
              </Typography>
              {[1, 2, 3, 4, 5, 6, 7].map(age => (
                <Chip
                  key={age}
                  label={age}
                  size="small"
                  sx={{
                    bgcolor: ageFilters[age] ? AGE_COLORS[age] : undefined,
                    color: ageFilters[age] ? 'white' : undefined,
                    fontWeight: 'bold',
                  }}
                  variant={ageFilters[age] ? 'filled' : 'outlined'}
                  onClick={() => setAgeFilters(prev => ({ ...prev, [age]: !prev[age] }))}
                />
              ))}
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {t('encyclopedia.category')}:
              </Typography>
              {['all', 'parts', 'finalGoods'].map(cat => (
                <Chip
                  key={cat}
                  label={t(`encyclopedia.cat_${cat}`)}
                  size="small"
                  color={categoryFilter === cat ? 'primary' : 'default'}
                  variant={categoryFilter === cat ? 'filled' : 'outlined'}
                  onClick={() => setCategoryFilter(cat)}
                />
              ))}
            </Box>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>{t('encyclopedia.machine')}</InputLabel>
              <Select
                value={machineFilter}
                label={t('encyclopedia.machine')}
                onChange={(e) => setMachineFilter(e.target.value)}
              >
                <MenuItem value="all">{t('encyclopedia.allMachines')}</MenuItem>
                {availableMachines.map(machine => (
                  <MenuItem key={machine.id} value={machine.id}>
                    {getMaterialName(machine.id, machine.name)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {t('encyclopedia.status')}:
              </Typography>
              {['all', 'discovered', 'unlocked'].map(status => (
                <Chip
                  key={status}
                  label={t(`encyclopedia.status_${status}`)}
                  size="small"
                  color={statusFilter === status ? 'primary' : 'default'}
                  variant={statusFilter === status ? 'filled' : 'outlined'}
                  onClick={() => setStatusFilter(status)}
                />
              ))}
            </Box>
          </Box>
        </Paper>

        {/* Recipe Count + Grid */}
        <Paper sx={{ p: 2, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Typography variant="h6">{t('encyclopedia.title')}</Typography>
            <Chip label={filteredRecipes.length} size="small" />
          </Box>

          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', pr: 0.5 }}>
            {filteredRecipes.length > 0 ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
                {filteredRecipes.map(recipe => {
                  const age = recipe.age || 1;
                  return (
                    <Paper
                      key={recipe.id}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        cursor: 'pointer',
                        border: selectedRecipeId === recipe.id ? 2 : 1,
                        borderColor: selectedRecipeId === recipe.id ? 'primary.main' : 'divider',
                        '&:hover': { borderColor: 'primary.main' },
                      }}
                      onClick={() => setSelectedRecipeId(recipe.id)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {renderRecipeMaterialIcon(recipe.primaryOutputId, recipe.primaryOutputMat, 32)}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body1" fontWeight="bold" noWrap>
                            {getRecipeName(recipe.id)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                          <Chip
                            label={recipe.victory ? t('research.singularity', 'Singularity') : `${t('encyclopedia.ageShort')}${age}`}
                            size="small"
                            sx={{
                              bgcolor: recipe.victory ? VICTORY_COLOR : AGE_COLORS[age],
                              color: recipe.victory ? '#000' : 'white',
                              fontWeight: 'bold',
                              height: 20,
                              fontSize: '0.7rem',
                            }}
                          />
                          <Chip
                            label={t(`encyclopedia.status_${recipe.status}`)}
                            size="small"
                            color={recipe.status === 'unlocked' ? 'success' : 'warning'}
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                      </Box>

                      <RecipeIODisplay recipe={recipe} materials={rules.materials} iconSize={18} />
                    </Paper>
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  {visibleRecipes.length > 0
                    ? t('encyclopedia.noMatchingRecipes')
                    : t('encyclopedia.noRecipesYet')
                  }
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Right Panel - Detail */}
      <Box sx={{ width: 380, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <Paper sx={{ p: 2 }}>
          {selectedRecipe ? (
            <Box>
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                {renderRecipeMaterialIcon(selectedRecipe.primaryOutputId, selectedRecipe.primaryOutputMat, 56)}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {getRecipeName(selectedRecipe.id)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getMaterialDescription(selectedRecipe.primaryOutputId)}
                  </Typography>
                </Box>
              </Box>

              {/* Status chips */}
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                <Chip
                  label={t(`encyclopedia.status_${selectedRecipe.status}`)}
                  size="small"
                  color={selectedRecipe.status === 'unlocked' ? 'success' : 'warning'}
                />
                <Chip
                  label={selectedRecipe.victory ? t('research.singularity', 'Singularity') : `${t('encyclopedia.ageShort')}${selectedRecipe.age || 1}`}
                  size="small"
                  sx={{
                    bgcolor: selectedRecipe.victory ? VICTORY_COLOR : AGE_COLORS[selectedRecipe.age || 1],
                    color: selectedRecipe.victory ? '#000' : 'white',
                    fontWeight: 'bold',
                  }}
                />
                <Chip
                  label={t(`encyclopedia.cat_${selectedRecipe.category === 'final' ? 'finalGoods' : selectedRecipe.category === 'intermediate' ? 'parts' : 'other'}`)}
                  size="small"
                  variant="outlined"
                />
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Inputs */}
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('encyclopedia.inputs')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2 }}>
                {Object.entries(selectedRecipe.inputs).map(([matId, qty]) => {
                  const mat = rules.materials?.find(m => m.id === matId);
                  return (
                    <Box key={matId} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {mat?.category === 'equipment' ? (
                        <StructureSpriteIcon
                          structureId={matId}
                          materialId={matId}
                          materialName={getMaterialName(matId, mat?.name)}
                          category={mat?.category}
                          size={24}
                        />
                      ) : (
                        <MaterialIcon
                          materialId={matId}
                          materialName={getMaterialName(matId, mat?.name)}
                          category={mat?.category}
                          size={24}
                          showTooltip
                        />
                      )}
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {getMaterialName(matId, mat?.name)}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        x{qty}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              {/* Outputs */}
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('encyclopedia.outputs')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2 }}>
                {Object.entries(selectedRecipe.outputs).map(([matId, qty]) => {
                  const mat = rules.materials?.find(m => m.id === matId);
                  return (
                    <Box key={matId} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {mat?.category === 'equipment' ? (
                        <StructureSpriteIcon
                          structureId={matId}
                          materialId={matId}
                          materialName={getMaterialName(matId, mat?.name)}
                          category={mat?.category}
                          size={24}
                        />
                      ) : (
                        <MaterialIcon
                          materialId={matId}
                          materialName={getMaterialName(matId, mat?.name)}
                          category={mat?.category}
                          size={24}
                          showTooltip
                        />
                      )}
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {getMaterialName(matId, mat?.name)}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        x{qty}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Production info */}
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('encyclopedia.production')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TimerIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2">{t('encyclopedia.ticksToComplete')}</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="bold">
                    {selectedRecipe.ticks || '—'}
                  </Typography>
                </Box>
                {selectedRecipe.primaryOutputMat?.basePrice && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{t('encyclopedia.basePrice')}</Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {formatCredits(selectedRecipe.primaryOutputMat.basePrice)}
                    </Typography>
                  </Box>
                )}
                {selectedFuelRequirement && (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Typography variant="body2">{t('encyclopedia.fuelType')}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                        <MaterialIcon
                          materialId={selectedFuelRequirement.materialId}
                          materialName={getMaterialName(selectedFuelRequirement.materialId)}
                          category={rules.materials?.find(m => m.id === selectedFuelRequirement.materialId)?.category}
                          size={20}
                        />
                        <Typography variant="body2" fontWeight="bold" noWrap>
                          {getMaterialName(selectedFuelRequirement.materialId)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{t('encyclopedia.fuelConsumption')}</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {selectedFuelRequirement.consumptionRate} {t('game.factory.perTick', '/ tick')}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>

              {/* Produced By */}
              {selectedRecipe.machines.length > 0 && (
                <>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t('encyclopedia.producedBy')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {selectedRecipe.machines.map(machine => (
                      <Box key={machine.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StructureSpriteIcon
                          structureId={machine.id}
                          materialId={machine.id}
                          materialName={getMaterialName(machine.id, machine.name)}
                          category="equipment"
                          size={20}
                        />
                        <Typography variant="body2">
                          {getMaterialName(machine.id, machine.name)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                {t('encyclopedia.selectRecipe')}
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
