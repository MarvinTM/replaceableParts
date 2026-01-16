import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import BoltIcon from '@mui/icons-material/Bolt';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

export default function FloatingHUD({ credits, energy }) {
  const energyBalance = energy.produced - energy.consumed;
  const isEnergyDeficit = energyBalance < 0;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 40,
        right: 8,
        display: 'flex',
        gap: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        borderRadius: 2,
        px: 2,
        py: 1,
        zIndex: 10,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <AccountBalanceIcon sx={{ fontSize: 18, color: 'success.light' }} />
        <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
          {credits}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <BoltIcon sx={{ fontSize: 18, color: isEnergyDeficit ? 'error.light' : 'warning.light' }} />
        <Typography
          variant="body2"
          sx={{
            color: isEnergyDeficit ? 'error.light' : 'white',
            fontWeight: 500
          }}
        >
          {energyBalance} / {energy.produced}
        </Typography>
      </Box>
    </Box>
  );
}
