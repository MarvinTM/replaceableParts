import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import ScienceIcon from '@mui/icons-material/Science';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import useGameStore from '../../stores/gameStore';

export default function ExperimentChamber({
  researchPoints,
  experimentCost,
  highestAge,
  undiscoveredCount
}) {
  const runExperiment = useGameStore((state) => state.runExperiment);
  const lastError = useGameStore((state) => state.lastError);

  const canRunExperiment = researchPoints >= experimentCost && undiscoveredCount > 0;

  const handleRunExperiment = () => {
    runExperiment();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <ScienceIcon sx={{ fontSize: 28, color: 'secondary.main' }} />
        <Typography variant="h6">Experiment Chamber</Typography>
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
        borderColor: canRunExperiment ? 'secondary.main' : 'divider'
      }}>
        <AutoAwesomeIcon sx={{ fontSize: 64, color: canRunExperiment ? 'secondary.main' : 'text.disabled' }} />

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body1" gutterBottom>
            Run an experiment to discover a new recipe
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {undiscoveredCount} recipes remaining to discover
          </Typography>
        </Box>

        <Divider sx={{ width: '100%', my: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">Cost:</Typography>
          <Chip
            label={`${experimentCost} RP`}
            color={canRunExperiment ? 'primary' : 'default'}
            variant={canRunExperiment ? 'filled' : 'outlined'}
          />
        </Box>

        <Typography variant="caption" color="text.secondary">
          Based on Age {highestAge} progress
        </Typography>

        <Button
          variant="contained"
          color="secondary"
          size="large"
          startIcon={<ScienceIcon />}
          disabled={!canRunExperiment}
          onClick={handleRunExperiment}
          sx={{ mt: 2 }}
        >
          Run Experiment
        </Button>

        {undiscoveredCount === 0 && (
          <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
            All recipes have been discovered!
          </Typography>
        )}
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Experiment costs increase as you progress through ages:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
          {[1, 2, 3, 4, 5, 6, 7].map(age => (
            <Chip
              key={age}
              label={`Age ${age}: ${age === highestAge ? experimentCost : '-'}`}
              size="small"
              variant={age === highestAge ? 'filled' : 'outlined'}
              color={age === highestAge ? 'primary' : 'default'}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
