import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import BuildIcon from '@mui/icons-material/Build';
import LoopIcon from '@mui/icons-material/Loop';
import MaterialIcon from '../common/MaterialIcon';

export default function PrototypeCard({ prototype, recipe, rules, onBuildClick }) {
  // Get recipe output info
  const outputInfo = Object.entries(recipe.outputs).map(([outputId, qty]) => {
    const material = rules.materials.find(m => m.id === outputId);
    return { outputId, qty, material };
  })[0];

  const isFlowMode = prototype.mode === 'flow';

  // Calculate progress for flow mode
  let flowProgress = 0;
  if (isFlowMode && prototype.requiredAmounts && prototype.prototypeProgress) {
    const totalRequired = Object.values(prototype.requiredAmounts).reduce((a, b) => a + b, 0);
    const totalProgress = Object.values(prototype.prototypeProgress).reduce((a, b) => a + b, 0);
    flowProgress = totalRequired > 0 ? Math.round((totalProgress / totalRequired) * 100) : 0;
  }

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
          label={`Age ${outputInfo?.material?.age || '?'}`}
          size="small"
          variant="outlined"
        />
        <Chip
          label={isFlowMode ? 'Flow' : 'Slots'}
          size="small"
          color={isFlowMode ? 'info' : 'warning'}
          variant="outlined"
        />
      </Box>

      {isFlowMode ? (
        <Box sx={{ width: '100%', mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center', mb: 0.5 }}>
            <LoopIcon sx={{ fontSize: 16, color: 'info.main' }} />
            <Typography variant="caption" color="info.main">
              Auto-filling
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={flowProgress}
            sx={{ height: 6, borderRadius: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            {flowProgress}% complete
          </Typography>
        </Box>
      ) : (
        <Button
          variant="contained"
          size="small"
          startIcon={<BuildIcon />}
          onClick={() => onBuildClick(prototype)}
          sx={{ mt: 1 }}
        >
          Build Prototype
        </Button>
      )}
    </Paper>
  );
}
