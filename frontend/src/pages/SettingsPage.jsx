import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import SettingsIcon from '@mui/icons-material/Settings';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (event) => {
    i18n.changeLanguage(event.target.value);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('settings.title')}
      </Typography>

      <Card sx={{ maxWidth: 600 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('settings.general')}
          </Typography>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="language-select-label">{t('language.select')}</InputLabel>
            <Select
              labelId="language-select-label"
              value={i18n.language}
              label={t('language.select')}
              onChange={handleLanguageChange}
            >
              <MenuItem value="en">{t('language.en')}</MenuItem>
              <MenuItem value="es">{t('language.es')}</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mt: 4, textAlign: 'center', py: 4 }}>
            <SettingsIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              {t('settings.moreComingSoon')}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
