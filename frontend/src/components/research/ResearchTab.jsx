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
  const prototypeBoost = research?.prototypeBoost || null;

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

  // Calculate research laboratory bonus
  const researchLabBonus = useMemo(() => {
    let bonus = 0;
    const machines = engineState.machines || [];
    for (const machine of machines) {
      if (machine.enabled && machine.status !== 'blocked') {
        const machineConfig = rules.machines.find(m => m.id === machine.type);
        if (machineConfig && machineConfig.isResearchFacility && machineConfig.passiveDiscoveryBonus) {
          bonus += machineConfig.passiveDiscoveryBonus;
        }
      }
    }
    return bonus;
  }, [engineState.machines, rules.machines]);

  // Count active research labs for display
  const activeLabCount = useMemo(() => {
    const machines = engineState.machines || [];
    return machines.filter(machine => {
      if (!machine.enabled || machine.status === 'blocked') return false;
      const machineConfig = rules.machines.find(m => m.id === machine.type);
      return machineConfig && machineConfig.isResearchFacility;
    }).length;
  }, [engineState.machines, rules.machines]);

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
          labBonus={researchLabBonus}
          activeLabCount={activeLabCount}
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
