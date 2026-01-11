import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';

// Format recipe inputs/outputs for display
function formatRecipeIO(recipe, materials) {
  const formatItems = (items) => {
    return Object.entries(items)
      .map(([itemId, qty]) => {
        const material = materials?.find(m => m.id === itemId);
        const name = material?.name || itemId;
        return `${name} x${qty}`;
      })
      .join(', ');
  };

  const inputs = formatItems(recipe.inputs);
  const outputs = formatItems(recipe.outputs);

  return `${inputs} -> ${outputs}`;
}

export default function RecipeDropdown({
  machine,
  position,
  unlockedRecipes,
  rules,
  onSelectRecipe,
  onClose
}) {
  const { t } = useTranslation();

  if (!machine || !position) return null;

  // Get the machine configuration to find allowed recipes
  const machineConfig = rules?.machines?.find(m => m.id === machine.type);
  const allowedRecipes = machineConfig?.allowedRecipes || [];

  // Get available recipes (only unlocked ones that this machine type supports)
  const availableRecipes = (unlockedRecipes || [])
    .filter(recipeId => allowedRecipes.includes(recipeId)) // Filter by machine's allowed recipes
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
            label={t('game.factory.currentRecipe', { recipe: machine.recipeId })}
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
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.dark',
                    '&:hover': {
                      backgroundColor: 'primary.main'
                    }
                  }
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {recipe.id.replace(/_/g, ' ')}
                      </Typography>
                      <Chip
                        label={`T${recipe.tier || 1}`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 18, fontSize: '0.65rem' }}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {formatRecipeIO(recipe, rules?.materials)}
                    </Typography>
                  }
                />
              </ListItemButton>
            ))
          )}
        </List>
      </Box>
    </Popover>
  );
}
