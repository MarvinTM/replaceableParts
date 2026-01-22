import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export default function PassiveDiscoveryPanel({ passiveChance }) {
  // Convert chance to "1 in X" format
  const oneInX = passiveChance > 0 ? Math.round(1 / passiveChance) : 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <AutoAwesomeIcon sx={{ color: 'info.main' }} />
        <Typography variant="subtitle2">Passive Discovery</Typography>
      </Box>

      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1.5,
        borderRadius: 1,
        bgcolor: 'info.dark',
        border: '1px solid',
        borderColor: 'info.main'
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2">
            Chance per tick:
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ~1 in {oneInX} ticks
          </Typography>
        </Box>
        <Chip
          label={`${(passiveChance * 100).toFixed(1)}%`}
          color="info"
          size="small"
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mt: 1.5 }}>
        <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.25 }} />
        <Typography variant="caption" color="text.secondary">
          Each tick has a small chance to passively discover a new recipe,
          even without running experiments. Discovered recipes still require
          prototype building to unlock for production.
        </Typography>
      </Box>
    </Box>
  );
}
