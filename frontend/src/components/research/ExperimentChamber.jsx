import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import ScienceIcon from '@mui/icons-material/Science';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TargetIcon from '@mui/icons-material/GpsFixed';
import useGameStore from '../../stores/gameStore';
import TargetedExperimentPopup from './TargetedExperimentPopup';

export default function ExperimentChamber({
  researchPoints,
  experimentCost,
  undiscoveredCount
}) {
  const { t } = useTranslation();
  const runExperiment = useGameStore((state) => state.runExperiment);
  const rules = useGameStore((state) => state.rules);
  const engineState = useGameStore((state) => state.engineState);

  const [targetedPopupOpen, setTargetedPopupOpen] = useState(false);

  const canRunRandomExperiment = researchPoints >= experimentCost && undiscoveredCount > 0;

  // Calculate targeted experiment cost
  const targetedMultiplier = rules.research.targetedExperimentMultiplier || 10;
  const targetedCost = experimentCost * targetedMultiplier;

  // Find eligible recipes for targeted experiments:
  // Parts that are required for any recipes that have been researched (discovered or unlocked),
  // but whose prototype cannot be produced because the required input hasn't been researched yet
  const getEligibleTargetedRecipes = () => {
    if (!rules?.recipes || !rules?.materials) return [];

    const discoveredOrUnlocked = new Set([
      ...(engineState?.discoveredRecipes || []),
      ...(engineState?.unlockedRecipes || [])
    ]);

    // Get all input materials needed by discovered/unlocked recipes
    const neededInputMaterials = new Set();
    for (const recipeId of discoveredOrUnlocked) {
      const recipe = rules.recipes.find(r => r.id === recipeId);
      if (recipe?.inputs) {
        for (const inputMaterialId of Object.keys(recipe.inputs)) {
          neededInputMaterials.add(inputMaterialId);
        }
      }
    }

    // Find recipes that produce these needed materials but haven't been discovered yet
    const eligibleRecipes = [];
    for (const recipe of rules.recipes) {
      // Skip if already discovered or unlocked
      if (discoveredOrUnlocked.has(recipe.id)) continue;

      // Check if this recipe produces any of the needed materials
      const outputMaterialIds = Object.keys(recipe.outputs || {});
      const producesNeededMaterial = outputMaterialIds.some(id => neededInputMaterials.has(id));

      if (producesNeededMaterial) {
        // Find which recipes need this output
        const outputId = outputMaterialIds[0];
        const material = rules.materials.find(m => m.id === outputId);
        const neededBy = [];

        for (const recipeId of discoveredOrUnlocked) {
          const r = rules.recipes.find(rec => rec.id === recipeId);
          if (r?.inputs && Object.keys(r.inputs).includes(outputId)) {
            const rOutputId = Object.keys(r.outputs || {})[0];
            const rMaterial = rules.materials.find(m => m.id === rOutputId);
            neededBy.push(rMaterial?.name || r.id);
          }
        }

        eligibleRecipes.push({
          recipe,
          outputId,
          materialName: material?.name || recipe.id,
          materialAge: material?.age,
          neededBy
        });
      }
    }

    return eligibleRecipes;
  };

  const eligibleTargetedRecipes = getEligibleTargetedRecipes();
  const canRunTargetedExperiment = researchPoints >= targetedCost && eligibleTargetedRecipes.length > 0;

  const handleRunRandomExperiment = () => {
    runExperiment();
  };

  const handleOpenTargetedPopup = () => {
    setTargetedPopupOpen(true);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <ScienceIcon sx={{ fontSize: 28, color: 'secondary.main' }} />
        <Typography variant="h6">{t('research.experimentChamber')}</Typography>
      </Box>

      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
        borderRadius: 2,
        bgcolor: 'action.hover',
        border: '2px dashed',
        borderColor: canRunRandomExperiment || canRunTargetedExperiment ? 'secondary.main' : 'divider'
      }}>
        <AutoAwesomeIcon sx={{ fontSize: 64, color: canRunRandomExperiment || canRunTargetedExperiment ? 'secondary.main' : 'text.disabled' }} />

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body1" gutterBottom>
            {t('research.runExperimentsDesc')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {undiscoveredCount} {t('research.recipesRemaining')}
          </Typography>
        </Box>

        <Divider sx={{ width: '100%', my: 1 }} />

        {/* Random Experiment Section */}
        <Box sx={{ width: '100%', textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
            <Typography variant="body2">{t('research.random')}:</Typography>
            <Chip
              label={`${experimentCost} RP`}
              color={canRunRandomExperiment ? 'primary' : 'default'}
              variant={canRunRandomExperiment ? 'filled' : 'outlined'}
              size="small"
            />
          </Box>
          <Button
            variant="contained"
            color="secondary"
            size="medium"
            startIcon={<ScienceIcon />}
            disabled={!canRunRandomExperiment}
            onClick={handleRunRandomExperiment}
            fullWidth
          >
            {t('research.runRandomExperiment')}
          </Button>
        </Box>

        <Divider sx={{ width: '100%' }} />

        {/* Targeted Experiment Section */}
        <Box sx={{ width: '100%', textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
            <Typography variant="body2">{t('research.targeted')}:</Typography>
            <Chip
              label={`${targetedCost} RP`}
              color={canRunTargetedExperiment ? 'warning' : 'default'}
              variant={canRunTargetedExperiment ? 'filled' : 'outlined'}
              size="small"
            />
            <Chip
              label={`${targetedMultiplier}x`}
              size="small"
              variant="outlined"
              color="warning"
            />
          </Box>
          <Button
            variant="outlined"
            color="warning"
            size="medium"
            startIcon={<TargetIcon />}
            disabled={!canRunTargetedExperiment}
            onClick={handleOpenTargetedPopup}
            fullWidth
          >
            {t('research.runTargetedExperiment')}
          </Button>
          {eligibleTargetedRecipes.length === 0 && undiscoveredCount > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {t('research.noMissingInputs')}
            </Typography>
          )}
        </Box>

        {undiscoveredCount === 0 && (
          <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
            {t('research.allRecipesDiscovered')}
          </Typography>
        )}
      </Box>

      <TargetedExperimentPopup
        open={targetedPopupOpen}
        onClose={() => setTargetedPopupOpen(false)}
        eligibleRecipes={eligibleTargetedRecipes}
        targetedCost={targetedCost}
        researchPoints={researchPoints}
      />
    </Box>
  );
}
