import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';

import InfoPanel from './InfoPanel';

const DONATION_URL = 'https://buymeacoffee.com/marvintm';

/**
 * Donation panel for the main menu.
 */
export default function DonatePanel() {
  const { t } = useTranslation();

  return (
    <InfoPanel
      title={t('mainMenu.donateTitle')}
      icon={<LocalCafeIcon />}
      side="left"
      minHeight={210}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          {t('mainMenu.donateDescription')}
        </Typography>
        <Button
          variant="contained"
          href={DONATION_URL}
          target="_blank"
          rel="noopener noreferrer"
          startIcon={<LocalCafeIcon sx={{ fontSize: 18 }} />}
          fullWidth
        >
          {t('mainMenu.donateButton')}
        </Button>
      </Box>
    </InfoPanel>
  );
}
