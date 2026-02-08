import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MaterialIcon from './MaterialIcon';
import { getMaterialName } from '../../utils/translationHelpers';

// Render recipe inputs/outputs with icons
export default function RecipeIODisplay({ recipe, materials, iconSize = 20 }) {
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
            materialName={getMaterialName(itemId, material?.name)}
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
