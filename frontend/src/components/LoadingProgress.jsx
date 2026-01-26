import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import { useTranslation } from 'react-i18next';
import { keyframes } from '@mui/system';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

/**
 * Loading progress component for the landing page
 * Displays "Loading assets..." text with a progress bar
 */
export default function LoadingProgress({ progress }) {
  const { t } = useTranslation();
  const { loaded = 0, total = 1 } = progress || {};
  const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        animation: `${fadeIn} 0.5s ease-out`,
        minWidth: 250,
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          textAlign: 'center',
        }}
      >
        {t('landing.loadingAssets', 'Loading assets...')}
      </Typography>

      <Box sx={{ width: '100%' }}>
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              backgroundColor: 'primary.main',
            },
          }}
        />
      </Box>

      <Typography
        variant="caption"
        color="text.disabled"
        sx={{
          textAlign: 'center',
        }}
      >
        {percentage}%
      </Typography>
    </Box>
  );
}
