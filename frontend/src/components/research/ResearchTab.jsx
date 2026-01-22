import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import useGameStore from '../../stores/gameStore';
import { calculateHighestUnlockedAge } from '../../engine/engine.js';
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

  // Calculate highest unlocked age for experiment cost
  const highestAge = useMemo(() => {
    return calculateHighestUnlockedAge(engineState, rules);
  }, [engineState.unlockedRecipes]);

  const experimentCost = rules.research.experimentCosts[highestAge] || rules.research.experimentCosts[1];

  // Count recipes by age
  const recipesByAge = useMemo(() => {
    const counts = {};
    for (let age = 1; age <= 7; age++) {
      const total = rules.recipes.filter(r => {
        for (const outputId of Object.keys(r.outputs)) {
          const material = rules.materials.find(m => m.id === outputId);
          if (material && material.age === age) return true;
        }
        return false;
      }).length;

      const discovered = discoveredRecipes.filter(recipeId => {
        const recipe = rules.recipes.find(r => r.id === recipeId);
        if (!recipe) return false;
        for (const outputId of Object.keys(recipe.outputs)) {
          const material = rules.materials.find(m => m.id === outputId);
          if (material && material.age === age) return true;
        }
        return false;
      }).length;

      const unlocked = unlockedRecipes.filter(recipeId => {
        const recipe = rules.recipes.find(r => r.id === recipeId);
        if (!recipe) return false;
        for (const outputId of Object.keys(recipe.outputs)) {
          const material = rules.materials.find(m => m.id === outputId);
          if (material && material.age === age) return true;
        }
        return false;
      }).length;

      if (total > 0) {
        counts[age] = { total, discovered, unlocked };
      }
    }
    return counts;
  }, [discoveredRecipes, unlockedRecipes, rules]);

  // Count undiscovered recipes
  const undiscoveredCount = rules.recipes.length - discoveredRecipes.length;

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 2, p: 2 }}>
      {/* LEFT PANEL - Experiment Chamber & Donation */}
      <Box sx={{ width: 350, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Research Points</Typography>
            <Typography variant="h4" color="primary.main" fontWeight="bold">
              {researchPoints.toLocaleString()} RP
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <DonateSection />
        </Paper>

        <Paper sx={{ p: 2, flex: 1 }}>
          <ExperimentChamber
            researchPoints={researchPoints}
            experimentCost={experimentCost}
            highestAge={highestAge}
            undiscoveredCount={undiscoveredCount}
          />
        </Paper>

        <Paper sx={{ p: 2 }}>
          <PassiveDiscoveryPanel passiveChance={rules.research.passiveDiscoveryChance} />
        </Paper>
      </Box>

      {/* CENTER PANEL - Prototype Workshop */}
      <Paper sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Typography variant="h6" gutterBottom>Prototype Workshop</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Build prototypes to unlock discovered recipes for production
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

      {/* RIGHT PANEL - Unlocked Recipes Grid */}
      <Paper sx={{ width: 350, p: 2, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom>Unlocked Recipes</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Recipes available for production
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <UnlockedRecipesGrid recipesByAge={recipesByAge} />
        </Box>
      </Paper>
    </Box>
  );
}
