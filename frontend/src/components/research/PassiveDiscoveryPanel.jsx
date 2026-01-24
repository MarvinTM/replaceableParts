import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ScienceIcon from '@mui/icons-material/Science';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export default function PassiveDiscoveryPanel({ baseChance, labBonus = 0, activeLabCount = 0 }) {
  const effectiveChance = baseChance + labBonus;
  // Convert chance to "1 in X" format
  const oneInX = effectiveChance > 0 ? Math.round(1 / effectiveChance) : 0;
  const baseOneInX = baseChance > 0 ? Math.round(1 / baseChance) : 0;

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
          <Typography variant="body2" color="info.contrastText">
            Chance per tick:
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ~1 in {oneInX} ticks
          </Typography>
        </Box>
        <Chip
          label={`${(effectiveChance * 100).toFixed(1)}%`}
          color="info"
          size="small"
        />
      </Box>

      {activeLabCount > 0 && (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          mt: 1,
          borderRadius: 1,
          bgcolor: 'success.dark',
          border: '1px solid',
          borderColor: 'success.main'
        }}>
          <ScienceIcon sx={{ fontSize: 18, color: 'success.main' }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="success.contrastText">
              {activeLabCount} Research Lab{activeLabCount > 1 ? 's' : ''} active
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              +{(labBonus * 100).toFixed(1)}% bonus (base: 1 in {baseOneInX})
            </Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mt: 1.5 }}>
        <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.25 }} />
        <Typography variant="caption" color="text.secondary">
          Each tick has a small chance to passively discover a new recipe,
          even without running experiments. Discovered recipes still require
          prototype building to unlock for production.
          {activeLabCount === 0 && ' Build Research Laboratories to increase this chance.'}
        </Typography>
      </Box>
    </Box>
  );
}
