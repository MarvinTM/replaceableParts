import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';

// Age-based colors
const AGE_COLORS = {
  1: '#8B4513', // Brown (wood age)
  2: '#CD7F32', // Bronze
  3: '#708090', // Slate gray (industrial)
  4: '#FF8C00', // Dark orange (combustion)
  5: '#4169E1', // Royal blue (electric)
  6: '#9370DB', // Medium purple (digital)
  7: '#00CED1'  // Dark turquoise (future)
};

const AGE_NAMES = {
  1: 'Stone Age',
  2: 'Bronze Age',
  3: 'Industrial',
  4: 'Combustion',
  5: 'Electric',
  6: 'Digital',
  7: 'Future'
};

export default function UnlockedRecipesGrid({ recipesByAge }) {
  const ages = Object.keys(recipesByAge).map(Number).sort((a, b) => a - b);

  if (ages.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No recipes unlocked yet
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {ages.map(age => {
        const { total, discovered, unlocked } = recipesByAge[age];
        const discoveredPercent = Math.round((discovered / total) * 100);
        const unlockedPercent = Math.round((unlocked / total) * 100);

        return (
          <Box key={age} sx={{ p: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: AGE_COLORS[age]
                  }}
                />
                <Typography variant="body2" fontWeight="bold">
                  Age {age}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {AGE_NAMES[age]}
                </Typography>
              </Box>
              <Chip
                label={`${unlocked}/${total}`}
                size="small"
                sx={{
                  bgcolor: AGE_COLORS[age],
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>

            {/* Discovered progress */}
            <Box sx={{ mb: 0.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                <Typography variant="caption" color="text.secondary">
                  Discovered
                </Typography>
                <Typography variant="caption">
                  {discovered}/{total} ({discoveredPercent}%)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={discoveredPercent}
                sx={{
                  height: 4,
                  borderRadius: 1,
                  bgcolor: 'action.disabledBackground',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: AGE_COLORS[age],
                    opacity: 0.5
                  }
                }}
              />
            </Box>

            {/* Unlocked progress */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                <Typography variant="caption" color="text.secondary">
                  Unlocked
                </Typography>
                <Typography variant="caption">
                  {unlocked}/{total} ({unlockedPercent}%)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={unlockedPercent}
                sx={{
                  height: 6,
                  borderRadius: 1,
                  bgcolor: 'action.disabledBackground',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: AGE_COLORS[age]
                  }
                }}
              />
            </Box>
          </Box>
        );
      })}

      {/* Summary */}
      <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, bgcolor: 'primary.dark' }}>
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          Total Progress
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Discovered</Typography>
            <Typography variant="body1" fontWeight="bold">
              {ages.reduce((sum, age) => sum + recipesByAge[age].discovered, 0)}/
              {ages.reduce((sum, age) => sum + recipesByAge[age].total, 0)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Unlocked</Typography>
            <Typography variant="body1" fontWeight="bold">
              {ages.reduce((sum, age) => sum + recipesByAge[age].unlocked, 0)}/
              {ages.reduce((sum, age) => sum + recipesByAge[age].total, 0)}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
