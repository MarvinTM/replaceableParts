import { useTranslation } from 'react-i18next';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import BuildIcon from '@mui/icons-material/Build';
import LoopIcon from '@mui/icons-material/Loop';
import StarIcon from '@mui/icons-material/Star';
import MaterialIcon from '../common/MaterialIcon';

export default function PrototypeCard({ prototype, recipe, rules, onBuildClick }) {
  const { t } = useTranslation();
  // Get recipe output info
  const outputInfo = Object.entries(recipe.outputs).map(([outputId, qty]) => {
    const material = rules.materials.find(m => m.id === outputId);
    return { outputId, qty, material };
  })[0];

  const isFlowMode = prototype.mode === 'flow';
  const isSlotsMode = prototype.mode === 'slots';

  // Calculate progress for flow mode
  let flowProgress = 0;
  if (isFlowMode && prototype.requiredAmounts && prototype.prototypeProgress) {
    const totalRequired = Object.values(prototype.requiredAmounts).reduce((a, b) => a + b, 0);
    const totalProgress = Object.values(prototype.prototypeProgress).reduce((a, b) => a + b, 0);
    flowProgress = totalRequired > 0 ? Math.round((totalProgress / totalRequired) * 100) : 0;
  }

  // Check for hybrid mode (slots mode with raw material slots that auto-fill)
  const hasRawSlots = isSlotsMode && prototype.slots?.some(s => s.isRaw);
  const hasNonRawSlots = isSlotsMode && prototype.slots?.some(s => !s.isRaw);

  // Calculate progress for slots mode (overall progress including raw slots)
  let slotsProgress = 0;
  let rawSlotsProgress = 0;
  if (isSlotsMode && prototype.slots) {
    const totalRequired = prototype.slots.reduce((sum, s) => sum + s.quantity, 0);
    const totalFilled = prototype.slots.reduce((sum, s) => sum + s.filled, 0);
    slotsProgress = totalRequired > 0 ? Math.round((totalFilled / totalRequired) * 100) : 0;

    // Calculate raw slots progress separately
    const rawSlots = prototype.slots.filter(s => s.isRaw);
    if (rawSlots.length > 0) {
      const rawRequired = rawSlots.reduce((sum, s) => sum + s.quantity, 0);
      const rawFilled = rawSlots.reduce((sum, s) => sum + s.filled, 0);
      rawSlotsProgress = rawRequired > 0 ? Math.round((rawFilled / rawRequired) * 100) : 0;
    }
  }

  // Calculate RP bonus for completing this prototype (50 * ageMultiplier)
  const age = outputInfo?.material?.age || recipe?.age || 1;
  const ageMultiplier = rules.research?.ageMultipliers?.[age] || 1.0;
  const rpBonus = Math.floor(50 * ageMultiplier);

  return (
    <Paper
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        minWidth: 160,
        maxWidth: 180,
        textAlign: 'center',
      }}
    >
      <MaterialIcon materialId={outputInfo?.outputId} size={48} />

      <Typography variant="subtitle2" noWrap sx={{ maxWidth: 150 }}>
        {outputInfo?.material?.name || prototype.recipeId}
      </Typography>

      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Chip
          label={`${t('market.age')} ${outputInfo?.material?.age || '?'}`}
          size="small"
          variant="outlined"
        />
        <Chip
          label={t(isFlowMode ? 'research.flow' : 'research.slots')}
          size="small"
          color={isFlowMode ? 'info' : 'warning'}
          variant="outlined"
        />
      </Box>

      {/* RP Bonus indicator */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
        <StarIcon sx={{ fontSize: 14 }} />
        <Typography variant="caption" fontWeight="bold">
          +{rpBonus} {t('research.researchPoints')}
        </Typography>
      </Box>

      {isFlowMode ? (
        <Box sx={{ width: '100%', mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center', mb: 0.5 }}>
            <LoopIcon sx={{ fontSize: 16, color: 'info.main' }} />
            <Typography variant="caption" color="info.main">
              {t('research.autoFilling')}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={flowProgress}
            sx={{ height: 6, borderRadius: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            {flowProgress}% {t('research.complete')}
          </Typography>
        </Box>
      ) : hasRawSlots ? (
        // Hybrid mode: show raw slots progress + build button
        <Box sx={{ width: '100%', mt: 1 }}>
          {rawSlotsProgress < 100 && (
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center', mb: 0.5 }}>
                <LoopIcon sx={{ fontSize: 14, color: 'info.main' }} />
                <Typography variant="caption" color="info.main">
                  {t('research.rawMaterials')}: {rawSlotsProgress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={rawSlotsProgress}
                color="info"
                sx={{ height: 4, borderRadius: 1 }}
              />
            </Box>
          )}
          <Button
            variant="contained"
            size="small"
            startIcon={<BuildIcon />}
            onClick={() => onBuildClick(prototype)}
            fullWidth
          >
            {t('research.buildPrototype')}
          </Button>
        </Box>
      ) : (
        <Button
          variant="contained"
          size="small"
          startIcon={<BuildIcon />}
          onClick={() => onBuildClick(prototype)}
          sx={{ mt: 1 }}
        >
          {t('research.buildPrototype')}
        </Button>
      )}
    </Paper>
  );
}
