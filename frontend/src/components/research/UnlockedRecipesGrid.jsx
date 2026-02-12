import { useTranslation } from 'react-i18next';
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

const VICTORY_COLOR = '#FFD700';

export default function UnlockedRecipesGrid({ recipesByAge }) {
  const { t } = useTranslation();

  const AGE_NAMES = {
    1: t('research.stoneAge'),
    2: t('research.bronzeAge'),
    3: t('research.industrial'),
    4: t('research.combustion'),
    5: t('research.electric'),
    6: t('research.digital'),
    7: t('research.future')
  };
  // Filter ages to only show those with at least one discovered recipe
  const ages = Object.keys(recipesByAge)
    .filter(key => key !== 'victory')
    .map(Number)
    .sort((a, b) => a - b)
    .filter(age => recipesByAge[age]?.discovered > 0);

  const victoryData = recipesByAge.victory;
  const showVictory = victoryData && victoryData.discovered > 0;

  if (ages.length === 0 && !showVictory) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          {t('research.noRecipesDiscovered')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {ages.map(age => {
        const { total, discovered, unlocked } = recipesByAge[age];
        const discoveredPercent = Math.round((discovered / total) * 100);
        const unlockedPercent = Math.round((unlocked / total) * 100);

        return (
          <Box key={age} sx={{ p: 1, borderRadius: 1, bgcolor: 'action.hover' }}>
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
                  {t('market.age')} {age}
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
                  {t('research.discovered')}
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
                  {t('research.unlocked')}
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

      {/* Victory row */}
      {showVictory && (
        <Box sx={{
          p: 1,
          borderRadius: 1,
          bgcolor: 'rgba(255, 215, 0, 0.08)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: VICTORY_COLOR,
                  boxShadow: '0 0 6px rgba(255, 215, 0, 0.6)',
                }}
              />
              <Typography variant="body2" fontWeight="bold" sx={{ color: VICTORY_COLOR }}>
                {t('research.singularity', 'Singularity')}
              </Typography>
            </Box>
            <Chip
              label={`${victoryData.unlocked}/${victoryData.total}`}
              size="small"
              sx={{
                bgcolor: VICTORY_COLOR,
                color: '#000',
                fontWeight: 'bold'
              }}
            />
          </Box>

          <Box sx={{ mb: 0.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
              <Typography variant="caption" color="text.secondary">
                {t('research.discovered')}
              </Typography>
              <Typography variant="caption">
                {victoryData.discovered}/{victoryData.total} ({Math.round((victoryData.discovered / victoryData.total) * 100)}%)
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.round((victoryData.discovered / victoryData.total) * 100)}
              sx={{
                height: 4,
                borderRadius: 1,
                bgcolor: 'action.disabledBackground',
                '& .MuiLinearProgress-bar': {
                  bgcolor: VICTORY_COLOR,
                  opacity: 0.5
                }
              }}
            />
          </Box>

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
              <Typography variant="caption" color="text.secondary">
                {t('research.unlocked')}
              </Typography>
              <Typography variant="caption">
                {victoryData.unlocked}/{victoryData.total} ({Math.round((victoryData.unlocked / victoryData.total) * 100)}%)
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.round((victoryData.unlocked / victoryData.total) * 100)}
              sx={{
                height: 6,
                borderRadius: 1,
                bgcolor: 'action.disabledBackground',
                '& .MuiLinearProgress-bar': {
                  bgcolor: VICTORY_COLOR
                }
              }}
            />
          </Box>
        </Box>
      )}

      {/* Summary */}
      <Box sx={{ mt: 1.5, p: 1, borderRadius: 1, bgcolor: 'info.dark' }}>
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          {t('research.totalProgress')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">{t('research.discovered')}</Typography>
            <Typography variant="body1" fontWeight="bold">
              {Object.keys(recipesByAge).reduce((sum, key) => sum + (recipesByAge[key]?.discovered || 0), 0)}/
              {Object.keys(recipesByAge).reduce((sum, key) => sum + (recipesByAge[key]?.total || 0), 0)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">{t('research.unlocked')}</Typography>
            <Typography variant="body1" fontWeight="bold">
              {Object.keys(recipesByAge).reduce((sum, key) => sum + (recipesByAge[key]?.unlocked || 0), 0)}/
              {Object.keys(recipesByAge).reduce((sum, key) => sum + (recipesByAge[key]?.total || 0), 0)}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
