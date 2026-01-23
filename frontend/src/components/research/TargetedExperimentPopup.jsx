import { useState } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TargetIcon from '@mui/icons-material/GpsFixed';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MaterialIcon from '../common/MaterialIcon';
import useGameStore from '../../stores/gameStore';

export default function TargetedExperimentPopup({
  open,
  onClose,
  eligibleRecipes,
  targetedCost,
  researchPoints
}) {
  const runTargetedExperiment = useGameStore((state) => state.runTargetedExperiment);
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);

  const canAfford = researchPoints >= targetedCost;
  const canRun = canAfford && selectedRecipeId !== null;

  const handleSelectRecipe = (recipeId) => {
    setSelectedRecipeId(recipeId);
  };

  const handleRunExperiment = () => {
    if (selectedRecipeId) {
      runTargetedExperiment(selectedRecipeId);
      setSelectedRecipeId(null);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedRecipeId(null);
    onClose();
  };

  // Sort eligible recipes by age, then by name
  const sortedRecipes = [...eligibleRecipes].sort((a, b) => {
    if (a.materialAge !== b.materialAge) {
      return (a.materialAge || 0) - (b.materialAge || 0);
    }
    return a.materialName.localeCompare(b.materialName);
  });

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { minHeight: 400 } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TargetIcon sx={{ color: 'warning.main' }} />
          <Typography variant="h6">Targeted Experiment</Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Select a specific recipe to research. These are materials needed by recipes you've already discovered or unlocked.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Typography variant="body2">Cost:</Typography>
            <Chip
              label={`${targetedCost} RP`}
              color={canAfford ? 'warning' : 'error'}
              size="small"
            />
            {!canAfford && (
              <Typography variant="caption" color="error.main">
                (Need {targetedCost - researchPoints} more RP)
              </Typography>
            )}
          </Box>
        </Box>

        {sortedRecipes.length === 0 ? (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
            color: 'text.secondary'
          }}>
            <Typography variant="body1">
              No eligible recipes available
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              All required materials have already been researched.
            </Typography>
          </Box>
        ) : (
          <List sx={{ bgcolor: 'background.default', borderRadius: 1 }}>
            {sortedRecipes.map(({ recipe, outputId, materialName, materialAge, neededBy }) => (
              <ListItemButton
                key={recipe.id}
                selected={selectedRecipeId === recipe.id}
                onClick={() => handleSelectRecipe(recipe.id)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  border: '1px solid',
                  borderColor: selectedRecipeId === recipe.id ? 'warning.main' : 'transparent',
                  '&.Mui-selected': {
                    bgcolor: 'warning.dark',
                    '&:hover': {
                      bgcolor: 'warning.dark',
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 56 }}>
                  <MaterialIcon materialId={outputId} size={40} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography component="span" variant="body1" fontWeight="medium">
                        {materialName}
                      </Typography>
                      {materialAge && (
                        <Chip
                          label={`Age ${materialAge}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    neededBy.length > 0 && (
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                        <Typography component="span" variant="caption" color="text.secondary">
                          Needed for:
                        </Typography>
                        {neededBy.slice(0, 3).map((name, idx) => (
                          <Box component="span" key={idx} sx={{ display: 'inline-flex', alignItems: 'center' }}>
                            <ArrowForwardIcon sx={{ fontSize: 12, color: 'text.secondary', mr: 0.25 }} />
                            <Typography component="span" variant="caption" color="primary.light">
                              {name}
                            </Typography>
                          </Box>
                        ))}
                        {neededBy.length > 3 && (
                          <Typography component="span" variant="caption" color="text.secondary">
                            +{neededBy.length - 3} more
                          </Typography>
                        )}
                      </Box>
                    )
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={handleRunExperiment}
          disabled={!canRun}
          startIcon={<TargetIcon />}
        >
          Research Selected ({targetedCost} RP)
        </Button>
      </DialogActions>
    </Dialog>
  );
}
