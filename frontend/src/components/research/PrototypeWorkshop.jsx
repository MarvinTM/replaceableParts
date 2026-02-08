import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import BuildIcon from '@mui/icons-material/Build';
import PrototypeCard from './PrototypeCard';
import PrototypeBuildPopup from './PrototypeBuildPopup';

export default function PrototypeWorkshop({ awaitingPrototype, rules, inventory }) {
  const { t } = useTranslation();
  const [selectedPrototypeId, setSelectedPrototypeId] = useState(null);
  const [selectedPrototypeSnapshot, setSelectedPrototypeSnapshot] = useState(null);

  const handleBuildClick = (prototype) => {
    setSelectedPrototypeId(prototype.recipeId);
    setSelectedPrototypeSnapshot(prototype);
  };

  const handleClosePopup = () => {
    setSelectedPrototypeId(null);
    setSelectedPrototypeSnapshot(null);
  };

  const selectedPrototypeFromState = useMemo(() => {
    if (!selectedPrototypeId) return null;
    return awaitingPrototype.find((prototype) => prototype.recipeId === selectedPrototypeId) || null;
  }, [awaitingPrototype, selectedPrototypeId]);

  // Keep an updated snapshot while the prototype still exists in state.
  useEffect(() => {
    if (selectedPrototypeFromState) {
      setSelectedPrototypeSnapshot(selectedPrototypeFromState);
    }
  }, [selectedPrototypeFromState]);

  const selectedPrototype = selectedPrototypeFromState || selectedPrototypeSnapshot;

  const selectedRecipe = useMemo(() => {
    if (!selectedPrototypeId) return null;
    return rules.recipes.find((recipe) => recipe.id === selectedPrototypeId) || null;
  }, [rules.recipes, selectedPrototypeId]);

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
          open={Boolean(selectedPrototypeId)}
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
