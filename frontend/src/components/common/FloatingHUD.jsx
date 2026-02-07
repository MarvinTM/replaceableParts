import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import BoltIcon from '@mui/icons-material/Bolt';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { CREDIT_SYMBOL } from '../../utils/currency';
import MaterialIcon from './MaterialIcon';

export default function FloatingHUD({ credits, energy, rawMaterialBalance = [] }) {
  const energyBalance = energy.produced - energy.consumed;
  const isEnergyDeficit = energyBalance < 0;

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
          <BoltIcon sx={{ fontSize: 18, color: isEnergyDeficit ? 'error.light' : 'warning.light' }} />
          <Typography
            variant="body2"
            component="span"
            sx={{
              color: isEnergyDeficit ? 'error.light' : 'white',
              fontWeight: 500
            }}
          >
            {energyBalance} / {energy.produced}
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
