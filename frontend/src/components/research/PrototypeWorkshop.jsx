import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LoopIcon from '@mui/icons-material/Loop';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import useGameStore from '../../stores/gameStore';
import MaterialIcon from '../common/MaterialIcon';

function FlowPrototype({ prototype, recipe, rules }) {
  // Flow mode - progress fills automatically from extraction
  const requiredAmounts = prototype.requiredAmounts;
  const progress = prototype.prototypeProgress;

  // Calculate overall progress
  const totalRequired = Object.values(requiredAmounts).reduce((a, b) => a + b, 0);
  const totalProgress = Object.values(progress).reduce((a, b) => a + b, 0);
  const percentComplete = Math.round((totalProgress / totalRequired) * 100);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <LoopIcon sx={{ color: 'info.main' }} />
        <Typography variant="caption" color="info.main">
          Flow Mode - Auto-fills from extraction
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2">Overall Progress</Typography>
          <Typography variant="body2">{percentComplete}%</Typography>
        </Box>
        <LinearProgress variant="determinate" value={percentComplete} sx={{ height: 8, borderRadius: 1 }} />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {Object.entries(requiredAmounts).map(([materialId, required]) => {
          const current = progress[materialId] || 0;
          const material = rules.materials.find(m => m.id === materialId);
          const percent = Math.round((current / required) * 100);

          return (
            <Box key={materialId} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MaterialIcon materialId={materialId} size={20} />
              <Typography variant="body2" sx={{ minWidth: 100 }}>
                {material?.name || materialId}
              </Typography>
              <Box sx={{ flex: 1 }}>
                <LinearProgress variant="determinate" value={percent} sx={{ height: 6, borderRadius: 1 }} />
              </Box>
              <Typography variant="caption" sx={{ minWidth: 60, textAlign: 'right' }}>
                {current}/{required}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function SlotsPrototype({ prototype, recipe, rules, inventory }) {
  const fillPrototypeSlot = useGameStore((state) => state.fillPrototypeSlot);
  const [fillAmounts, setFillAmounts] = useState({});

  const handleFillSlot = (materialId) => {
    const amount = parseInt(fillAmounts[materialId]) || 1;
    fillPrototypeSlot(prototype.recipeId, materialId, amount);
    setFillAmounts(prev => ({ ...prev, [materialId]: '' }));
  };

  // Calculate overall progress
  const totalRequired = prototype.slots.reduce((sum, slot) => sum + slot.quantity, 0);
  const totalFilled = prototype.slots.reduce((sum, slot) => sum + slot.filled, 0);
  const percentComplete = Math.round((totalFilled / totalRequired) * 100);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <TouchAppIcon sx={{ color: 'warning.main' }} />
        <Typography variant="caption" color="warning.main">
          Slots Mode - Fill from inventory
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2">Overall Progress</Typography>
          <Typography variant="body2">{percentComplete}%</Typography>
        </Box>
        <LinearProgress variant="determinate" value={percentComplete} color="warning" sx={{ height: 8, borderRadius: 1 }} />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {prototype.slots.map((slot, index) => {
          const material = rules.materials.find(m => m.id === slot.material);
          const percent = Math.round((slot.filled / slot.quantity) * 100);
          const available = inventory?.[slot.material] || 0;
          const isComplete = slot.filled >= slot.quantity;
          const fillAmount = fillAmounts[slot.material] || '';
          const neededForSlot = slot.quantity - slot.filled;

          return (
            <Paper key={index} variant="outlined" sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <MaterialIcon materialId={slot.material} size={24} />
                <Typography variant="body2" fontWeight="bold" sx={{ flex: 1 }}>
                  {material?.name || slot.material}
                </Typography>
                {isComplete ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    {slot.filled}/{slot.quantity}
                  </Typography>
                )}
              </Box>

              <LinearProgress
                variant="determinate"
                value={percent}
                color={isComplete ? 'success' : 'warning'}
                sx={{ height: 6, borderRadius: 1, mb: 1 }}
              />

              {!isComplete && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    In inventory: {available}
                  </Typography>
                  <Box sx={{ flex: 1 }} />
                  <TextField
                    type="number"
                    size="small"
                    value={fillAmount}
                    onChange={(e) => setFillAmounts(prev => ({ ...prev, [slot.material]: e.target.value }))}
                    placeholder="Qty"
                    inputProps={{ min: 1, max: Math.min(available, neededForSlot) }}
                    sx={{ width: 80 }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    disabled={available === 0}
                    onClick={() => handleFillSlot(slot.material)}
                  >
                    Fill
                  </Button>
                </Box>
              )}
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}

export default function PrototypeWorkshop({ awaitingPrototype, rules, inventory }) {
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {awaitingPrototype.map((prototype, index) => {
        const recipe = rules.recipes.find(r => r.id === prototype.recipeId);
        if (!recipe) return null;

        // Get recipe output info
        const outputInfo = Object.entries(recipe.outputs).map(([outputId, qty]) => {
          const material = rules.materials.find(m => m.id === outputId);
          return { outputId, qty, material };
        })[0]; // Take first output as primary

        return (
          <Paper key={prototype.recipeId} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <MaterialIcon materialId={outputInfo?.outputId} size={40} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6">
                  {outputInfo?.material?.name || prototype.recipeId}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={`Age ${outputInfo?.material?.age || '?'}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={prototype.mode === 'flow' ? 'Flow' : 'Slots'}
                    size="small"
                    color={prototype.mode === 'flow' ? 'info' : 'warning'}
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {prototype.mode === 'flow' ? (
              <FlowPrototype prototype={prototype} recipe={recipe} rules={rules} />
            ) : (
              <SlotsPrototype
                prototype={prototype}
                recipe={recipe}
                rules={rules}
                inventory={inventory}
              />
            )}
          </Paper>
        );
      })}
    </Box>
  );
}
