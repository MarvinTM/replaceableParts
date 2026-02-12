import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MaterialIcon from '../common/MaterialIcon';
import Chip from '@mui/material/Chip';
import useGameStore from '../../stores/gameStore';

/**
 * Global notifier for recipe discoveries.
 * This component should be rendered at the app root level so it can
 * detect and notify about discovered recipes regardless of which tab is active.
 */
export default function DiscoveryNotifier() {
  const awaitingPrototype = useGameStore((state) => state.engineState?.research?.awaitingPrototype || []);
  const rules = useGameStore((state) => state.rules);

  // Queue of discovered recipes to show (in case multiple are discovered at once)
  const [discoveryQueue, setDiscoveryQueue] = useState([]);

  // Keep track of previous prototypes to detect new additions
  const prevPrototypesRef = useRef([]);
  const initializedRef = useRef(false);

  // Detect when new prototypes are added (recipes discovered)
  useEffect(() => {
    // Skip the first render to avoid showing notifications for existing prototypes
    if (!initializedRef.current) {
      initializedRef.current = true;
      prevPrototypesRef.current = awaitingPrototype;
      return;
    }

    const prevIds = new Set(prevPrototypesRef.current.map(p => p.recipeId));
    const newlyDiscovered = [];

    // Find prototypes that were added (discovered)
    for (const proto of awaitingPrototype) {
      if (!prevIds.has(proto.recipeId)) {
        // This is a newly discovered recipe
        const recipe = rules?.recipes?.find(r => r.id === proto.recipeId);
        if (recipe) {
          // Get output info
          const outputEntry = Object.entries(recipe.outputs)[0];
          if (outputEntry) {
            const [outputId] = outputEntry;
            const material = rules.materials?.find(m => m.id === outputId);
            newlyDiscovered.push({
              recipeId: proto.recipeId,
              outputId,
              materialName: material?.name || proto.recipeId,
              materialAge: material?.age,
              mode: proto.mode,
              victory: recipe.victory || false,
            });
          }
        }
      }
    }

    // Add newly discovered to queue
    if (newlyDiscovered.length > 0) {
      setDiscoveryQueue(prev => [...prev, ...newlyDiscovered]);
    }

    // Update ref for next comparison
    prevPrototypesRef.current = awaitingPrototype;
  }, [awaitingPrototype, rules]);

  // Get the current discovery to show (first in queue)
  const currentDiscovery = discoveryQueue[0] || null;

  const handleClose = () => {
    // Remove the first item from queue
    setDiscoveryQueue(prev => prev.slice(1));
  };

  if (!currentDiscovery) {
    return null;
  }

  return (
    <DiscoveryDialog
      open={Boolean(currentDiscovery)}
      onClose={handleClose}
      outputId={currentDiscovery.outputId}
      materialName={currentDiscovery.materialName}
      materialAge={currentDiscovery.materialAge}
      mode={currentDiscovery.mode}
      victory={currentDiscovery.victory}
    />
  );
}

// Dialog for recipe discovery
function DiscoveryDialog({ open, onClose, outputId, materialName, materialAge, mode, victory }) {
  const { t } = useTranslation();

  // Auto-close after 4 seconds
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  const locationText = mode === 'flow' ? t('research.autoFillQueue') : t('research.prototypeWorkshop');
  const accentColor = victory ? '#FFD700' : 'secondary.main';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: 350,
          bgcolor: 'background.paper',
          backgroundImage: victory
            ? 'linear-gradient(180deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0) 50%)'
            : 'linear-gradient(180deg, rgba(156, 39, 176, 0.15) 0%, rgba(156, 39, 176, 0) 50%)',
        }
      }}
    >
      <DialogContent>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300,
          gap: 2,
          py: 4
        }}>
          <AutoAwesomeIcon sx={{
            fontSize: 96,
            color: accentColor,
            animation: 'pulse 1.5s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { transform: 'scale(1)', opacity: 1 },
              '50%': { transform: 'scale(1.1)', opacity: 0.8 },
            }
          }} />
          <Typography variant="h4" sx={{ color: accentColor }} fontWeight="bold">
            {t('research.newDiscovery')}
          </Typography>
          <Box sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: 'action.hover',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1
          }}>
            <MaterialIcon materialId={outputId} size={64} />
            <Typography variant="h6">
              {materialName}
            </Typography>
            {materialAge && (
              <Chip
                label={t('research.age', { age: materialAge })}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
          </Box>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
            {t('research.experimentSuccessful')}
            <br />
            {t('research.buildPrototypeHint', { location: locationText })}
          </Typography>
          <Button
            variant="contained"
            color={victory ? 'warning' : 'secondary'}
            onClick={onClose}
            sx={{ mt: 2 }}
          >
            {t('research.continue')}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
