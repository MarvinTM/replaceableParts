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
import { getMaterialName } from '../../utils/translationHelpers';

export default function PlaceableGeneratorsPanel({
  inventory,
  builtGenerators,
  rules,
  unlockedRecipes = [],
  onDragStart,
  onDragEnd,
  onBuildGenerator,
}) {
  const { t } = useTranslation();
  const [buildPopupOpen, setBuildPopupOpen] = useState(false);
  const [selectedGeneratorType, setSelectedGeneratorType] = useState(null);

  // Get all generator types that have built generators ready to deploy
  const availableGenerators = rules.generators
    .map(genType => ({
      ...genType,
      count: builtGenerators?.[genType.id] || 0
    }))
    .filter(gen => gen.count > 0);

  // Get all generator types that can be built (have recipes AND unlocked AND not disabled)
  const buildableGenerators = rules.generators
    .filter(genType => !genType.disabled && rules.generatorRecipes?.[genType.id] && unlockedRecipes.includes(genType.id))
    .map(genType => ({
      ...genType,
      recipe: rules.generatorRecipes[genType.id],
    }));

  const handleDragStart = (e, generator) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      itemType: 'generator',
      itemId: generator.itemId,
      generatorType: generator.id,
      sizeX: generator.sizeX,
      sizeY: generator.sizeY
    }));
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.('generator', generator.itemId, generator.id, generator.sizeX, generator.sizeY);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  const handleOpenBuildPopup = (generatorType) => {
    setSelectedGeneratorType(generatorType);
    setBuildPopupOpen(true);
  };

  const handleCloseBuildPopup = () => {
    setBuildPopupOpen(false);
    setSelectedGeneratorType(null);
  };

  const handleBuild = (generatorType, quantity = 1) => {
    if (onBuildGenerator) {
      onBuildGenerator(generatorType, quantity);
    }
  };

  // Fixed preview size for all generators (equivalent to 2x2 building)
  const PREVIEW_SIZE = 48;

  const selectedGeneratorConfig = selectedGeneratorType
    ? rules.generators.find(g => g.id === selectedGeneratorType)
    : null;
  const selectedBuildRecipe = selectedGeneratorType
    ? rules.generatorRecipes?.[selectedGeneratorType]
    : null;

  return (
    <>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            {t('game.factory.generators')}
          </Typography>

          {/* Built generators ready to deploy */}
          {availableGenerators.length > 0 && (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                {t('game.factory.readyToDeploy', 'Ready to Deploy')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                {availableGenerators.map((generator) => {
                  return (
                    <Box
                      key={generator.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, generator)}
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
                          borderColor: 'warning.main'
                        },
                        '&:active': {
                          cursor: 'grabbing'
                        }
                      }}
                    >
                      {/* Generator preview - actual generator image at fixed size */}
                      <Box
                        component="img"
                        src={`/assets/factory/${generator.id}.png`}
                        alt={getMaterialName(generator.id, generator.name)}
                        sx={{
                          width: PREVIEW_SIZE,
                          height: PREVIEW_SIZE,
                          objectFit: 'contain',
                          flexShrink: 0,
                          imageRendering: 'pixelated'
                        }}
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.target.style.display = 'none';
                        }}
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" noWrap>
                          {getMaterialName(generator.id, generator.name)}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <BoltIcon sx={{ fontSize: 14, color: 'success.main' }} />
                          <Typography variant="caption" color="success.main">
                            +{generator.energyOutput}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={`x${generator.count}`}
                        size="small"
                        color="warning"
                      />
                    </Box>
                  );
                })}
              </Box>
            </>
          )}

          {availableGenerators.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('game.factory.noGeneratorsBuilt', 'No generators built yet')}
            </Typography>
          )}

          {/* Build new generators section */}
          {buildableGenerators.length > 0 && (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, mt: 1 }}>
                {t('game.factory.buildNewGenerator', 'Build New Generator')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {buildableGenerators.map((generator) => {
                  return (
                    <Button
                      key={generator.id}
                      variant="outlined"
                      size="small"
                      color="warning"
                      startIcon={<BuildIcon sx={{ fontSize: 16 }} />}
                      onClick={() => handleOpenBuildPopup(generator.id)}
                      sx={{
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        py: 0.5,
                        px: 1,
                      }}
                    >
                      <Box
                        component="img"
                        src={`/assets/factory/${generator.id}.png`}
                        alt={getMaterialName(generator.id, generator.name)}
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
                      {getMaterialName(generator.id, generator.name)}
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
        type="generator"
        itemType={selectedGeneratorType}
        itemConfig={selectedGeneratorConfig}
        buildRecipe={selectedBuildRecipe}
        inventory={inventory}
        rules={rules}
        onBuild={handleBuild}
      />
    </>
  );
}
