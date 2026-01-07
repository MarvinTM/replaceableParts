import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FactoryIcon from '@mui/icons-material/Factory';
import ExploreIcon from '@mui/icons-material/Explore';
import ScienceIcon from '@mui/icons-material/Science';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { useAuth } from '../contexts/AuthContext';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`game-tabpanel-${index}`}
      aria-labelledby={`game-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function PlaceholderContent({ title, description, icon: Icon }) {
  const { t } = useTranslation();

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto' }}>
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          py: 6
        }}
      >
        <Icon sx={{ fontSize: 64, color: 'primary.main', opacity: 0.6 }} />
        <Typography variant="h5">{title}</Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          {description}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('main.comingSoon')}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function MainPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const tabs = [
    { label: t('main.tabs.factory'), icon: <FactoryIcon /> },
    { label: t('main.tabs.exploration'), icon: <ExploreIcon /> },
    { label: t('main.tabs.research'), icon: <ScienceIcon /> },
    { label: t('main.tabs.market'), icon: <StorefrontIcon /> }
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('main.welcome', { name: user?.name || 'Player' })}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('main.subtitle')}
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="game tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              icon={tab.icon}
              label={tab.label}
              iconPosition="start"
              id={`game-tab-${index}`}
              aria-controls={`game-tabpanel-${index}`}
            />
          ))}
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <PlaceholderContent
          title={t('main.tabs.factory')}
          description={t('main.factoryDescription')}
          icon={FactoryIcon}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <PlaceholderContent
          title={t('main.tabs.exploration')}
          description={t('main.explorationDescription')}
          icon={ExploreIcon}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <PlaceholderContent
          title={t('main.tabs.research')}
          description={t('main.researchDescription')}
          icon={ScienceIcon}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <PlaceholderContent
          title={t('main.tabs.market')}
          description={t('main.marketDescription')}
          icon={StorefrontIcon}
        />
      </TabPanel>
    </Box>
  );
}
