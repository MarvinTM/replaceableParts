import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import { getMaterialName, getRecipeName } from '../../utils/translationHelpers';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import RecipeIODisplay from '../common/RecipeIODisplay';

export default function RecipeDropdown({
  machine,
  position,
  unlockedRecipes,
  recentRecipeIds = [],
  rules,
  onSelectRecipe,
  onClose,
  cheatMode = false
}) {
  const { t } = useTranslation();

  if (!machine || !position) return null;

  // Get the machine configuration to find allowed recipes
  const machineConfig = rules?.machines?.find(m => m.id === machine.type);
  const allowedRecipes = machineConfig?.allowedRecipes || [];

  const searchInputRef = useRef(null);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [activeRecipeId, setActiveRecipeId] = useState(machine.recipeId || null);

  const materialsById = useMemo(() => {
    return new Map((rules?.materials || []).map(material => [material.id, material]));
  }, [rules?.materials]);

  const availableRecipes = useMemo(() => {
    // In cheat mode: show all recipes this machine supports (even if not unlocked)
    // Normal mode: only show recipes that are both unlocked AND supported by this machine
    return allowedRecipes
      .filter(recipeId => cheatMode || (unlockedRecipes || []).includes(recipeId))
      .map((recipeId) => rules?.recipes?.find(r => r.id === recipeId))
      .filter(Boolean)
      .map((recipe) => {
        const recipeName = getRecipeName(recipe.id);
        const inputIds = Object.keys(recipe.inputs || {});
        const outputIds = Object.keys(recipe.outputs || {});
        const outputSummary = outputIds
          .slice(0, 2)
          .map((materialId) => {
            const quantity = recipe.outputs?.[materialId];
            const material = materialsById.get(materialId);
            return `${quantity}x ${getMaterialName(materialId, material?.name)}`;
          })
          .join(', ');
        const outputOverflow = outputIds.length > 2 ? ` +${outputIds.length - 2}` : '';
        const searchIndex = [
          recipe.id,
          recipeName,
          ...inputIds,
          ...outputIds,
          ...inputIds.map((materialId) => {
            const material = materialsById.get(materialId);
            return getMaterialName(materialId, material?.name);
          }),
          ...outputIds.map((materialId) => {
            const material = materialsById.get(materialId);
            return getMaterialName(materialId, material?.name);
          })
        ]
          .join(' ')
          .toLowerCase();

        return {
          ...recipe,
          recipeName,
          outputSummary,
          outputOverflow,
          inputCount: inputIds.length,
          age: recipe.age || 1,
          searchIndex,
        };
      });
  }, [allowedRecipes, cheatMode, materialsById, rules?.recipes, unlockedRecipes]);

  const ageOptions = useMemo(() => {
    const uniqueAges = new Set(availableRecipes.map((recipe) => recipe.age || 1));
    return Array.from(uniqueAges).sort((a, b) => a - b);
  }, [availableRecipes]);

  const recentRecipeSet = useMemo(() => {
    return new Set(recentRecipeIds || []);
  }, [recentRecipeIds]);

  const recentRank = useMemo(() => {
    return new Map((recentRecipeIds || []).map((recipeId, index) => [recipeId, index]));
  }, [recentRecipeIds]);

  const filteredRecipes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return availableRecipes
      .filter((recipe) => {
        if (filterMode === 'recent' && !recentRecipeSet.has(recipe.id)) {
          return false;
        }
        if (filterMode.startsWith('age:') && recipe.age !== Number(filterMode.slice(4))) {
          return false;
        }
        if (normalizedSearch && !recipe.searchIndex.includes(normalizedSearch)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (filterMode === 'recent') {
          const rankA = recentRank.has(a.id) ? recentRank.get(a.id) : Number.MAX_SAFE_INTEGER;
          const rankB = recentRank.has(b.id) ? recentRank.get(b.id) : Number.MAX_SAFE_INTEGER;
          if (rankA !== rankB) {
            return rankA - rankB;
          }
          return a.recipeName.localeCompare(b.recipeName);
        }

        // Keep currently assigned recipe at the top to make status obvious.
        if (a.id === machine.recipeId && b.id !== machine.recipeId) return -1;
        if (b.id === machine.recipeId && a.id !== machine.recipeId) return 1;
        return a.recipeName.localeCompare(b.recipeName);
      });
  }, [availableRecipes, filterMode, machine.recipeId, recentRank, recentRecipeSet, search]);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Reset picker state when switching to a different machine.
    setSearch('');
    setFilterMode('all');
    setActiveRecipeId(machine.recipeId || null);
  }, [machine.id, machine.recipeId]);

  useEffect(() => {
    if (filteredRecipes.length === 0) {
      setActiveRecipeId(null);
      return;
    }

    const hasActiveRecipe = filteredRecipes.some((recipe) => recipe.id === activeRecipeId);
    if (!hasActiveRecipe) {
      setActiveRecipeId(filteredRecipes[0].id);
    }
  }, [activeRecipeId, filteredRecipes]);

  const handleSelectRecipe = (recipeId) => {
    onSelectRecipe?.(machine.id, recipeId);
  };

  const handleClearRecipe = () => {
    onSelectRecipe?.(machine.id, null);
  };

  const handleSearchKeyDown = (event) => {
    if (filteredRecipes.length === 0) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const currentIndex = filteredRecipes.findIndex(recipe => recipe.id === activeRecipeId);
      const isArrowDown = event.key === 'ArrowDown';
      const nextIndex = currentIndex === -1
        ? 0
        : (currentIndex + (isArrowDown ? 1 : -1) + filteredRecipes.length) % filteredRecipes.length;
      setActiveRecipeId(filteredRecipes[nextIndex].id);
    }

    if (event.key === 'Enter' && activeRecipeId) {
      event.preventDefault();
      handleSelectRecipe(activeRecipeId);
    }
  };

  return (
    <Popover
      open={true}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={{ top: position.top, left: position.left }}
      PaperProps={{
        sx: {
          width: { xs: 'min(94vw, 420px)', sm: 400 },
          maxWidth: 'calc(100vw - 16px)',
        },
      }}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
          {t('game.factory.selectRecipe', 'Select Recipe')}
        </Typography>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {t('game.factory.recipeCount', '{{count}} recipes available', { count: availableRecipes.length })}
        </Typography>

        {machine.recipeId && (
          <Chip
            label={t('game.factory.currentRecipe', { recipe: getRecipeName(machine.recipeId) })}
            color="primary"
            size="small"
            sx={{ mb: 1 }}
          />
        )}

        <TextField
          inputRef={searchInputRef}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          size="small"
          fullWidth
          label={t('game.factory.searchRecipes', 'Search recipes')}
          placeholder={t('game.factory.searchRecipesPlaceholder', 'Name, id, input, output')}
          sx={{ mb: 1 }}
        />

        {ageOptions.length > 1 && (
          <Stack direction="row" spacing={0.75} sx={{ mb: 1, flexWrap: 'wrap', rowGap: 0.75 }}>
            <Chip
              label={t('game.factory.allAges', 'All')}
              size="small"
              clickable
              color={filterMode === 'all' ? 'primary' : 'default'}
              variant={filterMode === 'all' ? 'filled' : 'outlined'}
              onClick={() => setFilterMode('all')}
            />
            {recentRecipeIds.length > 0 && (
              <Chip
                label={t('game.factory.recentRecipes', { defaultValue: 'Recent' })}
                size="small"
                clickable
                color={filterMode === 'recent' ? 'primary' : 'default'}
                variant={filterMode === 'recent' ? 'filled' : 'outlined'}
                onClick={() => setFilterMode('recent')}
              />
            )}
            {ageOptions.map((age) => {
              const ageValue = `age:${age}`;
              return (
                <Chip
                  key={age}
                  label={`T${age}`}
                  size="small"
                  clickable
                  color={filterMode === ageValue ? 'primary' : 'default'}
                  variant={filterMode === ageValue ? 'filled' : 'outlined'}
                  onClick={() => setFilterMode(ageValue)}
                />
              );
            })}
          </Stack>
        )}

        <Divider sx={{ my: 1 }} />

        <List dense sx={{ maxHeight: 420, overflow: 'auto' }} data-testid="recipe-options-list">
          {/* None/Idle option */}
          <ListItemButton
            data-testid="recipe-option-none"
            selected={!machine.recipeId}
            onClick={handleClearRecipe}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'action.selected'
              }
            }}
          >
            <ListItemText
              primary={t('game.factory.noRecipe', 'None (Idle)')}
              secondary={t('game.factory.noRecipeDesc', 'Machine will be idle')}
            />
          </ListItemButton>

          <Divider sx={{ my: 1 }} />

          {/* Available recipes */}
          {availableRecipes.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
              {t('game.factory.noRecipesAvailable', 'No recipes unlocked yet')}
            </Typography>
          ) : filteredRecipes.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
              {t('game.factory.noRecipesMatchFilter', 'No recipes match the current filters')}
            </Typography>
          ) : (
            filteredRecipes.map((recipe) => (
              <ListItemButton
                key={recipe.id}
                data-testid={`recipe-option-${recipe.id}`}
                data-recipe-id={recipe.id}
                selected={machine.recipeId === recipe.id}
                onClick={() => handleSelectRecipe(recipe.id)}
                onMouseEnter={() => setActiveRecipeId(recipe.id)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  ...(activeRecipeId === recipe.id && machine.recipeId !== recipe.id
                    ? { backgroundColor: 'action.hover' }
                    : null)
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        {recipe.recipeName}
                      </Typography>
                      <Chip
                        label={`T${recipe.age}`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 18, fontSize: '0.65rem' }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.25 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {t('game.factory.outputs', 'Outputs')}: {recipe.outputSummary}{recipe.outputOverflow}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {t('game.factory.inputsCount', '{{count}} inputs', { count: recipe.inputCount })}
                      </Typography>
                      {(machine.recipeId === recipe.id || activeRecipeId === recipe.id) && (
                        <Box sx={{ mt: 0.5 }}>
                          <RecipeIODisplay recipe={recipe} materials={rules?.materials} iconSize={16} />
                        </Box>
                      )}
                    </Box>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItemButton>
            ))
          )}
        </List>
      </Box>
    </Popover>
  );
}
