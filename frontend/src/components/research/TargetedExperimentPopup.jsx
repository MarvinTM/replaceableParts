import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import BuildIcon from '@mui/icons-material/Build';
import MaterialIcon from '../common/MaterialIcon';
import useGameStore from '../../stores/gameStore';
import { getMaterialName } from '../../utils/translationHelpers';

export default function TargetedExperimentPopup({
  open,
  onClose,
  eligibleMaterialRecipes = [],
  eligibleEnablerRecipes = [],
  minTargetedCost = null,
  maxTargetedCost = null,
  researchPoints
}) {
  const { t } = useTranslation();
  const runTargetedExperiment = useGameStore((state) => state.runTargetedExperiment);
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);

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

  const sortByAgeThenName = (a, b) => {
    if (a.recipeAge !== b.recipeAge) {
      return (a.recipeAge || 0) - (b.recipeAge || 0);
    }
    return a.materialName.localeCompare(b.materialName);
  };

  const sortedMaterialRecipes = [...eligibleMaterialRecipes].sort(sortByAgeThenName);
  const sortedEnablerRecipes = [...eligibleEnablerRecipes]
    .sort((a, b) => {
      if ((b.blockedCount || 0) !== (a.blockedCount || 0)) {
        return (b.blockedCount || 0) - (a.blockedCount || 0);
      }
      return sortByAgeThenName(a, b);
    });
  const hasTargets = sortedMaterialRecipes.length > 0 || sortedEnablerRecipes.length > 0;
  const allTargets = [...sortedMaterialRecipes, ...sortedEnablerRecipes];
  const selectedTarget = allTargets.find((target) => target.recipe.id === selectedRecipeId) || null;
  const selectedTargetCost = selectedTarget?.targetedCost ?? null;
  const canAffordSelected = selectedTargetCost !== null && researchPoints >= selectedTargetCost;
  const canAffordAny = minTargetedCost !== null && researchPoints >= minTargetedCost;
  const canRun = selectedRecipeId !== null && canAffordSelected;
  const costLabel = selectedTargetCost !== null
    ? `${selectedTargetCost} RP`
    : minTargetedCost === null
      ? '-- RP'
      : minTargetedCost === maxTargetedCost
        ? `${minTargetedCost} RP`
        : `${minTargetedCost}-${maxTargetedCost} RP`;
  const needMoreAmount = selectedTargetCost !== null
    ? Math.max(0, selectedTargetCost - researchPoints)
    : Math.max(0, (minTargetedCost || 0) - researchPoints);
  const showNeedMore = selectedTargetCost !== null
    ? !canAffordSelected
    : (minTargetedCost !== null && !canAffordAny);
  const actionCost = selectedTargetCost !== null
    ? selectedTargetCost
    : (
      minTargetedCost !== null && maxTargetedCost !== null && minTargetedCost !== maxTargetedCost
        ? `${minTargetedCost}-${maxTargetedCost}`
        : (minTargetedCost ?? '--')
    );

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
          <TargetIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6">{t('research.targetedExperiment')}</Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {t('research.targetedExperimentDesc')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Typography variant="body2">{t('research.cost')}:</Typography>
            <Chip
              label={costLabel}
              color={(selectedTargetCost !== null ? canAffordSelected : canAffordAny) ? 'primary' : 'error'}
              size="small"
            />
            {showNeedMore && (
              <Typography variant="caption" color="error.main">
                ({t('research.needMoreRP', { amount: needMoreAmount })})
              </Typography>
            )}
          </Box>
        </Box>

        {!hasTargets ? (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
            color: 'text.secondary'
          }}>
            <Typography variant="body1">
              {t('research.noEligibleTargets')}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {t('research.allTargetsResearched')}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sortedMaterialRecipes.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t('research.materialTargets')}
                </Typography>
                <List sx={{ bgcolor: 'background.default', borderRadius: 1 }}>
                  {sortedMaterialRecipes.map((target) => (
                    <TargetListItem
                      key={target.recipe.id}
                      target={target}
                      researchPoints={researchPoints}
                      selectedRecipeId={selectedRecipeId}
                      onSelect={handleSelectRecipe}
                      t={t}
                    />
                  ))}
                </List>
              </Box>
            )}

            {sortedEnablerRecipes.length > 0 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                  <BuildIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                  <Typography variant="subtitle2">
                    {t('research.productionEnablers')}
                  </Typography>
                </Box>
                <List sx={{ bgcolor: 'background.default', borderRadius: 1 }}>
                  {sortedEnablerRecipes.map((target) => (
                    <TargetListItem
                      key={target.recipe.id}
                      target={target}
                      researchPoints={researchPoints}
                      selectedRecipeId={selectedRecipeId}
                      onSelect={handleSelectRecipe}
                      t={t}
                    />
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit">
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleRunExperiment}
          disabled={!canRun}
          startIcon={<TargetIcon />}
        >
          {t('research.researchSelected', { cost: actionCost })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function TargetListItem({ target, researchPoints, selectedRecipeId, onSelect, t }) {
  const {
    recipe,
    outputId,
    structureId,
    materialName,
    recipeAge,
    materialAge,
    category,
    neededBy,
    type,
    blockedCount = 0,
    targetedCost = 0,
  } = target;
  const canAfford = researchPoints >= targetedCost;

  return (
    <ListItemButton
      selected={selectedRecipeId === recipe.id}
      onClick={() => onSelect(recipe.id)}
      sx={{
        borderRadius: 1,
        mb: 0.5,
        border: '1px solid',
        borderColor: selectedRecipeId === recipe.id ? 'primary.main' : 'transparent',
        '&.Mui-selected': {
          bgcolor: 'rgba(139, 90, 43, 0.15)',
          '&:hover': {
            bgcolor: 'rgba(139, 90, 43, 0.2)',
          }
        }
      }}
    >
      <ListItemIcon sx={{ minWidth: 56 }}>
        {type === 'enabler' ? (
          <FactoryStructureIcon
            structureId={structureId || recipe.id}
            materialId={outputId}
            materialName={materialName}
            category={category}
          />
        ) : (
          <MaterialIcon materialId={outputId} category={category} size={40} />
        )}
      </ListItemIcon>
      <ListItemText
        primary={(
          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography component="span" variant="body1" fontWeight="medium">
              {getMaterialName(outputId, materialName)}
            </Typography>
            {(recipeAge || materialAge) && (
              <Chip
                label={t('research.age', { age: recipeAge || materialAge })}
                size="small"
                variant="outlined"
              />
            )}
            <Chip
              label={`${targetedCost} RP`}
              size="small"
              color={canAfford ? 'primary' : 'error'}
              variant={canAfford ? 'filled' : 'outlined'}
            />
            {type === 'enabler' && (
              <Chip
                label={t('research.productionEnabler')}
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
          </Box>
        )}
        secondary={(
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
            {type === 'enabler' && (
              <Typography component="span" variant="caption" color="warning.main">
                {t('research.unblocksRecipes', { count: blockedCount })}
              </Typography>
            )}
            {neededBy?.length > 0 && (
              <>
                <Typography component="span" variant="caption" color="text.secondary">
                  {t('research.neededFor')}
                </Typography>
                {neededBy.slice(0, 3).map((id, idx) => (
                  <Box component="span" key={idx} sx={{ display: 'inline-flex', alignItems: 'center' }}>
                    <ArrowForwardIcon sx={{ fontSize: 12, color: 'text.secondary', mr: 0.25 }} />
                    <Typography component="span" variant="caption" color="primary.light">
                      {getMaterialName(id)}
                    </Typography>
                  </Box>
                ))}
                {neededBy.length > 3 && (
                  <Typography component="span" variant="caption" color="text.secondary">
                    {t('research.andMore', { count: neededBy.length - 3 })}
                  </Typography>
                )}
              </>
            )}
          </Box>
        )}
      />
    </ListItemButton>
  );
}

function FactoryStructureIcon({ structureId, materialId, materialName, category }) {
  const [spriteSrc, setSpriteSrc] = useState(`/assets/factory/${structureId}_idle.png`);
  const [triedFallback, setTriedFallback] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!triedFallback) {
      setTriedFallback(true);
      setSpriteSrc(`/assets/factory/${structureId}.png`);
      return;
    }
    setHasError(true);
  };

  if (hasError) {
    return <MaterialIcon materialId={materialId} materialName={materialName} category={category} size={40} />;
  }

  return (
    <Box
      component="img"
      src={spriteSrc}
      alt={getMaterialName(materialId, materialName)}
      sx={{
        width: 40,
        height: 40,
        objectFit: 'contain',
        imageRendering: 'pixelated',
      }}
      onError={handleError}
    />
  );
}
