import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import BoltIcon from '@mui/icons-material/Bolt';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MaterialIcon from '../common/MaterialIcon';

export default function MachineInfoPopup({
  machine,
  position,
  rules,
  onToggleEnabled,
  onOpenRecipeSelector,
  onClose
}) {
  const { t } = useTranslation();

  if (!machine || !position) return null;

  const energyCost = rules?.machines?.baseEnergy || 2;
  const machineName = t('game.factory.productionMachine', 'Production Machine');
  const currentRecipe = machine.recipeId
    ? rules?.recipes?.find(r => r.id === machine.recipeId)
    : null;
  const recipeName = machine.recipeId
    ? machine.recipeId.replace(/_/g, ' ')
    : t('game.factory.noRecipeAssigned', 'No recipe assigned');

  // Helper to render material items with icons
  const renderMaterialItems = (items, iconSize = 28) => {
    if (!items) return null;
    return Object.entries(items).map(([itemId, qty]) => {
      const material = rules?.materials?.find(m => m.id === itemId);
      return (
        <Box
          key={itemId}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.25,
          }}
        >
          <MaterialIcon
            materialId={itemId}
            materialName={material?.name}
            category={material?.category}
            size={iconSize}
            showTooltip
          />
          <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
            x{qty}
          </Typography>
        </Box>
      );
    });
  };

  const handleToggle = () => {
    onToggleEnabled?.(machine.id);
  };

  const handleRecipeClick = () => {
    onOpenRecipeSelector?.(machine);
  };

  // Status indicator color
  const getStatusColor = () => {
    if (!machine.enabled) return 'text.disabled';
    switch (machine.status) {
      case 'working': return 'success.main';
      case 'blocked': return 'error.main';
      default: return 'text.secondary';
    }
  };

  const getStatusText = () => {
    if (!machine.enabled) return t('game.factory.statusDisabled', 'Disabled');
    switch (machine.status) {
      case 'working': return t('game.factory.statusWorking', 'Working');
      case 'blocked': return t('game.factory.statusBlocked', 'Blocked');
      default: return t('game.factory.statusIdle', 'Idle');
    }
  };

  return (
    <Popover
      open={true}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={{ top: position.top, left: position.left }}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
    >
      <Box sx={{ p: 2, minWidth: 240 }}>
        {/* Machine Name and Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon sx={{ color: 'primary.main' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              {machineName}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: getStatusColor() }}>
            {getStatusText()}
          </Typography>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Energy Consumption */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <BoltIcon sx={{ fontSize: 18, color: 'warning.main' }} />
          <Typography variant="body2" color="text.secondary">
            {t('game.factory.energyConsumption', 'Energy:')}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            -{energyCost} {t('game.factory.perTick', '/ tick')}
          </Typography>
        </Box>

        {/* Enable/Disable Toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={machine.enabled}
              onChange={handleToggle}
              color="primary"
              size="small"
            />
          }
          label={
            <Typography variant="body2">
              {machine.enabled
                ? t('game.factory.machineEnabled', 'Enabled')
                : t('game.factory.machineDisabled', 'Disabled')}
            </Typography>
          }
          sx={{ mb: 2, ml: 0 }}
        />

        <Divider sx={{ my: 1 }} />

        {/* Recipe Selection */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          {t('game.factory.currentRecipeLabel', 'Current Recipe:')}
        </Typography>

        {/* Recipe I/O visual display */}
        {currentRecipe && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              mb: 1.5,
              p: 1.5,
              backgroundColor: 'action.hover',
              borderRadius: 1,
            }}
          >
            <Box sx={{ display: 'flex', gap: 1 }}>
              {renderMaterialItems(currentRecipe.inputs)}
            </Box>
            <ArrowForwardIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              {renderMaterialItems(currentRecipe.outputs)}
            </Box>
          </Box>
        )}

        <Button
          variant="outlined"
          fullWidth
          onClick={handleRecipeClick}
          sx={{
            justifyContent: 'flex-start',
            textTransform: 'capitalize',
            py: 1
          }}
        >
          {recipeName}
        </Button>
      </Box>
    </Popover>
  );
}
