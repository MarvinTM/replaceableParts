import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MaterialIcon from '../common/MaterialIcon';
import useGameStore from '../../stores/gameStore';

/**
 * Global notifier for flow-mode prototype completions.
 * This component should be rendered at the app root level so it can
 * detect and notify about completed prototypes regardless of which tab is active.
 */
export default function FlowPrototypeNotifier() {
  const awaitingPrototype = useGameStore((state) => state.engineState?.research?.awaitingPrototype || []);
  const rules = useGameStore((state) => state.rules);

  // Queue of completed prototypes to show (in case multiple complete at once)
  const [completedQueue, setCompletedQueue] = useState([]);

  // Keep track of previous prototypes to detect completions
  const prevPrototypesRef = useRef([]);

  // Detect when flow-mode prototypes complete
  useEffect(() => {
    const prevPrototypes = prevPrototypesRef.current;
    const currentIds = new Set(awaitingPrototype.map(p => p.recipeId));

    const newlyCompleted = [];

    // Find prototypes that were removed (completed)
    for (const prevProto of prevPrototypes) {
      if (!currentIds.has(prevProto.recipeId) && prevProto.mode === 'flow') {
        // This flow-mode prototype was completed
        const recipe = rules?.recipes?.find(r => r.id === prevProto.recipeId);
        if (recipe) {
          // Get output info
          const outputEntry = Object.entries(recipe.outputs)[0];
          if (outputEntry) {
            const [outputId] = outputEntry;
            const material = rules.materials?.find(m => m.id === outputId);
            newlyCompleted.push({
              recipeId: prevProto.recipeId,
              outputId,
              materialName: material?.name || prevProto.recipeId,
              materialAge: material?.age,
            });
          }
        }
      }
    }

    // Add newly completed to queue
    if (newlyCompleted.length > 0) {
      setCompletedQueue(prev => [...prev, ...newlyCompleted]);
    }

    // Update ref for next comparison
    prevPrototypesRef.current = awaitingPrototype;
  }, [awaitingPrototype, rules]);

  // Get the current prototype to show (first in queue)
  const currentCompleted = completedQueue[0] || null;

  const handleClose = () => {
    // Remove the first item from queue
    setCompletedQueue(prev => prev.slice(1));
  };

  if (!currentCompleted) {
    return null;
  }

  return (
    <FlowCompleteDialog
      open={Boolean(currentCompleted)}
      onClose={handleClose}
      outputId={currentCompleted.outputId}
      materialName={currentCompleted.materialName}
    />
  );
}

// Dialog for flow-mode prototype completion
function FlowCompleteDialog({ open, onClose, outputId, materialName }) {
  // Auto-close after 3 seconds
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { minHeight: 300 } }}
    >
      <DialogContent>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 250,
          gap: 3,
          py: 4
        }}>
          <CheckCircleIcon sx={{ fontSize: 96, color: 'success.main' }} />
          <Typography variant="h4" color="success.main" fontWeight="bold">
            Prototype Complete!
          </Typography>
          <MaterialIcon materialId={outputId} size={64} />
          <Typography variant="h6">
            {materialName}
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            This recipe has been unlocked for production.
            <br />
            You can now assign it to your machines.
          </Typography>
          <Button
            variant="contained"
            color="success"
            onClick={onClose}
            sx={{ mt: 2 }}
          >
            Continue
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
