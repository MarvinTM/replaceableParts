import { useMemo, useState } from 'react';
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
import { getEligibleTargetedResearchOptions } from '../../utils/targetedResearch';
import { calculateHighestUnlockedAge } from '../../engine/engine.js';

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

  const targetedMultiplier = rules.research.targetedExperimentMultiplier || 10;
  const highestUnlockedAge = useMemo(
    () => (engineState ? calculateHighestUnlockedAge(engineState, rules) : 1),
    [engineState, rules]
  );

  const targetedOptions = useMemo(() => (
    getEligibleTargetedResearchOptions({
      rules,
      discoveredRecipes: engineState?.discoveredRecipes || [],
      unlockedRecipes: engineState?.unlockedRecipes || [],
      maxRecipeAge: highestUnlockedAge,
    })
  ), [rules, engineState?.discoveredRecipes, engineState?.unlockedRecipes, highestUnlockedAge]);

  const allTargetedOptions = useMemo(
    () => [...targetedOptions.materialRecipes, ...targetedOptions.productionEnablers],
    [targetedOptions.materialRecipes, targetedOptions.productionEnablers]
  );
  const totalEligibleTargeted = allTargetedOptions.length;

  const targetedCosts = allTargetedOptions
    .map((target) => target.targetedCost)
    .filter((cost) => Number.isFinite(cost));
  const minTargetedCost = targetedCosts.length > 0 ? Math.min(...targetedCosts) : null;
  const maxTargetedCost = targetedCosts.length > 0 ? Math.max(...targetedCosts) : null;
  const targetedCostLabel = minTargetedCost === null
    ? '-- RP'
    : minTargetedCost === maxTargetedCost
      ? `${minTargetedCost} RP`
      : `${minTargetedCost}-${maxTargetedCost} RP`;
  const canRunTargetedExperiment = totalEligibleTargeted > 0 && minTargetedCost !== null && researchPoints >= minTargetedCost;

  const handleRunRandomExperiment = () => {
    runExperiment();
  };

  const handleOpenTargetedPopup = () => {
    setTargetedPopupOpen(true);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <ScienceIcon sx={{ fontSize: 24, color: 'secondary.main' }} />
        <Typography variant="h6">{t('research.experimentChamber')}</Typography>
      </Box>

      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        p: 2,
        borderRadius: 2,
        bgcolor: 'action.hover',
        border: '2px dashed',
        borderColor: canRunRandomExperiment || canRunTargetedExperiment ? 'secondary.main' : 'divider'
      }}>
        <AutoAwesomeIcon sx={{ fontSize: 52, color: canRunRandomExperiment || canRunTargetedExperiment ? 'secondary.main' : 'text.disabled' }} />

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" gutterBottom>
            {t('research.runExperimentsDesc')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {undiscoveredCount} {t('research.recipesRemaining')}
          </Typography>
        </Box>

        <Divider sx={{ width: '100%', my: 0.5 }} />

        {/* Random Experiment Section */}
        <Box sx={{ width: '100%', textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="caption">{t('research.random')}:</Typography>
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
            size="small"
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="caption">{t('research.targeted')}:</Typography>
            <Chip
              label={targetedCostLabel}
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
            size="small"
            startIcon={<TargetIcon />}
            disabled={!canRunTargetedExperiment}
            onClick={handleOpenTargetedPopup}
            fullWidth
          >
            {t('research.runTargetedExperiment')}
          </Button>
          {totalEligibleTargeted === 0 && undiscoveredCount > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {t('research.noEligibleTargets')}
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
        eligibleMaterialRecipes={targetedOptions.materialRecipes}
        eligibleEnablerRecipes={targetedOptions.productionEnablers}
        minTargetedCost={minTargetedCost}
        maxTargetedCost={maxTargetedCost}
        researchPoints={researchPoints}
      />
    </Box>
  );
}
