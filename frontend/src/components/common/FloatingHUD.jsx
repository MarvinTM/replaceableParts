import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import BoltIcon from '@mui/icons-material/Bolt';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { CREDIT_SYMBOL } from '../../utils/currency';
import MaterialIcon from './MaterialIcon';

export function calculateUsageRatio(consumed, produced) {
  const safeConsumed = Number.isFinite(consumed) ? Math.max(consumed, 0) : 0;
  const safeProduced = Number.isFinite(produced) ? Math.max(produced, 0) : 0;

  if (safeProduced === 0) {
    return safeConsumed > 0 ? Infinity : 0;
  }

  return safeConsumed / safeProduced;
}

export function getUsageColor(ratio) {
  if (!Number.isFinite(ratio)) return 'error.light';
  if (ratio > 1) return 'error.light';
  if (ratio >= 0.75) return 'warning.light';
  return 'success.light';
}

export function getEnergyAlertLevel(ratio) {
  if (!Number.isFinite(ratio)) return 'error';
  if (ratio > 1) return 'error';
  if (ratio >= 0.75) return 'warning';
  return 'normal';
}

function getEnergyBoltIconSx(alertLevel, color) {
  const baseFontSize = alertLevel === 'error' ? 24 : alertLevel === 'warning' ? 22 : 18;
  const baseSx = {
    fontSize: baseFontSize,
    color,
    transformOrigin: 'center',
    transition: 'font-size 160ms ease-out',
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  };

  if (alertLevel === 'warning') {
    return {
      ...baseSx,
      animation: 'hudEnergyWarningPulse 1s ease-in-out infinite',
      '@keyframes hudEnergyWarningPulse': {
        '0%': { transform: 'scale(1.04)', filter: 'brightness(1.05) drop-shadow(0 0 3px rgba(255, 193, 7, 0.55))' },
        '25%': { transform: 'scale(1.12)' },
        '50%': { transform: 'scale(1.3)', filter: 'brightness(1.24) drop-shadow(0 0 14px rgba(255, 193, 7, 0.98))' },
        '75%': { transform: 'scale(1.14)' },
        '100%': { transform: 'scale(1.04)', filter: 'brightness(1.05) drop-shadow(0 0 3px rgba(255, 193, 7, 0.55))' },
      },
    };
  }

  if (alertLevel === 'error') {
    return {
      ...baseSx,
      animation: 'hudEnergyErrorPulse 0.55s ease-in-out infinite',
      '@keyframes hudEnergyErrorPulse': {
        '0%': { transform: 'scale(1.08)', filter: 'brightness(1.12) drop-shadow(0 0 5px rgba(244, 67, 54, 0.65))' },
        '25%': { transform: 'scale(1.18)' },
        '50%': { transform: 'scale(1.42)', filter: 'brightness(1.4) drop-shadow(0 0 20px rgba(244, 67, 54, 1))' },
        '75%': { transform: 'scale(1.2)' },
        '100%': { transform: 'scale(1.08)', filter: 'brightness(1.12) drop-shadow(0 0 5px rgba(244, 67, 54, 0.65))' },
      },
    };
  }

  return baseSx;
}

export default function FloatingHUD({ credits, energy, rawMaterialBalance = [] }) {
  const energyConsumed = Number(energy?.consumed) || 0;
  const energyProduced = Number(energy?.produced) || 0;
  const energyRatio = calculateUsageRatio(energyConsumed, energyProduced);
  const energyColor = getUsageColor(energyRatio);
  const energyAlertLevel = getEnergyAlertLevel(energyRatio);
  const energyIconSx = getEnergyBoltIconSx(energyAlertLevel, energyColor);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 40,
        right: 8,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        borderRadius: 2,
        px: 2,
        py: 1,
        zIndex: 10,
      }}
    >
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <AccountBalanceIcon sx={{ fontSize: 18, color: 'success.light' }} />
          <Typography variant="body2" component="span" sx={{ color: 'white', fontWeight: 500 }}>
            {credits}
            <Typography component="span" sx={{ color: '#FFD700', fontWeight: 500, fontSize: 'inherit', ml: 0.5 }}>{CREDIT_SYMBOL}</Typography>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <BoltIcon sx={energyIconSx} />
          <Typography
            variant="body2"
            component="span"
            sx={{
              color: energyColor,
              fontWeight: 500
            }}
          >
            {energyConsumed}/{energyProduced}
            <Typography component="span" sx={{ color: '#FFD700', fontWeight: 500, fontSize: 'inherit', ml: 0.5 }}>MW</Typography>
          </Typography>
        </Box>
      </Box>

      {rawMaterialBalance.length > 0 && (
        <>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', my: 0.5 }} />
          {rawMaterialBalance.map(({ materialId, materialName, category, produced, consumed }) => {
            const surplus = produced - consumed;
            const color = surplus > 0 ? 'success.light' : surplus === 0 ? 'warning.light' : 'error.light';
            return (
              <Box
                key={materialId}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, height: 20 }}
              >
                <MaterialIcon materialId={materialId} materialName={materialName} category={category} size={16} />
                <Typography
                  variant="caption"
                  component="span"
                  sx={{ fontFamily: 'monospace', color, fontWeight: 500, flexShrink: 0 }}
                >
                  {consumed}/{produced}
                </Typography>
                <Typography
                  variant="caption"
                  component="span"
                  noWrap
                  sx={{ color: 'rgba(255,255,255,0.8)' }}
                >
                  {materialName}
                </Typography>
              </Box>
            );
          })}
        </>
      )}
    </Box>
  );
}
