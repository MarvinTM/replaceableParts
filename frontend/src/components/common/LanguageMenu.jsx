import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import LanguageIcon from '@mui/icons-material/Language';
import { SUPPORTED_LANGUAGES } from '../../i18n';

export default function LanguageMenu({ sx, color = 'inherit' }) {
  const { t, i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    // Stop propagation to prevent triggering parent click handlers (e.g., in LandingPage)
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event) => {
    if (event) event.stopPropagation();
    setAnchorEl(null);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    handleClose();
  };

  return (
    <>
      <IconButton
        onClick={handleMenu}
        sx={sx}
        color={color}
        data-lang-menu
      >
        <LanguageIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <MenuItem 
            key={lang.code} 
            onClick={(e) => {
              e.stopPropagation();
              changeLanguage(lang.code);
            }}
            selected={i18n.language === lang.code}
          >
            {t(lang.labelKey)}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
