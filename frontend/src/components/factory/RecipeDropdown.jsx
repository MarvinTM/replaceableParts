import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import { getRecipeName } from '../../utils/translationHelpers';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MaterialIcon from '../common/MaterialIcon';

// Render recipe inputs/outputs with icons
function RecipeIODisplay({ recipe, materials, iconSize = 20 }) {
  const renderItems = (items) => {
    return Object.entries(items).map(([itemId, qty], index) => {
      const material = materials?.find(m => m.id === itemId);
      return (
        <Box
          key={itemId}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.25,
            mr: index < Object.keys(items).length - 1 ? 0.75 : 0,
          }}
        >
          <MaterialIcon
            materialId={itemId}
            materialName={material?.name}
            category={material?.category}
            size={iconSize}
            showTooltip
            quantity={qty}
          />
          <Typography variant="caption" sx={{ fontWeight: 500, minWidth: 16 }}>
            {qty}
          </Typography>
        </Box>
      );
    });
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
      {renderItems(recipe.inputs)}
      <ArrowForwardIcon sx={{ fontSize: 14, color: 'text.disabled', mx: 0.5 }} />
      {renderItems(recipe.outputs)}
    </Box>
  );
}

export default function RecipeDropdown({
  machine,
  position,
  unlockedRecipes,
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

  // Get available recipes
  // In cheat mode: show all recipes this machine supports (even if not unlocked)
  // Normal mode: only show recipes that are both unlocked AND supported by this machine
  const availableRecipes = allowedRecipes
    .filter(recipeId => cheatMode || (unlockedRecipes || []).includes(recipeId)) // Skip unlock check if cheat mode
    .map(recipeId => rules?.recipes?.find(r => r.id === recipeId))
    .filter(Boolean);

  const handleSelectRecipe = (recipeId) => {
    onSelectRecipe?.(machine.id, recipeId);
  };

  const handleClearRecipe = () => {
    onSelectRecipe?.(machine.id, null);
  };

  return (
    <Popover
      open={true}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={{ top: position.top, left: position.left }}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
    >
      <Box sx={{ p: 2, minWidth: 280, maxWidth: 400 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
          {t('game.factory.selectRecipe', 'Select Recipe')}
        </Typography>

        {machine.recipeId && (
          <Chip
            label={t('game.factory.currentRecipe', { recipe: getRecipeName(machine.recipeId) })}
            color="primary"
            size="small"
            sx={{ mb: 1 }}
          />
        )}

        <Divider sx={{ my: 1 }} />

        <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
          {/* None/Idle option */}
          <ListItemButton
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
          ) : (
            availableRecipes.map((recipe) => (
              <ListItemButton
                key={recipe.id}
                selected={machine.recipeId === recipe.id}
                onClick={() => handleSelectRecipe(recipe.id)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        {getRecipeName(recipe.id)}
                      </Typography>
                      <Chip
                        label={`T${recipe.age || 1}`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 18, fontSize: '0.65rem' }}
                      />
                    </Box>
                  }
                  secondary={
                    <RecipeIODisplay recipe={recipe} materials={rules?.materials} iconSize={18} />
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
