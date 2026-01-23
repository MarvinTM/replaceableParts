import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import BuildIcon from '@mui/icons-material/Build';
import PrototypeCard from './PrototypeCard';
import PrototypeBuildPopup from './PrototypeBuildPopup';

export default function PrototypeWorkshop({ awaitingPrototype, rules, inventory }) {
  const [selectedPrototype, setSelectedPrototype] = useState(null);

  const handleBuildClick = (prototype) => {
    setSelectedPrototype(prototype);
  };

  const handleClosePopup = () => {
    setSelectedPrototype(null);
  };

  if (awaitingPrototype.length === 0) {
    return (
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
          No prototypes awaiting construction
        </Typography>
        <Typography variant="body2" textAlign="center">
          Run experiments to discover new recipes and begin prototyping
        </Typography>
      </Box>
    );
  }

  // Get selected recipe for popup
  const selectedRecipe = selectedPrototype
    ? rules.recipes.find(r => r.id === selectedPrototype.recipeId)
    : null;

  return (
    <>
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
