import { useState, useMemo, useEffect } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import CloseIcon from '@mui/icons-material/Close';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MaterialIcon from '../common/MaterialIcon';
import useGameStore from '../../stores/gameStore';

// Age colors for chips
const AGE_COLORS = {
  1: '#8B4513',
  2: '#CD7F32',
  3: '#708090',
  4: '#FF8C00',
  5: '#4169E1',
  6: '#9370DB',
  7: '#00CED1'
};

export default function PrototypeBuildPopup({
  open,
  onClose,
  prototype: initialPrototype,
  recipe,
  rules,
  inventory,
}) {
  const fillPrototypeSlot = useGameStore((state) => state.fillPrototypeSlot);

  // Get current prototype state directly from store (not the snapshot from props)
  const prototype = useGameStore((state) => {
    if (!initialPrototype) return null;
    const awaiting = state.engineState?.research?.awaitingPrototype || [];
    return awaiting.find(p => p.recipeId === initialPrototype.recipeId) || null;
  });
  const awaitingPrototype = useGameStore((state) => state.engineState?.research?.awaitingPrototype || []);
  const currentInventory = useGameStore((state) => state.engineState?.inventory || {});

  // Build state: 'building' or 'success'
  const [buildState, setBuildState] = useState('building');

  // Track which slot is being dragged over
  const [dragOverSlot, setDragOverSlot] = useState(null);

  // Reset state when popup opens/closes
  useEffect(() => {
    if (open) {
      setBuildState('building');
      setDragOverSlot(null);
    }
  }, [open]);

  // Detect when prototype is completed (removed from awaitingPrototype)
  useEffect(() => {
    if (open && initialPrototype && buildState === 'building') {
      const stillExists = awaitingPrototype.some(p => p.recipeId === initialPrototype.recipeId);
      if (!stillExists) {
        // Prototype was completed and removed from the queue
        setBuildState('success');
        // Auto-close after 3 seconds
        const timer = setTimeout(() => {
          onClose();
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [awaitingPrototype, initialPrototype, open, buildState, onClose]);

  // Get recipe output info
  const outputInfo = useMemo(() => {
    if (!recipe) return null;
    const entry = Object.entries(recipe.outputs)[0];
    if (!entry) return null;
    const [outputId, qty] = entry;
    const material = rules.materials.find(m => m.id === outputId);
    return { outputId, qty, material };
  }, [recipe, rules]);

  // Get unique materials needed for slots (use currentInventory from store)
  const uniqueMaterials = useMemo(() => {
    if (!prototype?.slots) return [];
    const materialIds = [...new Set(prototype.slots.map(s => s.material))];
    return materialIds.map(id => {
      const material = rules.materials?.find(m => m.id === id);
      const neededTotal = prototype.slots
        .filter(s => s.material === id)
        .reduce((sum, s) => sum + s.quantity, 0);
      const filledTotal = prototype.slots
        .filter(s => s.material === id)
        .reduce((sum, s) => sum + s.filled, 0);
      const remaining = neededTotal - filledTotal;
      const availableInInventory = currentInventory[id] || 0;
      return {
        id,
        name: material?.name || id,
        category: material?.category || 'default',
        needed: neededTotal,
        filled: filledTotal,
        remaining,
        available: availableInInventory,
        canDrag: availableInInventory > 0 && remaining > 0,
      };
    });
  }, [prototype, rules, currentInventory]);

  // Check if all slots are filled
  const allSlotsFilled = useMemo(() => {
    if (!prototype?.slots) return false;
    return prototype.slots.every(slot => slot.filled >= slot.quantity);
  }, [prototype]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (!prototype?.slots) return 0;
    const totalRequired = prototype.slots.reduce((sum, slot) => sum + slot.quantity, 0);
    const totalFilled = prototype.slots.reduce((sum, slot) => sum + slot.filled, 0);
    return totalRequired > 0 ? Math.round((totalFilled / totalRequired) * 100) : 0;
  }, [prototype]);

  // Handle drag start from inventory material
  const handleMaterialDragStart = (e, materialId) => {
    e.dataTransfer.setData('text/plain', materialId);
    e.dataTransfer.effectAllowed = 'move';
    const dragImage = e.currentTarget.querySelector('img');
    if (dragImage) {
      e.dataTransfer.setDragImage(dragImage, 20, 20);
    }
  };

  // Handle drag over a slot - must preventDefault to allow drop
  const handleSlotDragOver = (e, slotIndex, slot) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(slotIndex);
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drag leave from a slot
  const handleSlotDragLeave = () => {
    setDragOverSlot(null);
  };

  // Handle drop on a slot
  const handleSlotDrop = (e, slotIndex, slot) => {
    e.preventDefault();
    setDragOverSlot(null);

    const droppedMaterial = e.dataTransfer.getData('text/plain');

    // Check if the dropped material matches the slot's required material
    if (droppedMaterial !== slot.material) {
      return; // Wrong material for this slot
    }

    // Calculate how much we can fill
    const neededForSlot = slot.quantity - slot.filled;
    if (neededForSlot <= 0) {
      return; // Slot is already full
    }

    const availableInInventory = currentInventory[droppedMaterial] || 0;
    if (availableInInventory <= 0) {
      return; // No materials available
    }

    // Fill as much as possible (min of what's needed and what's available)
    const unitsToAdd = Math.min(neededForSlot, availableInInventory);

    if (unitsToAdd > 0) {
      fillPrototypeSlot(initialPrototype.recipeId, droppedMaterial, unitsToAdd);
    }
  };

  // Handle build button click
  const handleBuild = () => {
    if (allSlotsFilled) {
      setBuildState('success');
      // Auto-close after 3 seconds
      setTimeout(() => {
        handleClose();
      }, 3000);
    }
  };

  // Handle close
  const handleClose = () => {
    setBuildState('building');
    setDragOverSlot(null);
    onClose();
  };

  // If prototype is null (completed), the success effect should handle it
  // Only render nothing if we don't have basic info
  if (!initialPrototype || !recipe || !outputInfo) return null;

  // If prototype is completed (null), show success state
  if (!prototype && buildState !== 'success') {
    return null;
  }

  // Safety check - this popup only works for slots mode prototypes
  if (prototype && prototype.mode !== 'slots') {
    return null;
  }

  const SLOT_SIZE = 80;

  // Success state view
  if (buildState === 'success') {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { minHeight: 500 } }}
      >
        <DialogContent>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400,
            gap: 3,
            py: 4
          }}>
            <CheckCircleIcon sx={{ fontSize: 96, color: 'success.main' }} />
            <Typography variant="h4" color="success.main" fontWeight="bold">
              Prototype Complete!
            </Typography>
            <MaterialIcon materialId={outputInfo.outputId} size={80} />
            <Typography variant="h6">
              {outputInfo.material?.name || prototype.recipeId}
            </Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              This recipe has been unlocked for production.
              <br />
              You can now assign it to your machines.
            </Typography>
            <Button
              variant="contained"
              color="success"
              onClick={handleClose}
              sx={{ mt: 2 }}
            >
              Continue
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  // Building state view
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { minHeight: 500 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BuildIcon color="primary" />
          <Typography variant="h6">
            Build Prototype: {outputInfo.material?.name || prototype.recipeId}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Large Material Preview */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <MaterialIcon materialId={outputInfo.outputId} size={128} />
        </Box>

        {/* Name and Age */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            {outputInfo.material?.name || prototype.recipeId}
          </Typography>
          <Chip
            label={`Age ${outputInfo.material?.age || '?'}`}
            sx={{
              bgcolor: AGE_COLORS[outputInfo.material?.age] || '#666',
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        </Box>

        {/* Description Placeholder */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          {outputInfo.material?.description || 'Description coming soon...'}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {/* Overall Progress */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">Overall Progress</Typography>
            <Typography variant="body2">{overallProgress}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={overallProgress}
            color="warning"
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>

        {/* Component Slots Section */}
        <Typography variant="subtitle2" gutterBottom>
          Required Components
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Drag materials from below to fill each slot
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            p: 2,
            backgroundColor: 'action.hover',
            borderRadius: 1,
            mb: 2,
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          {(prototype?.slots || []).map((slot, index) => {
            const isFull = slot.filled >= slot.quantity;
            const isPartial = slot.filled > 0 && slot.filled < slot.quantity;
            const isDragOver = dragOverSlot === index;
            const material = rules.materials?.find(m => m.id === slot.material);
            const progress = (slot.filled / slot.quantity) * 100;

            return (
              <Box
                key={index}
                onDragOver={(e) => handleSlotDragOver(e, index, slot)}
                onDragLeave={handleSlotDragLeave}
                onDrop={(e) => handleSlotDrop(e, index, slot)}
                sx={{
                  width: SLOT_SIZE,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 1,
                  border: '2px solid',
                  borderColor: isFull
                    ? 'success.main'
                    : isPartial
                      ? 'warning.main'
                      : isDragOver
                        ? 'primary.main'
                        : 'divider',
                  borderRadius: 1,
                  backgroundColor: isFull
                    ? 'success.light'
                    : isPartial
                      ? 'warning.light'
                      : isDragOver
                        ? 'primary.light'
                        : 'background.paper',
                  transition: 'all 0.2s ease',
                }}
              >
                <Box sx={{ opacity: isFull ? 1 : isPartial ? 0.7 : 0.3 }}>
                  <MaterialIcon
                    materialId={slot.material}
                    materialName={material?.name}
                    category={material?.category}
                    size={40}
                    showTooltip={false}
                  />
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 'bold',
                    color: isFull ? 'success.dark' : isPartial ? 'warning.dark' : 'text.secondary',
                    mt: 0.5,
                  }}
                >
                  {slot.filled}/{slot.quantity}
                </Typography>

                {slot.quantity > 1 && (
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    color={isFull ? 'success' : isPartial ? 'warning' : 'primary'}
                    sx={{
                      width: '100%',
                      height: 4,
                      borderRadius: 1,
                      mt: 0.5,
                      backgroundColor: 'action.disabledBackground',
                    }}
                  />
                )}

                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.6rem',
                    textAlign: 'center',
                    lineHeight: 1.1,
                    mt: 0.25,
                    color: isFull ? 'success.dark' : 'text.secondary',
                    maxWidth: SLOT_SIZE - 8,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    wordBreak: 'break-word',
                  }}
                >
                  {material?.name || slot.material}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Available Materials Section */}
        <Typography variant="subtitle2" gutterBottom>
          Available Materials
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            p: 2,
            backgroundColor: 'background.default',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {uniqueMaterials.map((material) => {
            const hasEnough = material.available >= material.remaining;
            const progress = (material.filled / material.needed) * 100;

            return (
              <Box
                key={material.id}
                draggable={material.canDrag}
                onDragStart={(e) => handleMaterialDragStart(e, material.id)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 1,
                  border: '1px solid',
                  borderColor: hasEnough ? 'success.light' : 'error.light',
                  borderRadius: 1,
                  backgroundColor: 'background.paper',
                  cursor: material.canDrag ? 'grab' : 'not-allowed',
                  opacity: material.canDrag ? 1 : 0.5,
                  minWidth: 90,
                  '&:hover': material.canDrag ? {
                    borderColor: 'primary.main',
                    boxShadow: 1,
                  } : {},
                  '&:active': material.canDrag ? {
                    cursor: 'grabbing',
                  } : {},
                }}
              >
                <MaterialIcon
                  materialId={material.id}
                  materialName={material.name}
                  category={material.category}
                  size={44}
                  showTooltip
                />
                <Typography variant="caption" sx={{ fontWeight: 500, mt: 0.5, textAlign: 'center' }}>
                  {material.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: material.filled >= material.needed ? 'success.main' : hasEnough ? 'text.primary' : 'error.main',
                    fontWeight: 'bold',
                  }}
                >
                  {material.filled}/{material.needed}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  color={material.filled >= material.needed ? 'success' : 'primary'}
                  sx={{
                    width: '100%',
                    height: 4,
                    borderRadius: 1,
                    mt: 0.5,
                    backgroundColor: 'action.disabledBackground',
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  ({material.available} in inv.)
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Warning if not enough materials */}
        {uniqueMaterials.some(m => m.available < m.remaining) && (
          <Typography
            variant="body2"
            color="error"
            sx={{ mt: 2, textAlign: 'center' }}
          >
            Not enough materials in inventory to complete this prototype
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleBuild}
          variant="contained"
          color="primary"
          disabled={!allSlotsFilled}
          startIcon={<BuildIcon />}
        >
          Build Prototype
        </Button>
      </DialogActions>
    </Dialog>
  );
}
