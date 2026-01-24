import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import LanguageIcon from '@mui/icons-material/Language';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';

export default function Layout({ children }) {
  const { t, i18n } = useTranslation();
  const { user, logout, isAdmin, isAuthenticated, isGuest, exitGuestMode } = useAuth();
  const { exitToMenu, isInGame, saveGame } = useGame();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're currently on the game page
  const isOnGamePage = location.pathname === '/game';

  const [anchorEl, setAnchorEl] = useState(null);
  const [langAnchorEl, setLangAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLangMenu = (event) => {
    setLangAnchorEl(event.currentTarget);
  };

  const handleLangClose = () => {
    setLangAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await exitToMenu();
    if (isAuthenticated) {
      await logout();
    } else if (isGuest) {
      exitGuestMode();
    }
    navigate('/menu');
  };

  const handleSignIn = () => {
    handleClose();
    navigate('/login');
  };

  const handleNavigate = async (path) => {
    handleClose();
    // Save game if navigating away from game page
    if (isOnGamePage && isInGame) {
      try {
        await saveGame();
      } catch (error) {
        console.error('Failed to save before navigation:', error);
      }
    }
    navigate(path);
  };

  const handleBackToMenu = async () => {
    await exitToMenu();
    navigate('/menu');
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    handleLangClose();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          {/* Logo with background */}
          <Box
            onClick={handleBackToMenu}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#FAF3E6',
              borderRadius: 1.5,
              px: 1,
              py: 0.5,
              mr: 2,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: '#F4E4C9',
              },
            }}
          >
            <Box
              component="img"
              src="/assets/transLogo.png"
              alt={t('app.name')}
              sx={{
                height: 40,
                width: 'auto',
              }}
            />
          </Box>

          <Box sx={{ flexGrow: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
            {isInGame && (
              <Button
                color="inherit"
                startIcon={<MenuIcon />}
                onClick={handleBackToMenu}
              >
                {t('nav.mainMenu')}
              </Button>
            )}
            <Button
              color="inherit"
              startIcon={<SettingsIcon />}
              onClick={() => handleNavigate('/settings')}
              sx={{
                backgroundColor: location.pathname === '/settings' ? 'rgba(255,255,255,0.1)' : 'transparent'
              }}
            >
              {t('menu.settings')}
            </Button>
            {isAdmin && (
              <Button
                color="inherit"
                startIcon={<AdminPanelSettingsIcon />}
                onClick={() => handleNavigate('/admin')}
                sx={{
                  backgroundColor: location.pathname === '/admin' ? 'rgba(255,255,255,0.1)' : 'transparent'
                }}
              >
                {t('nav.admin')}
              </Button>
            )}

            {/* Guest mode indicator */}
            {isGuest && !isAuthenticated && (
              <Chip
                label={t('menu.guestMode')}
                size="small"
                variant="outlined"
                sx={{
                  ml: 2,
                  color: 'inherit',
                  borderColor: 'rgba(255,255,255,0.5)',
                }}
              />
            )}
          </Box>

          <IconButton
            color="inherit"
            onClick={handleLangMenu}
            sx={{ mr: 1 }}
          >
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

          <IconButton onClick={handleMenu} sx={{ p: 0 }}>
            {isAuthenticated ? (
              <Avatar
                alt={user?.name || 'User'}
                src={user?.picture}
                sx={{ width: 36, height: 36 }}
              />
            ) : (
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.main' }}>
                <PersonIcon />
              </Avatar>
            )}
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle1">
                {isAuthenticated ? user?.name : t('menu.welcomeGuest')}
              </Typography>
              {isAuthenticated && (
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>
              )}
            </Box>
            <Divider />
            <MenuItem onClick={handleBackToMenu}>
              <ListItemIcon>
                <MenuIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('nav.mainMenu')}</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleNavigate('/settings')}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('menu.settings')}</ListItemText>
            </MenuItem>
            {isAdmin && (
              <MenuItem onClick={() => handleNavigate('/admin')}>
                <ListItemIcon>
                  <AdminPanelSettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{t('nav.admin')}</ListItemText>
              </MenuItem>
            )}
            <Divider />
            {isGuest && !isAuthenticated && (
              <MenuItem onClick={handleSignIn}>
                <ListItemIcon>
                  <LoginIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{t('menu.signIn')}</ListItemText>
              </MenuItem>
            )}
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                {isAuthenticated ? t('nav.logout') : t('nav.exitGuest')}
              </ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
}
