import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ScienceIcon from '@mui/icons-material/Science';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export default function PassiveDiscoveryPanel({ baseChance, labBonus = 0, activeLabCount = 0, prototypeBoost = null }) {
  const { t } = useTranslation();

  // Calculate prototype boost multiplier
  const hasBoost = prototypeBoost && prototypeBoost.ticksRemaining > 0 && prototypeBoost.bonus > 0;
  const boostMultiplier = hasBoost ? 1 + (prototypeBoost.bonus / 100) : 1;

  const baseEffectiveChance = baseChance + labBonus;
  const effectiveChance = baseEffectiveChance * boostMultiplier;

  // Convert chance to "1 in X" format
  const oneInX = effectiveChance > 0 ? Math.round(1 / effectiveChance) : 0;
  const baseOneInX = baseChance > 0 ? Math.round(1 / baseChance) : 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <AutoAwesomeIcon sx={{ color: 'info.main' }} />
        <Typography variant="subtitle2">{t('research.passiveDiscovery')}</Typography>
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
            {t('research.chancePerTick')}:
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('research.oneInTicks', { count: oneInX })}
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
              {activeLabCount} {t(activeLabCount > 1 ? 'research.researchLabsActive' : 'research.researchLabActive')}
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              +{(labBonus * 100).toFixed(1)}% {t('research.bonus')} ({t('research.base')}: {t('research.oneInTicks', { count: baseOneInX })})
            </Typography>
          </Box>
        </Box>
      )}

      {hasBoost && (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          mt: 1,
          borderRadius: 1,
          bgcolor: 'warning.dark',
          border: '1px solid',
          borderColor: 'warning.main'
        }}>
          <RocketLaunchIcon sx={{ fontSize: 18, color: 'warning.main' }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="warning.contrastText">
              {t('research.prototypeBoost')}
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              +{prototypeBoost.bonus}% ({prototypeBoost.ticksRemaining} {t('research.ticksRemaining')})
            </Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mt: 1.5 }}>
        <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.25 }} />
        <Typography variant="caption" color="text.secondary">
          {t('research.passiveDiscoveryDesc')}
          {activeLabCount === 0 && ' ' + t('research.buildLabsHint')}
        </Typography>
      </Box>
    </Box>
  );
}
