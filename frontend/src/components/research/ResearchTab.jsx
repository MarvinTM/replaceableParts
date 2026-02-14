import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import useGameStore from '../../stores/gameStore';
import { calculateHighestUnlockedAge, calculatePassiveDiscoveryChanceDetails } from '../../engine/engine.js';
import { getRecipeAge } from '../../utils/researchCosts.js';
import ExperimentChamber from './ExperimentChamber';
import DonateSection from './DonateSection';
import PrototypeWorkshop from './PrototypeWorkshop';
import UnlockedRecipesGrid from './UnlockedRecipesGrid';
import PassiveDiscoveryPanel from './PassiveDiscoveryPanel';

export default function ResearchTab() {
  const { t } = useTranslation();

  const engineState = useGameStore((state) => state.engineState);
  const rules = useGameStore((state) => state.rules);

  if (!engineState) return null;

  const { research, discoveredRecipes, unlockedRecipes } = engineState;
  const researchPoints = research?.researchPoints || 0;
  const awaitingPrototype = research?.awaitingPrototype || [];
  const prototypeBoost = research?.prototypeBoost || null;

  // Calculate highest unlocked age for experiment cost
  const highestAge = useMemo(() => {
    return calculateHighestUnlockedAge(engineState, rules);
  }, [engineState.unlockedRecipes]);

  const experimentCost = rules.research.experimentCosts[highestAge] || rules.research.experimentCosts[1];

  // Count recipes by age (victory recipes separated into their own category)
  const recipesByAge = useMemo(() => {
    const counts = {};
    const recipeMap = new Map((rules.recipes || []).map((recipe) => [recipe.id, recipe]));

    for (let age = 1; age <= 7; age++) {
      const total = rules.recipes.filter((recipe) => getRecipeAge(recipe, rules) === age && !recipe.victory).length;

      const discovered = discoveredRecipes.filter((recipeId) => {
        const recipe = recipeMap.get(recipeId);
        if (!recipe || recipe.victory) return false;
        return getRecipeAge(recipe, rules) === age;
      }).length;

      const unlocked = unlockedRecipes.filter((recipeId) => {
        const recipe = recipeMap.get(recipeId);
        if (!recipe || recipe.victory) return false;
        return getRecipeAge(recipe, rules) === age;
      }).length;

      if (total > 0) {
        counts[age] = { total, discovered, unlocked };
      }
    }

    // Victory recipes as a separate category
    const victoryRecipes = rules.recipes.filter(r => r.victory);
    if (victoryRecipes.length > 0) {
      const victoryIds = new Set(victoryRecipes.map(r => r.id));
      counts.victory = {
        total: victoryRecipes.length,
        discovered: discoveredRecipes.filter(id => victoryIds.has(id)).length,
        unlocked: unlockedRecipes.filter(id => victoryIds.has(id)).length,
      };
    }

    return counts;
  }, [discoveredRecipes, unlockedRecipes, rules]);

  // Count undiscovered recipes
  const undiscoveredCount = rules.recipes.length - discoveredRecipes.length;

  const passiveDiscoveryDetails = useMemo(
    () => calculatePassiveDiscoveryChanceDetails(engineState, rules),
    [engineState, rules]
  );

  return (
    <Box sx={{ display: 'flex', height: '100%', minHeight: 0, gap: 2, p: 2, overflow: 'hidden' }}>
      {/* LEFT PANEL - Experiment Chamber & Donation */}
      <Box sx={{ width: 350, display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 0, overflow: 'auto', pr: 0.5 }}>
        <Paper sx={{ p: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">{t('research.researchPoints')}</Typography>
            <Typography variant="h4" color="primary.main" fontWeight="bold">
              {researchPoints.toLocaleString()} RP
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <DonateSection />
        </Paper>

        <Paper sx={{ p: 1.5, flex: 1, minHeight: 360 }}>
          <ExperimentChamber
            researchPoints={researchPoints}
            experimentCost={experimentCost}
            undiscoveredCount={undiscoveredCount}
          />
        </Paper>
      </Box>

      {/* CENTER PANEL - Prototype Workshop */}
      <Paper sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Typography variant="h6" gutterBottom>{t('research.prototypeWorkshop')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('research.prototypeWorkshopDesc')}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <PrototypeWorkshop
            awaitingPrototype={awaitingPrototype}
            rules={rules}
            inventory={engineState.inventory}
          />
        </Box>
      </Paper>

      {/* RIGHT PANEL - Passive Discovery & Unlocked Recipes Grid */}
      <Paper sx={{ width: 350, p: 2, display: 'flex', flexDirection: 'column' }}>
        <PassiveDiscoveryPanel
          baseChance={rules.research.passiveDiscoveryChance}
          effectiveChance={passiveDiscoveryDetails.effectiveChance}
          effectivePrototypeBoostPercent={passiveDiscoveryDetails.effectivePrototypeBoostPercent}
          labBonus={passiveDiscoveryDetails.researchLabBonus}
          activeLabCount={passiveDiscoveryDetails.activeLabCount}
          prototypeBoost={prototypeBoost}
        />
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>{t('research.unlockedRecipes')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('research.unlockedRecipesDesc')}
        </Typography>
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <UnlockedRecipesGrid recipesByAge={recipesByAge} />
        </Box>
      </Paper>
    </Box>
  );
}
