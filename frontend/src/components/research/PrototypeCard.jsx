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
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MaterialIcon from '../common/MaterialIcon';
import StructureSpriteIcon from '../common/StructureSpriteIcon';
import { getMaterialName } from '../../utils/translationHelpers';

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
  const isInfrastructureBlueprint = outputInfo?.material?.category === 'equipment';
  const isVictoryRecipe = recipe?.victory === true;

  // Determine special styling category
  const specialStyle = isVictoryRecipe ? 'victory' : isInfrastructureBlueprint ? 'infra' : null;

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
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        border: '1px solid',
        borderColor: specialStyle === 'victory' ? '#FFD700' : specialStyle === 'infra' ? '#FF9800' : 'divider',
        bgcolor: specialStyle === 'victory' ? '#1a1508' : specialStyle === 'infra' ? '#1f1610' : 'background.paper',
        backgroundImage: specialStyle === 'victory'
          ? 'linear-gradient(150deg, rgba(255, 215, 0, 0.30) 0%, rgba(255, 179, 0, 0.18) 45%, rgba(100, 70, 0, 0.90) 100%)'
          : specialStyle === 'infra'
            ? 'linear-gradient(150deg, rgba(255, 179, 0, 0.34) 0%, rgba(255, 111, 0, 0.22) 45%, rgba(84, 47, 14, 0.92) 100%)'
            : 'none',
        boxShadow: specialStyle === 'victory'
          ? '0 0 0 1px rgba(255, 215, 0, 0.55), 0 12px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 245, 200, 0.25)'
          : specialStyle === 'infra'
            ? '0 0 0 1px rgba(255, 152, 0, 0.55), 0 12px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 235, 180, 0.25)'
            : undefined,
        '&::before': specialStyle ? {
          content: '""',
          position: 'absolute',
          top: '-30%',
          left: '-65%',
          width: '52%',
          height: '180%',
          transform: 'rotate(23deg)',
          background: specialStyle === 'victory'
            ? 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,245,180,0.35) 50%, rgba(255,255,255,0) 100%)'
            : 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,245,210,0.32) 50%, rgba(255,255,255,0) 100%)',
          animation: 'infraShine 3.5s linear infinite',
          pointerEvents: 'none',
        } : undefined,
        '@keyframes infraShine': {
          '0%': { left: '-65%' },
          '100%': { left: '140%' }
        },
        '&:hover': specialStyle ? {
          transform: 'translateY(-2px)',
          boxShadow: specialStyle === 'victory'
            ? '0 0 0 1px rgba(255, 215, 0, 0.7), 0 14px 28px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 245, 200, 0.35)'
            : '0 0 0 1px rgba(255, 152, 0, 0.7), 0 14px 28px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 235, 180, 0.35)'
        } : undefined,
      }}
    >
      {outputInfo?.material?.category === 'equipment' ? (
        <StructureSpriteIcon
          structureId={outputInfo?.outputId}
          materialId={outputInfo?.outputId}
          materialName={outputInfo?.material?.name}
          category={outputInfo?.material?.category}
          size={48}
        />
      ) : (
        <MaterialIcon materialId={outputInfo?.outputId} size={48} />
      )}

      <Typography
        variant="subtitle2"
        noWrap
        sx={{
          maxWidth: 150,
          color: specialStyle ? '#FFF4D6' : 'text.primary',
          textShadow: specialStyle ? '0 1px 2px rgba(0, 0, 0, 0.45)' : 'none',
          fontWeight: specialStyle ? 700 : 500,
        }}
      >
        {getMaterialName(outputInfo?.outputId, outputInfo?.material?.name || prototype.recipeId)}
      </Typography>

      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
        {isVictoryRecipe && (
          <Chip
            icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
            label={t('research.singularity', 'Singularity')}
            size="small"
            sx={{
              bgcolor: 'rgba(25, 20, 5, 0.72)',
              color: '#FFD700',
              border: '1px solid rgba(255, 215, 0, 0.8)',
              '& .MuiChip-icon': {
                color: '#FFD700',
              }
            }}
            variant="filled"
          />
        )}
        {isInfrastructureBlueprint && (
          <Chip
            icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
            label={t('research.infrastructureUnlock', 'Infrastructure Unlock')}
            size="small"
            sx={{
              bgcolor: 'rgba(27, 18, 10, 0.72)',
              color: '#FFE5B0',
              border: '1px solid rgba(255, 193, 7, 0.8)',
              '& .MuiChip-icon': {
                color: '#FFD54F',
              }
            }}
            variant="filled"
          />
        )}
        <Chip
          label={`${t('market.age')} ${outputInfo?.material?.age || '?'}`}
          size="small"
          variant={specialStyle ? 'filled' : 'outlined'}
          sx={specialStyle ? {
            bgcolor: 'rgba(30, 20, 12, 0.75)',
            color: '#FFE9B8',
            border: '1px solid rgba(255, 213, 79, 0.65)',
          } : undefined}
        />
        <Chip
          label={t(isFlowMode ? 'research.flow' : 'research.slots')}
          size="small"
          color={specialStyle ? undefined : (isFlowMode ? 'info' : 'warning')}
          variant={specialStyle ? 'filled' : 'outlined'}
          sx={specialStyle ? {
            bgcolor: isFlowMode ? 'rgba(15, 48, 57, 0.82)' : 'rgba(60, 33, 12, 0.82)',
            color: isFlowMode ? '#B3ECFF' : '#FFD89E',
            border: `1px solid ${isFlowMode ? 'rgba(77, 208, 225, 0.65)' : 'rgba(255, 183, 77, 0.65)'}`,
          } : undefined}
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
