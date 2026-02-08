import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
import AutoModeIcon from '@mui/icons-material/AutoMode';
import MaterialIcon from '../common/MaterialIcon';
import StructureSpriteIcon from '../common/StructureSpriteIcon';
import useGameStore from '../../stores/gameStore';
import { getMaterialDescription, getMaterialName } from '../../utils/translationHelpers';

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
}) {
  const { t } = useTranslation();
  const fillPrototypeSlot = useGameStore((state) => state.fillPrototypeSlot);
  const currentInventory = useGameStore((state) => state.engineState?.inventory || {});

  // Build state: 'building' or 'success'
  const [buildState, setBuildState] = useState('building');

  // Track which slot is being dragged over
  const [dragOverSlot, setDragOverSlot] = useState(null);

  // LOCAL state for slot fills - only committed to store on Build
  // Key: slot index, Value: number of units filled locally
  const [localSlotFills, setLocalSlotFills] = useState({});
  const autoCloseTimeoutRef = useRef(null);

  const clearAutoCloseTimeout = useCallback(() => {
    if (autoCloseTimeoutRef.current) {
      clearTimeout(autoCloseTimeoutRef.current);
      autoCloseTimeoutRef.current = null;
    }
  }, []);

  // Reset state when popup opens/closes
  useEffect(() => {
    if (open) {
      setBuildState('building');
      setDragOverSlot(null);
      setLocalSlotFills({});
    }
  }, [open]);

  // Prevent stale auto-close callbacks from closing future popups.
  useEffect(() => {
    if (!open) {
      clearAutoCloseTimeout();
    }
  }, [open, clearAutoCloseTimeout]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      clearAutoCloseTimeout();
    };
  }, [clearAutoCloseTimeout]);

  // Get recipe output info
  const outputInfo = useMemo(() => {
    if (!recipe) return null;
    const entry = Object.entries(recipe.outputs)[0];
    if (!entry) return null;
    const [outputId, qty] = entry;
    const material = rules.materials.find(m => m.id === outputId);
    return { outputId, qty, material };
  }, [recipe, rules]);

  const materialDescription = getMaterialDescription(
    outputInfo?.outputId,
    outputInfo?.material?.description
  );

  // Calculate effective inventory (current inventory minus locally allocated)
  const effectiveInventory = useMemo(() => {
    if (!initialPrototype?.slots) return currentInventory;

    const allocated = {};
    for (const [slotIndexStr, fillAmount] of Object.entries(localSlotFills)) {
      const slotIndex = parseInt(slotIndexStr);
      const slot = initialPrototype.slots[slotIndex];
      if (slot) {
        allocated[slot.material] = (allocated[slot.material] || 0) + fillAmount;
      }
    }

    const effective = { ...currentInventory };
    for (const [materialId, amount] of Object.entries(allocated)) {
      effective[materialId] = (effective[materialId] || 0) - amount;
      if (effective[materialId] <= 0) {
        delete effective[materialId];
      }
    }
    return effective;
  }, [currentInventory, localSlotFills, initialPrototype]);

  // Get slots with combined fills (existing + local)
  const slotsWithFills = useMemo(() => {
    if (!initialPrototype?.slots) return [];
    return initialPrototype.slots.map((slot, index) => ({
      ...slot,
      // Total filled = existing fills from store + local fills
      effectiveFilled: slot.filled + (localSlotFills[index] || 0),
      localFill: localSlotFills[index] || 0,
    }));
  }, [initialPrototype, localSlotFills]);

  // Get unique materials needed for display (only non-raw materials that need manual filling)
  const uniqueMaterials = useMemo(() => {
    if (!slotsWithFills.length) return [];
    // Only include non-raw materials (raw materials auto-fill from production)
    const nonRawSlots = slotsWithFills.filter(s => !s.isRaw);
    const materialIds = [...new Set(nonRawSlots.map(s => s.material))];
    return materialIds.map(id => {
      const material = rules.materials?.find(m => m.id === id);
      const neededTotal = nonRawSlots
        .filter(s => s.material === id)
        .reduce((sum, s) => sum + s.quantity, 0);
      const filledTotal = nonRawSlots
        .filter(s => s.material === id)
        .reduce((sum, s) => sum + s.effectiveFilled, 0);
      const remaining = neededTotal - filledTotal;
      const availableInInventory = effectiveInventory[id] || 0;
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
  }, [slotsWithFills, rules, effectiveInventory]);

  // Check if there are any raw material slots (for display purposes)
  const hasRawSlots = useMemo(() => {
    return slotsWithFills.some(s => s.isRaw);
  }, [slotsWithFills]);

  // Check if all non-raw slots are filled (raw slots auto-fill)
  const allNonRawSlotsFilled = useMemo(() => {
    return slotsWithFills
      .filter(s => !s.isRaw)
      .every(slot => slot.effectiveFilled >= slot.quantity);
  }, [slotsWithFills]);

  // Check if all slots are filled (including local fills)
  const allSlotsFilled = useMemo(() => {
    return slotsWithFills.every(slot => slot.effectiveFilled >= slot.quantity);
  }, [slotsWithFills]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (!slotsWithFills.length) return 0;
    const totalRequired = slotsWithFills.reduce((sum, slot) => sum + slot.quantity, 0);
    const totalFilled = slotsWithFills.reduce((sum, slot) => sum + slot.effectiveFilled, 0);
    return totalRequired > 0 ? Math.round((totalFilled / totalRequired) * 100) : 0;
  }, [slotsWithFills]);

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
  const handleSlotDragOver = (e, slotIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(slotIndex);
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drag leave from a slot
  const handleSlotDragLeave = () => {
    setDragOverSlot(null);
  };

  // Handle drop on a slot - updates LOCAL state only
  const handleSlotDrop = (e, slotIndex) => {
    e.preventDefault();
    setDragOverSlot(null);

    const droppedMaterial = e.dataTransfer.getData('text/plain');
    const slot = slotsWithFills[slotIndex];

    // Check if the dropped material matches the slot's required material
    if (droppedMaterial !== slot.material) {
      return; // Wrong material for this slot
    }

    // Calculate how much we can fill
    const neededForSlot = slot.quantity - slot.effectiveFilled;
    if (neededForSlot <= 0) {
      return; // Slot is already full
    }

    const availableInInventory = effectiveInventory[droppedMaterial] || 0;
    if (availableInInventory <= 0) {
      return; // No materials available
    }

    // Fill as much as possible (min of what's needed and what's available)
    const unitsToAdd = Math.min(neededForSlot, availableInInventory);

    if (unitsToAdd > 0) {
      setLocalSlotFills(prev => ({
        ...prev,
        [slotIndex]: (prev[slotIndex] || 0) + unitsToAdd,
      }));
    }
  };

  // Handle clicking a slot to remove one unit (from local fills only)
  const handleSlotClick = (slotIndex) => {
    const currentLocalFill = localSlotFills[slotIndex] || 0;
    if (currentLocalFill > 0) {
      setLocalSlotFills(prev => {
        const newFill = currentLocalFill - 1;
        if (newFill === 0) {
          const next = { ...prev };
          delete next[slotIndex];
          return next;
        }
        return { ...prev, [slotIndex]: newFill };
      });
    }
  };

  // Handle build button click - commit all local fills to the store
  const handleBuild = () => {
    if (!allSlotsFilled) return;

    // Commit all local fills to the store
    for (const [slotIndexStr, fillAmount] of Object.entries(localSlotFills)) {
      if (fillAmount > 0) {
        const slotIndex = parseInt(slotIndexStr);
        const slot = initialPrototype.slots[slotIndex];
        if (slot) {
          fillPrototypeSlot(initialPrototype.recipeId, slot.material, fillAmount);
        }
      }
    }

    // Show success state
    setBuildState('success');
    // Auto-close after 3 seconds
    clearAutoCloseTimeout();
    autoCloseTimeoutRef.current = setTimeout(() => {
      handleClose();
    }, 3000);
  };

  // Handle close - just close without committing anything
  const handleClose = useCallback(() => {
    clearAutoCloseTimeout();
    setBuildState('building');
    setDragOverSlot(null);
    setLocalSlotFills({});
    onClose();
  }, [clearAutoCloseTimeout, onClose]);

  // Only render nothing if we don't have basic info
  if (!initialPrototype || !recipe || !outputInfo) return null;

  // Safety check - this popup only works for slots mode prototypes
  if (initialPrototype.mode !== 'slots') {
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
              {t('research.prototypeComplete')}
            </Typography>
            {outputInfo.material?.category === 'equipment' ? (
              <StructureSpriteIcon
                structureId={outputInfo.outputId}
                materialId={outputInfo.outputId}
                materialName={outputInfo.material?.name}
                category={outputInfo.material?.category}
                size={64}
              />
            ) : (
              <MaterialIcon materialId={outputInfo.outputId} size={64} />
            )}
            <Typography variant="h6">
              {getMaterialName(outputInfo.outputId, outputInfo.material?.name || initialPrototype.recipeId)}
            </Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              {t('research.recipeUnlocked')}
              <br />
              {t('research.assignToMachines')}
            </Typography>
            <Button
              variant="contained"
              color="success"
              onClick={handleClose}
              sx={{ mt: 2 }}
            >
              {t('research.continue')}
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
            {t('research.buildPrototype')}: {getMaterialName(outputInfo.outputId, outputInfo.material?.name)}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Material Preview */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          {outputInfo.material?.category === 'equipment' ? (
            <StructureSpriteIcon
              structureId={outputInfo.outputId}
              materialId={outputInfo.outputId}
              materialName={outputInfo.material?.name}
              category={outputInfo.material?.category}
              size={64}
            />
          ) : (
            <MaterialIcon materialId={outputInfo.outputId} size={64} />
          )}
        </Box>

        {/* Name and Age */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            {getMaterialName(outputInfo.outputId, outputInfo.material?.name || initialPrototype.recipeId)}
          </Typography>
          <Chip
            label={t('market.age') + ` ${outputInfo.material?.age || '?'}`}
            sx={{
              bgcolor: AGE_COLORS[outputInfo.material?.age] || '#666',
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        </Box>

        {/* Description Placeholder */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          {materialDescription || t('research.descriptionComingSoon', 'Description coming soon...')}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {/* Overall Progress */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">{t('research.overallProgress', 'Overall Progress')}</Typography>
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
          {t('game.factory.componentSlots', 'Required Components')}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {t('game.factory.dragMaterialsHint', 'Drag materials from below to fill each slot. Click a slot to remove one unit.')}
          {hasRawSlots && (
            <Box component="span" sx={{ display: 'block', mt: 0.5, color: 'info.main' }}>
              <AutoModeIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
              {t('research.rawMaterialsAutoFill', 'Raw material slots auto-fill from production.')}
            </Box>
          )}
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
          {slotsWithFills.map((slot, index) => {
            const isFull = slot.effectiveFilled >= slot.quantity;
            const isPartial = slot.effectiveFilled > 0 && slot.effectiveFilled < slot.quantity;
            const isDragOver = dragOverSlot === index && !slot.isRaw;
            const material = rules.materials?.find(m => m.id === slot.material);
            const progress = (slot.effectiveFilled / slot.quantity) * 100;
            const hasLocalFill = slot.localFill > 0;
            const isRawSlot = slot.isRaw;

            return (
              <Box
                key={index}
                onDragOver={isRawSlot ? undefined : (e) => handleSlotDragOver(e, index)}
                onDragLeave={isRawSlot ? undefined : handleSlotDragLeave}
                onDrop={isRawSlot ? undefined : (e) => handleSlotDrop(e, index)}
                onClick={isRawSlot ? undefined : () => handleSlotClick(index)}
                sx={{
                  width: SLOT_SIZE,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 1,
                  position: 'relative',
                  border: '2px solid',
                  borderColor: isFull
                    ? 'success.main'
                    : isPartial
                      ? 'warning.main'
                      : isDragOver
                        ? 'primary.main'
                        : isRawSlot
                          ? 'info.main'
                          : 'divider',
                  borderRadius: 1,
                  backgroundColor: isFull
                    ? 'success.light'
                    : isPartial
                      ? 'warning.light'
                      : isDragOver
                        ? 'primary.light'
                        : isRawSlot
                          ? 'info.light'
                          : 'background.paper',
                  transition: 'all 0.2s ease',
                  cursor: isRawSlot ? 'default' : hasLocalFill ? 'pointer' : 'default',
                  opacity: isRawSlot && !isFull ? 0.8 : 1,
                  '&:hover': !isRawSlot && hasLocalFill ? {
                    borderColor: 'error.main',
                  } : {},
                }}
                title={isRawSlot ? 'Auto-fills from production' : hasLocalFill ? 'Click to remove one unit' : ''}
              >
                {/* Auto-fill indicator for raw slots */}
                {isRawSlot && (
                  <AutoModeIcon
                    sx={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      fontSize: 14,
                      color: isFull ? 'success.main' : 'info.main',
                    }}
                  />
                )}
                <Box sx={{ opacity: isFull ? 1 : isPartial ? 0.7 : 0.3, position: 'relative' }}>
                  <MaterialIcon
                    materialId={slot.material}
                    materialName={getMaterialName(slot.material, material?.name)}
                    category={material?.category}
                    size={40}
                    showTooltip={false}
                  />
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 'bold',
                    color: isFull ? 'success.dark' : isPartial ? 'warning.dark' : isRawSlot ? 'info.dark' : 'text.secondary',
                    mt: 0.5,
                  }}
                >
                  {slot.effectiveFilled}/{slot.quantity}
                </Typography>

                {slot.quantity > 1 && (
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    color={isFull ? 'success' : isPartial ? 'warning' : isRawSlot ? 'info' : 'primary'}
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
                    color: isFull ? 'success.dark' : isRawSlot ? 'info.dark' : 'text.secondary',
                    maxWidth: SLOT_SIZE - 8,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    wordBreak: 'break-word',
                  }}
                >
                  {getMaterialName(slot.material, material?.name)}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Available Materials Section */}
        <Typography variant="subtitle2" gutterBottom>
          {t('game.factory.availableMaterials', 'Available Materials')}
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
                  materialName={getMaterialName(material.id, material.name)}
                  category={material.category}
                  size={44}
                  showTooltip
                />
                <Typography variant="caption" sx={{ fontWeight: 500, mt: 0.5, textAlign: 'center' }}>
                  {getMaterialName(material.id, material.name)}
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
                  ({material.available} {t('research.available', 'available')})
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Warning if not enough materials (only for non-raw materials) */}
        {uniqueMaterials.some(m => m.available < m.remaining) && (
          <Typography
            variant="body2"
            color="error"
            sx={{ mt: 2, textAlign: 'center' }}
          >
            {t('game.factory.notEnoughMaterials', 'Not enough parts in inventory to complete this prototype')}
          </Typography>
        )}

        {/* Info message if waiting for raw materials */}
        {hasRawSlots && !slotsWithFills.filter(s => s.isRaw).every(s => s.effectiveFilled >= s.quantity) && (
          <Typography
            variant="body2"
            color="info.main"
            sx={{ mt: 2, textAlign: 'center' }}
          >
            {t('research.waitingForRawMaterials', 'Waiting for raw materials to auto-fill from production...')}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit">
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button
          onClick={handleBuild}
          variant="contained"
          color="primary"
          disabled={!allSlotsFilled}
          startIcon={<BuildIcon />}
        >
          {t('research.buildPrototype', 'Build Prototype')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
