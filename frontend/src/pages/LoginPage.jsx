import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GoogleLogin } from '@react-oauth/google';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import LanguageIcon from '@mui/icons-material/Language';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { login, enterGuestMode } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [langAnchorEl, setLangAnchorEl] = useState(null);

  const handleSuccess = async (credentialResponse) => {
    try {
      setError(null);
      const user = await login(credentialResponse.credential);

      // Redirect based on approval status
      if (user.isApproved || user.role === 'ADMIN') {
        navigate('/menu');
      } else {
        navigate('/pending');
      }
    } catch (err) {
      setError(t('login.error'));
    }
  };

  const handleError = () => {
    setError(t('login.error'));
  };

  const handlePlayAsGuest = () => {
    enterGuestMode();
    navigate('/menu');
  };

  const handleLangMenu = (event) => {
    setLangAnchorEl(event.currentTarget);
  };

  const handleLangClose = () => {
    setLangAnchorEl(null);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    handleLangClose();
  };

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
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <IconButton onClick={handleLangMenu} sx={{ color: 'text.secondary' }}>
          <LanguageIcon />
        </IconButton>
        <Menu
          anchorEl={langAnchorEl}
          open={Boolean(langAnchorEl)}
          onClose={handleLangClose}
        >
          <MenuItem onClick={() => changeLanguage('en')}>
            {t('language.en')}
          </MenuItem>
          <MenuItem onClick={() => changeLanguage('es')}>
            {t('language.es')}
          </MenuItem>
        </Menu>
      </Box>

      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            p: 4
          }}
        >
          {/* Logo */}
          <Box
            component="img"
            src="/assets/transLogo.png"
            alt={t('app.name')}
            sx={{
              maxWidth: '150px',
              width: '100%',
              height: 'auto',
            }}
          />

          <Typography variant="h5" component="h1" textAlign="center">
            {t('login.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            {t('login.subtitle')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 1 }}>
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
            />
          </Box>

          <Divider sx={{ width: '100%' }}>
            <Typography variant="caption" color="text.secondary">
              {t('login.or')}
            </Typography>
          </Divider>

          <Button
            variant="outlined"
            size="large"
            startIcon={<PersonIcon />}
            onClick={handlePlayAsGuest}
            fullWidth
          >
            {t('menu.playAsGuest')}
          </Button>

          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
          >
            {t('menu.guestSaveWarning')}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
