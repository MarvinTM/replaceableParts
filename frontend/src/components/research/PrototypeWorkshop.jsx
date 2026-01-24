import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import BuildIcon from '@mui/icons-material/Build';
import PrototypeCard from './PrototypeCard';
import PrototypeBuildPopup from './PrototypeBuildPopup';

export default function PrototypeWorkshop({ awaitingPrototype, rules, inventory }) {
  const { t } = useTranslation();
  const [selectedPrototype, setSelectedPrototype] = useState(null);

  const handleBuildClick = (prototype) => {
    setSelectedPrototype(prototype);
  };

  const handleClosePopup = () => {
    setSelectedPrototype(null);
  };

  // Get selected recipe for popup
  const selectedRecipe = selectedPrototype
    ? rules.recipes.find(r => r.id === selectedPrototype.recipeId)
    : null;

  return (
    <>
      {awaitingPrototype.length === 0 ? (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 2,
          color: 'text.secondary'
        }}>
          <BuildIcon sx={{ fontSize: 64, opacity: 0.3 }} />
          <Typography variant="body1" textAlign="center">
            {t('research.noPrototypesAwaiting')}
          </Typography>
          <Typography variant="body2" textAlign="center">
            {t('research.runExperimentsToPrototype')}
          </Typography>
        </Box>
      ) : (
        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          justifyContent: 'flex-start',
        }}>
          {awaitingPrototype.map((prototype) => {
            const recipe = rules.recipes.find(r => r.id === prototype.recipeId);
            if (!recipe) return null;

            return (
              <PrototypeCard
                key={prototype.recipeId}
                prototype={prototype}
                recipe={recipe}
                rules={rules}
                onBuildClick={handleBuildClick}
              />
            );
          })}
        </Box>
      )}

      {/* Slots-mode build popup */}
      {selectedPrototype && selectedRecipe && (
        <PrototypeBuildPopup
          open={Boolean(selectedPrototype)}
          onClose={handleClosePopup}
          prototype={selectedPrototype}
          recipe={selectedRecipe}
          rules={rules}
          inventory={inventory}
        />
      )}
    </>
  );
}
