import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import BoltIcon from '@mui/icons-material/Bolt';
import BuildIcon from '@mui/icons-material/Build';
import BuildPopup from './BuildPopup';

export default function PlaceableMachinesPanel({
  inventory,
  builtMachines,
  rules,
  unlockedRecipes = [],
  onDragStart,
  onDragEnd,
  onBuildMachine,
}) {
  const { t } = useTranslation();
  const [buildPopupOpen, setBuildPopupOpen] = useState(false);
  const [selectedMachineType, setSelectedMachineType] = useState(null);

  // Get all machine types that have built machines ready to deploy
  const availableMachines = rules.machines
    .map(machineType => ({
      ...machineType,
      count: builtMachines?.[machineType.id] || 0
    }))
    .filter(machine => machine.count > 0);

  // Get all machine types that can be built (have recipes AND unlocked)
  const buildableMachines = rules.machines
    .filter(machineType => rules.machineRecipes?.[machineType.id] && unlockedRecipes.includes(machineType.id))
    .map(machineType => ({
      ...machineType,
      recipe: rules.machineRecipes[machineType.id],
    }));

  const handleDragStart = (e, machine) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      itemType: 'machine',
      itemId: machine.itemId,
      machineType: machine.id,
      sizeX: machine.sizeX,
      sizeY: machine.sizeY
    }));
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.('machine', machine.itemId, machine.id, machine.sizeX, machine.sizeY);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  const handleOpenBuildPopup = (machineType) => {
    setSelectedMachineType(machineType);
    setBuildPopupOpen(true);
  };

  const handleCloseBuildPopup = () => {
    setBuildPopupOpen(false);
    setSelectedMachineType(null);
  };

  const handleBuild = (machineType) => {
    if (onBuildMachine) {
      onBuildMachine(machineType);
    }
  };

  // Fixed preview size for all machines (equivalent to 2x2 building)
  const PREVIEW_SIZE = 48;

  const selectedMachineConfig = selectedMachineType
    ? rules.machines.find(m => m.id === selectedMachineType)
    : null;
  const selectedBuildRecipe = selectedMachineType
    ? rules.machineRecipes?.[selectedMachineType]
    : null;

  return (
    <>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            {t('game.factory.machines')}
          </Typography>

          {/* Built machines ready to deploy */}
          {availableMachines.length > 0 && (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                {t('game.factory.readyToDeploy', 'Ready to Deploy')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                {availableMachines.map((machine) => {
                  return (
                    <Box
                      key={machine.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, machine)}
                      onDragEnd={handleDragEnd}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        cursor: 'grab',
                        backgroundColor: 'background.paper',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          borderColor: 'primary.main'
                        },
                        '&:active': {
                          cursor: 'grabbing'
                        }
                      }}
                    >
                      {/* Machine preview - actual machine image at fixed size */}
                      <Box
                        component="img"
                        src={`/assets/factory/${machine.id}_idle.png`}
                        alt={machine.name}
                        sx={{
                          width: PREVIEW_SIZE,
                          height: PREVIEW_SIZE,
                          objectFit: 'contain',
                          flexShrink: 0,
                          imageRendering: 'pixelated'
                        }}
                        onError={(e) => {
                          // Fallback to a colored box if image fails to load
                          e.target.style.display = 'none';
                        }}
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" noWrap>
                          {machine.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <BoltIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                          <Typography variant="caption" color="text.secondary">
                            -{machine.energyConsumption}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={`x${machine.count}`}
                        size="small"
                        color="primary"
                      />
                    </Box>
                  );
                })}
              </Box>
            </>
          )}

          {availableMachines.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('game.factory.noMachinesBuilt', 'No machines built yet')}
            </Typography>
          )}

          {/* Build new machines section */}
          {buildableMachines.length > 0 && (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, mt: 1 }}>
                {t('game.factory.buildNewMachine', 'Build New Machine')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {buildableMachines.map((machine) => {
                  return (
                    <Button
                      key={machine.id}
                      variant="outlined"
                      size="small"
                      startIcon={<BuildIcon sx={{ fontSize: 16 }} />}
                      onClick={() => handleOpenBuildPopup(machine.id)}
                      sx={{
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        py: 0.5,
                        px: 1,
                      }}
                    >
                      <Box
                        component="img"
                        src={`/assets/factory/${machine.id}_idle.png`}
                        alt={machine.name}
                        sx={{
                          width: 24,
                          height: 24,
                          objectFit: 'contain',
                          imageRendering: 'pixelated',
                          mr: 1,
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      {machine.name}
                    </Button>
                  );
                })}
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Build Popup */}
      <BuildPopup
        open={buildPopupOpen}
        onClose={handleCloseBuildPopup}
        type="machine"
        itemType={selectedMachineType}
        itemConfig={selectedMachineConfig}
        buildRecipe={selectedBuildRecipe}
        inventory={inventory}
        rules={rules}
        onBuild={handleBuild}
      />
    </>
  );
}
