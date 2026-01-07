import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GoogleLogin } from '@react-oauth/google';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import LanguageIcon from '@mui/icons-material/Language';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [langAnchorEl, setLangAnchorEl] = useState(null);

  const handleSuccess = async (credentialResponse) => {
    try {
      setError(null);
      const user = await login(credentialResponse.credential);

      // Redirect based on approval status
      if (user.isApproved || user.role === 'ADMIN') {
        navigate('/');
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
        <IconButton color="inherit" onClick={handleLangMenu}>
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
          <Typography variant="h4" component="h1" textAlign="center">
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

          <Box sx={{ mt: 2 }}>
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              theme="filled_blue"
              size="large"
              text="signin_with"
              shape="rectangular"
            />
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
            sx={{ mt: 2 }}
          >
            {t('app.tagline')}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
