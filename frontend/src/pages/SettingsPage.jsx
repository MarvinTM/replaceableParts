import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import SettingsIcon from '@mui/icons-material/Settings';
import useGameStore from '../stores/gameStore';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const rules = useGameStore((state) => state.rules);
  const machineAnimationMode = useGameStore((state) => state.machineAnimationMode);
  const productionAnimationStyle = useGameStore((state) => state.productionAnimationStyle);
  const disableResearch = useGameStore((state) => state.disableResearch);
  const setExpansionType = useGameStore((state) => state.setExpansionType);
  const setMachineAnimationMode = useGameStore((state) => state.setMachineAnimationMode);
  const setProductionAnimationStyle = useGameStore((state) => state.setProductionAnimationStyle);
  const setDisableResearch = useGameStore((state) => state.setDisableResearch);

  const handleLanguageChange = (event) => {
    i18n.changeLanguage(event.target.value);
  };

  const handleExpansionChange = (event) => {
    setExpansionType(event.target.value);
  };

  const handleMachineAnimationModeChange = (event) => {
    setMachineAnimationMode(event.target.value);
  };

  const handleProductionAnimationChange = (event) => {
    setProductionAnimationStyle(event.target.value);
  };

  const handleDisableResearchChange = (event) => {
    setDisableResearch(event.target.checked);
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
              <MenuItem value="fr">{t('language.fr')}</MenuItem>
              <MenuItem value="de">{t('language.de')}</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mt: 3 }}>
            <InputLabel id="expansion-select-label">Expansion Logic</InputLabel>
            <Select
              labelId="expansion-select-label"
              value={rules.floorSpace.expansionType}
              label="Expansion Logic"
              onChange={handleExpansionChange}
            >
              <MenuItem value="spiral">Spiral (Chunks)</MenuItem>
              <MenuItem value="fractal">Fractal (Strips)</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mt: 3 }}>
            <InputLabel id="machine-anim-label">{t('settings.machineAnimation')}</InputLabel>
            <Select
              labelId="machine-anim-label"
              value={machineAnimationMode}
              label={t('settings.machineAnimation')}
              onChange={handleMachineAnimationModeChange}
            >
              <MenuItem value="disabled">{t('settings.machineAnimations.disabled')}</MenuItem>
              <MenuItem value="sometimes">{t('settings.machineAnimations.sometimes')}</MenuItem>
              <MenuItem value="continuous">{t('settings.machineAnimations.continuous')}</MenuItem>
            </Select>
          </FormControl>

          {machineAnimationMode !== 'disabled' && (
            <FormControl fullWidth sx={{ mt: 3 }}>
              <InputLabel id="production-anim-label">{t('settings.productionAnimation')}</InputLabel>
              <Select
                labelId="production-anim-label"
                value={productionAnimationStyle}
                label={t('settings.productionAnimation')}
                onChange={handleProductionAnimationChange}
              >
                <MenuItem value="floatingFadeOut">{t('settings.productionAnimations.floatingFadeOut')}</MenuItem>
                <MenuItem value="popAndFloat">{t('settings.productionAnimations.popAndFloat')}</MenuItem>
                <MenuItem value="flyToInventory">{t('settings.productionAnimations.flyToInventory')}</MenuItem>
                <MenuItem value="collectThenFly">{t('settings.productionAnimations.collectThenFly')}</MenuItem>
              </Select>
            </FormControl>
          )}

          <FormControlLabel
            sx={{ mt: 3, display: 'flex' }}
            control={
              <Switch
                checked={disableResearch}
                onChange={handleDisableResearchChange}
              />
            }
            label={t('settings.disableResearch')}
          />

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
