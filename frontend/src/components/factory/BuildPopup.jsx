import { useState, useMemo } from 'react';
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
import CloseIcon from '@mui/icons-material/Close';
import BuildIcon from '@mui/icons-material/Build';
import MaterialIcon from '../common/MaterialIcon';

/**
 * BuildPopup Component
 *
 * A dialog for manually building machines or generators by filling component slots
 * with materials from the inventory.
 *
 * Slots can have an optional `quantity` property (defaults to 1) that specifies
 * how many units of the material are required to fill that slot.
 */
export default function BuildPopup({
  open,
  onClose,
  type, // 'machine' or 'generator'
  itemType, // e.g., 'stone_furnace' or 'treadwheel'
  itemConfig, // The machine/generator config from rules
  buildRecipe, // The slot-based build recipe
  inventory,
  rules,
  onBuild,
}) {
  const { t } = useTranslation();

  // Track how many units have been filled in each slot
  // Key: slot index, Value: number of units filled (0 to slot.quantity)
  const [slotFills, setSlotFills] = useState({});

  // Track which slot is being dragged over
  const [dragOverSlot, setDragOverSlot] = useState(null);

  // Track if preview image failed to load
  const [imageError, setImageError] = useState(false);

  // Calculate materials needed and available
  const materialInfo = useMemo(() => {
    if (!buildRecipe?.slots) return { needed: {}, available: {}, canBuild: false };

    // Count how many of each material is needed (considering quantity per slot)
    const needed = {};
    for (const slot of buildRecipe.slots) {
      const qty = slot.quantity || 1;
      needed[slot.material] = (needed[slot.material] || 0) + qty;
    }

    // Get available amounts from inventory
    const available = {};
    for (const materialId of Object.keys(needed)) {
      available[materialId] = inventory[materialId] || 0;
    }

    // Check if we can build (have enough of everything)
    let canBuild = true;
    for (const [materialId, neededCount] of Object.entries(needed)) {
      if ((available[materialId] || 0) < neededCount) {
        canBuild = false;
        break;
      }
    }

    return { needed, available, canBuild };
  }, [buildRecipe, inventory]);

  // Count filled units per material type
  const filledCounts = useMemo(() => {
    if (!buildRecipe?.slots) return {};
    const counts = {};
    for (const [slotIndex, filledQty] of Object.entries(slotFills)) {
      const slot = buildRecipe.slots[parseInt(slotIndex)];
      if (slot && filledQty > 0) {
        counts[slot.material] = (counts[slot.material] || 0) + filledQty;
      }
    }
    return counts;
  }, [slotFills, buildRecipe]);

  // Check if all slots are completely filled
  const allSlotsFilled = useMemo(() => {
    if (!buildRecipe?.slots) return false;
    return buildRecipe.slots.every((slot, index) => {
      const required = slot.quantity || 1;
      const filled = slotFills[index] || 0;
      return filled >= required;
    });
  }, [slotFills, buildRecipe]);

  // Get unique materials for the inventory section
  const uniqueMaterials = useMemo(() => {
    if (!buildRecipe?.slots) return [];
    const materialIds = [...new Set(buildRecipe.slots.map(s => s.material))];
    return materialIds.map(id => {
      const material = rules.materials?.find(m => m.id === id);
      const needed = materialInfo.needed[id] || 0;
      const filled = filledCounts[id] || 0;
      const remaining = needed - filled;
      const availableInInventory = inventory[id] || 0;
      return {
        id,
        name: material?.name || id,
        category: material?.category || 'default',
        needed,
        filled,
        remaining,
        available: availableInInventory,
        canDrag: availableInInventory > filled && remaining > 0,
      };
    });
  }, [buildRecipe, rules, inventory, materialInfo, filledCounts]);

  // Handle drag start from inventory material
  const handleMaterialDragStart = (e, materialId) => {
    e.dataTransfer.setData('text/plain', materialId);
    e.dataTransfer.effectAllowed = 'move';

    // Create a custom drag image showing only the icon
    const dragImage = e.currentTarget.querySelector('img');
    if (dragImage) {
      e.dataTransfer.setDragImage(dragImage, 20, 20);
    }
  };

  // Handle drag over a slot
  const handleSlotDragOver = (e, slotIndex, slot) => {
    e.preventDefault();
    const required = slot.quantity || 1;
    const filled = slotFills[slotIndex] || 0;
    const draggedMaterial = e.dataTransfer.types.includes('text/plain');
    if (draggedMaterial && filled < required) {
      setDragOverSlot(slotIndex);
      e.dataTransfer.dropEffect = 'move';
    }
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
    const required = slot.quantity || 1;
    const currentFilled = slotFills[slotIndex] || 0;

    // Check if the dropped material matches the expected material
    if (droppedMaterial === slot.material && currentFilled < required) {
      // Check if we have enough of this material (accounting for already filled slots)
      const materialData = uniqueMaterials.find(m => m.id === droppedMaterial);
      if (materialData && materialData.canDrag) {
        // Calculate how many units we can add
        const neededForThisSlot = required - currentFilled;
        const availableToAdd = materialData.available - materialData.filled;
        const unitsToAdd = Math.min(neededForThisSlot, availableToAdd);

        if (unitsToAdd > 0) {
          setSlotFills(prev => ({
            ...prev,
            [slotIndex]: currentFilled + unitsToAdd
          }));
        }
      }
    }
  };

  // Handle clicking a slot to remove one unit
  const handleSlotClick = (slotIndex) => {
    const currentFilled = slotFills[slotIndex] || 0;
    if (currentFilled > 0) {
      setSlotFills(prev => {
        const newFilled = currentFilled - 1;
        if (newFilled === 0) {
          const next = { ...prev };
          delete next[slotIndex];
          return next;
        }
        return { ...prev, [slotIndex]: newFilled };
      });
    }
  };

  // Handle build button click
  const handleBuild = () => {
    if (allSlotsFilled && onBuild) {
      onBuild(itemType);
      handleClose();
    }
  };

  // Handle close and reset state
  const handleClose = () => {
    setSlotFills({});
    setDragOverSlot(null);
    setImageError(false);
    onClose();
  };

  if (!buildRecipe?.slots || !itemConfig) return null;

  const SLOT_SIZE = 72;
  const MATERIAL_ICON_SIZE = 36;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: 400 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BuildIcon color="primary" />
          <Typography variant="h6">
            {t('game.factory.buildTitle', 'Build {{name}}', { name: itemConfig.name })}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Machine/Generator Preview */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          {!imageError ? (
            <Box
              component="img"
              src={`/assets/factory/${itemType}_idle.png`}
              alt={itemConfig.name}
              sx={{
                width: 96,
                height: 96,
                objectFit: 'contain',
                imageRendering: 'pixelated',
              }}
              onError={(e) => {
                // Try without _idle suffix for generators
                if (type === 'generator' && !e.target.src.includes(`${itemType}.png`)) {
                  e.target.src = `/assets/factory/${itemType}.png`;
                } else {
                  setImageError(true);
                }
              }}
            />
          ) : (
            <Box
              sx={{
                width: 96,
                height: 96,
                backgroundColor: type === 'machine' ? '#4A90D9' : '#9C27B0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 48,
                fontWeight: 'bold',
                color: 'white',
                borderRadius: '4px',
                textShadow: '2px 2px 2px rgba(0,0,0,0.3)',
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              }}
            >
              {(itemConfig.name || itemType)[0].toUpperCase()}
            </Box>
          )}
        </Box>

        {/* Component Slots Section */}
        <Typography variant="subtitle2" gutterBottom>
          {t('game.factory.componentSlots', 'Component Slots')}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {t('game.factory.dragMaterialsHint', 'Drag materials from below to fill each slot')}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            p: 1.5,
            backgroundColor: 'action.hover',
            borderRadius: 1,
            mb: 2,
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {buildRecipe.slots.map((slot, index) => {
            const required = slot.quantity || 1;
            const filled = slotFills[index] || 0;
            const isFull = filled >= required;
            const isPartial = filled > 0 && filled < required;
            const isDragOver = dragOverSlot === index;
            const material = rules.materials?.find(m => m.id === slot.material);
            const progress = (filled / required) * 100;

            return (
              <Box
                key={index}
                onDragOver={(e) => handleSlotDragOver(e, index, slot)}
                onDragLeave={handleSlotDragLeave}
                onDrop={(e) => handleSlotDrop(e, index, slot)}
                onClick={() => handleSlotClick(index)}
                sx={{
                  width: SLOT_SIZE,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 0.75,
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
                  cursor: filled > 0 ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  '&:hover': filled > 0 ? {
                    borderColor: 'error.main',
                  } : {},
                }}
                title={filled > 0 ? t('game.factory.clickToRemove', 'Click to remove') : slot.label}
              >
                <Box sx={{ opacity: isFull ? 1 : isPartial ? 0.7 : 0.3, position: 'relative' }}>
                  <MaterialIcon
                    materialId={slot.material}
                    materialName={material?.name}
                    category={material?.category}
                    size={MATERIAL_ICON_SIZE}
                    showTooltip={false}
                  />
                </Box>

                {/* Quantity indicator */}
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 'bold',
                    color: isFull ? 'success.dark' : isPartial ? 'warning.dark' : 'text.secondary',
                    mt: 0.25,
                  }}
                >
                  {filled}/{required}
                </Typography>

                {/* Progress bar for multi-quantity slots */}
                {required > 1 && (
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
                  {slot.label}
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
            p: 1.5,
            backgroundColor: 'background.default',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {uniqueMaterials.map((material) => {
            const hasEnough = material.available >= material.needed;
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
                  minWidth: 80,
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
                  size={40}
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
                  ({material.available} {t('game.factory.inInventory', 'in inv.')})
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Warning if not enough materials */}
        {!materialInfo.canBuild && (
          <Typography
            variant="body2"
            color="error"
            sx={{ mt: 2, textAlign: 'center' }}
          >
            {t('game.factory.notEnoughMaterials', 'Not enough materials in inventory to build this')}
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
          {t('game.factory.build', 'Build')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
