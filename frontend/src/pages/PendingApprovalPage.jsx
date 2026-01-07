import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { useAuth } from '../contexts/AuthContext';

export default function PendingApprovalPage() {
  const { t } = useTranslation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // If user is now approved, redirect
  if (user?.isApproved || user?.role === 'ADMIN') {
    navigate('/');
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'background.default',
        p: 2
      }}
    >
      <Card sx={{ maxWidth: 450, width: '100%' }}>
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            p: 4
          }}
        >
          <HourglassEmptyIcon sx={{ fontSize: 64, color: 'warning.main' }} />

          <Typography variant="h5" component="h1" textAlign="center">
            {t('pending.title')}
          </Typography>

          <Typography variant="body1" color="text.secondary" textAlign="center">
            {t('pending.message')}
          </Typography>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {user?.email}
            </Typography>
            <Button variant="outlined" onClick={handleLogout}>
              {t('pending.logout')}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
