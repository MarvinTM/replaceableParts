import { useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FactoryIcon from '@mui/icons-material/Factory';
import ExploreIcon from '@mui/icons-material/Explore';
import ScienceIcon from '@mui/icons-material/Science';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import BoltIcon from '@mui/icons-material/Bolt';
import InventoryIcon from '@mui/icons-material/Inventory';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import TerrainIcon from '@mui/icons-material/Terrain';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import GridViewIcon from '@mui/icons-material/GridView';
import InfoIcon from '@mui/icons-material/Info';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useGame } from '../contexts/GameContext';
import useGameStore from '../stores/gameStore';
import { getNextExpansionChunk } from '../engine/engine.js';
import FactoryCanvas from '../components/factory/FactoryCanvas';
import ExplorationCanvas from '../components/exploration/ExplorationCanvas';
import RecipeDropdown from '../components/factory/RecipeDropdown';
import MachineInfoPopup from '../components/factory/MachineInfoPopup';
import MaterialIcon from '../components/common/MaterialIcon';
import FloatingHUD from '../components/common/FloatingHUD';
import CollapsibleSidebar from '../components/common/CollapsibleSidebar';
import CollapsibleActionsPanel from '../components/common/CollapsibleActionsPanel';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`game-tabpanel-${index}`}
      aria-labelledby={`game-tab-${index}`}
      style={{ flex: 1, display: value === index ? 'flex' : 'none', flexDirection: 'column', minHeight: 0 }}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

function FactoryTab() {
  const { t } = useTranslation();
  const engineState = useGameStore((state) => state.engineState);
  const rules = useGameStore((state) => state.rules);
  const machineAnimationMode = useGameStore((state) => state.machineAnimationMode);
  const buyFloorSpace = useGameStore((state) => state.buyFloorSpace);
  const addMachine = useGameStore((state) => state.addMachine);
  const addGenerator = useGameStore((state) => state.addGenerator);
  const removeMachine = useGameStore((state) => state.removeMachine);
  const removeGenerator = useGameStore((state) => state.removeGenerator);
  const assignRecipe = useGameStore((state) => state.assignRecipe);
  const toggleMachine = useGameStore((state) => state.toggleMachine);
  const moveMachine = useGameStore((state) => state.moveMachine);
  const moveGenerator = useGameStore((state) => state.moveGenerator);

  // Drag state for placing machines/generators or moving existing ones
  const [dragState, setDragState] = useState({
    isDragging: false,
    itemType: null,
    itemId: null,
    typeId: null, // The machine/generator type ID for sprite lookup
    sizeX: 0,
    sizeY: 0,
    movingStructureId: null // If set, we're moving an existing structure (machine or generator)
  });

  // Selected machine ID for machine info popup (store ID, not object, to get fresh state)
  const [selectedMachineId, setSelectedMachineId] = useState(null);
  const [machinePopupPosition, setMachinePopupPosition] = useState(null);

  // State for recipe selector (opened from machine info popup)
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);

  // Ref for inventory panel (used for fly-to-inventory animations)
  const inventoryPanelRef = useRef(null);

  if (!engineState) return null;

  const { machines, generators, floorSpace, inventory, credits, rngSeed, unlockedRecipes } = engineState;

  // Get current machine state from engineState (ensures fresh data after toggle)
  const selectedMachine = selectedMachineId
    ? machines.find(m => m.id === selectedMachineId)
    : null;

  // Calculate next expansion info
  const expansion = getNextExpansionChunk(engineState, rules);

  const handleExpand = () => {
    buyFloorSpace();
  };

  // Drag handlers for placing machines/generators
  const handleDragStart = (itemType, itemId, typeId, sizeX, sizeY) => {
    setDragState({ isDragging: true, itemType, itemId, typeId, sizeX, sizeY, movingStructureId: null });
  };

  const handleDragEnd = () => {
    setDragState({ isDragging: false, itemType: null, itemId: null, typeId: null, sizeX: 0, sizeY: 0, movingStructureId: null });
  };

  // Handle starting a drag on an existing structure (for repositioning)
  const handleStructureDragStart = (item, type, typeId, sizeX, sizeY) => {
    // Map internal type to drag itemType
    const itemType = type === 'machine' ? 'machine-move' : 'generator-move';
    const itemId = item.id;

    setDragState({
      isDragging: true,
      itemType,
      itemId,
      typeId,
      sizeX,
      sizeY,
      movingStructureId: item.id
    });
  };

  const handleDrop = (itemType, itemId, gridX, gridY, generatorType, machineType, screenPos) => {
    // Handle moving an existing machine
    if (itemType === 'machine-move') {
      const machineId = itemId; // In this case, itemId is the machine ID
      const result = moveMachine(machineId, gridX, gridY);
      if (result.error) {
        console.warn('Failed to move machine:', result.error);
      }
    } else if (itemType === 'generator-move') {
      const generatorId = itemId;
      const result = moveGenerator(generatorId, gridX, gridY);
      if (result.error) {
        console.warn('Failed to move generator:', result.error);
      }
    } else if (itemType === 'machine') {
      const result = addMachine(machineType, gridX, gridY);
      if (result.error) {
        console.warn('Failed to place machine:', result.error);
      } else if (result.state && screenPos) {
        // Machine was successfully placed - find the newly added machine and open recipe selector
        const newMachine = result.state.machines.find(
          m => m.x === gridX && m.y === gridY && m.type === machineType
        );
        if (newMachine) {
          setSelectedMachineId(newMachine.id);
          setMachinePopupPosition(screenPos);
          setShowRecipeSelector(true);
        }
      }
    } else if (itemType === 'generator') {
      const result = addGenerator(generatorType, gridX, gridY);
      if (result.error) {
        console.warn('Failed to place generator:', result.error);
      }
    }
    handleDragEnd();
  };

  // Machine click handler - opens machine info popup
  const handleMachineClick = (machine, screenPos) => {
    setSelectedMachineId(machine.id);
    setMachinePopupPosition(screenPos);
    setShowRecipeSelector(false);
  };

  // Close machine info popup
  const handleCloseMachinePopup = () => {
    setSelectedMachineId(null);
    setMachinePopupPosition(null);
    setShowRecipeSelector(false);
  };

  // Toggle machine enabled/disabled
  const handleToggleMachine = (machineId) => {
    toggleMachine(machineId);
  };

  // Open recipe selector from machine info popup
  const handleOpenRecipeSelector = () => {
    setShowRecipeSelector(true);
  };

  // Select a recipe (close everything after selection)
  const handleRecipeSelect = (machineId, recipeId) => {
    assignRecipe(machineId, recipeId);
    setSelectedMachineId(null);
    setMachinePopupPosition(null);
    setShowRecipeSelector(false);
  };

  // Close recipe selector (close everything)
  const handleCloseRecipeSelector = () => {
    setSelectedMachineId(null);
    setMachinePopupPosition(null);
    setShowRecipeSelector(false);
  };

  // Handle right-click on machine to remove it
  const handleMachineRightClick = (machine) => {
    const result = removeMachine(machine.id);
    if (result.error) {
      console.warn('Failed to remove machine:', result.error);
    }
    // Close popup if this machine was selected
    if (selectedMachineId === machine.id) {
      handleCloseMachinePopup();
    }
  };

  // Handle right-click on generator to remove it
  const handleGeneratorRightClick = (generator) => {
    const result = removeGenerator(generator.id);
    if (result.error) {
      console.warn('Failed to remove generator:', result.error);
    }
  };

  // Get available generators and machines for sidebar
  const availableGenerators = rules.generators
    .map(genType => ({ ...genType, count: inventory[genType.itemId] || 0 }))
    .filter(gen => gen.count > 0);

  const availableMachines = rules.machines
    .map(machineType => ({ ...machineType, count: inventory[machineType.itemId] || 0 }))
    .filter(machine => machine.count > 0);

  const PREVIEW_SIZE = 48;

  // Sidebar sections
  const sidebarSections = [
    {
      id: 'generators',
      title: t('game.factory.generators'),
      icon: <BoltIcon sx={{ color: 'success.main', fontSize: 20 }} />,
      badge: availableGenerators.length > 0 ? availableGenerators.reduce((sum, g) => sum + g.count, 0) : undefined,
      content: availableGenerators.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t('game.factory.noGeneratorsInInventory', 'No generators in inventory')}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {availableGenerators.map((generator) => (
            <Box
              key={generator.id}
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({
                  itemType: 'generator', itemId: generator.itemId, generatorType: generator.id,
                  sizeX: generator.sizeX, sizeY: generator.sizeY
                }));
                e.dataTransfer.effectAllowed = 'move';
                handleDragStart('generator', generator.itemId, generator.id, generator.sizeX, generator.sizeY);
              }}
              onDragEnd={handleDragEnd}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1, p: 1,
                border: '1px solid', borderColor: 'divider', borderRadius: 1,
                cursor: 'grab', backgroundColor: 'background.paper',
                '&:hover': { backgroundColor: 'action.hover', borderColor: 'warning.main' },
                '&:active': { cursor: 'grabbing' }
              }}
            >
              <Box component="img" src={`/assets/factory/${generator.id}.png`} alt={generator.name}
                sx={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE, objectFit: 'contain', flexShrink: 0, imageRendering: 'pixelated' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                <Typography variant="body2" noWrap>{generator.name}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <BoltIcon sx={{ fontSize: 14, color: 'success.main' }} />
                  <Typography variant="caption" color="success.main">+{generator.energyOutput}</Typography>
                </Box>
              </Box>
              <Chip label={`x${generator.count}`} size="small" color="warning" />
            </Box>
          ))}
        </Box>
      )
    },
    {
      id: 'machines',
      title: t('game.factory.machines'),
      icon: <PrecisionManufacturingIcon sx={{ color: 'primary.main', fontSize: 20 }} />,
      badge: availableMachines.length > 0 ? availableMachines.reduce((sum, m) => sum + m.count, 0) : undefined,
      content: availableMachines.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t('game.factory.noMachinesInInventory', 'No machines in inventory')}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {availableMachines.map((machine) => (
            <Box
              key={machine.id}
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({
                  itemType: 'machine', itemId: machine.itemId, machineType: machine.id,
                  sizeX: machine.sizeX, sizeY: machine.sizeY
                }));
                e.dataTransfer.effectAllowed = 'move';
                handleDragStart('machine', machine.itemId, machine.id, machine.sizeX, machine.sizeY);
              }}
              onDragEnd={handleDragEnd}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1, p: 1,
                border: '1px solid', borderColor: 'divider', borderRadius: 1,
                cursor: 'grab', backgroundColor: 'background.paper',
                '&:hover': { backgroundColor: 'action.hover', borderColor: 'primary.main' },
                '&:active': { cursor: 'grabbing' }
              }}
            >
              <Box component="img" src={`/assets/factory/${machine.id}_idle.png`} alt={machine.name}
                sx={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE, objectFit: 'contain', flexShrink: 0, imageRendering: 'pixelated' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                <Typography variant="body2" noWrap>{machine.name}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <BoltIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                  <Typography variant="caption" color="text.secondary">-{machine.energyConsumption}</Typography>
                </Box>
              </Box>
              <Chip label={`x${machine.count}`} size="small" color="primary" />
            </Box>
          ))}
        </Box>
      )
    },
    {
      id: 'inventory',
      title: t('game.factory.inventory'),
      icon: <InventoryIcon sx={{ color: 'info.main', fontSize: 20 }} />,
      badge: Object.values(inventory).reduce((a, b) => a + b, 0) || undefined,
      content: (
        <Box ref={inventoryPanelRef}>
          {Object.keys(inventory).length === 0 ? (
            <Typography variant="body2" color="text.secondary">{t('game.factory.emptyInventory')}</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {Object.entries(inventory).map(([itemId, quantity]) => {
                const material = rules.materials.find(m => m.id === itemId);
                return (
                  <Chip
                    key={itemId}
                    icon={<MaterialIcon materialId={itemId} materialName={material?.name} category={material?.category} size={16} />}
                    label={`${material?.name || itemId}: ${quantity}`}
                    variant="outlined"
                    size="small"
                  />
                );
              })}
            </Box>
          )}
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Main content area with canvas and sidebar */}
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Canvas container */}
        <Box sx={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <FloatingHUD credits={credits} energy={engineState.energy} />
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, py: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {t('game.factory.gridSize', { width: floorSpace.width, height: floorSpace.height })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('game.factory.zoomHint')}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <FactoryCanvas
                key={rngSeed}
                floorSpace={floorSpace}
                machines={machines}
                generators={generators}
                rules={rules}
                dragState={dragState}
                onDrop={handleDrop}
                onMachineClick={handleMachineClick}
                onStructureDragStart={handleStructureDragStart}
                onMachineRightClick={handleMachineRightClick}
                onGeneratorRightClick={handleGeneratorRightClick}
                engineState={engineState}
                machineAnimationMode={machineAnimationMode}
                inventoryPanelRef={inventoryPanelRef}
              />
            </Box>
          </Box>
        </Box>

        {/* Right Sidebar */}
        <CollapsibleSidebar sections={sidebarSections} defaultExpanded="generators" />
      </Box>

      {/* Bottom Actions Panel */}
      <CollapsibleActionsPanel title={t('game.factory.actions')}>
        <Button
          variant="contained"
          size="small"
          startIcon={<GridViewIcon />}
          onClick={handleExpand}
          disabled={credits < expansion.cost}
        >
          {t('game.factory.expand')} ({expansion.cost})
        </Button>
        <Typography variant="caption" color="text.secondary">
          {t('game.factory.expandInfo', { width: expansion.newWidth, height: expansion.newHeight })} ({t('game.factory.cellsAdded', { count: expansion.cellsAdded })})
        </Typography>
      </CollapsibleActionsPanel>

      {/* Machine Info Popup */}
      {selectedMachine && machinePopupPosition && !showRecipeSelector && (
        <MachineInfoPopup
          machine={selectedMachine}
          position={machinePopupPosition}
          rules={rules}
          onToggleEnabled={handleToggleMachine}
          onOpenRecipeSelector={handleOpenRecipeSelector}
          onClose={handleCloseMachinePopup}
        />
      )}

      {/* Recipe Dropdown (opened from machine info popup) */}
      {selectedMachine && machinePopupPosition && showRecipeSelector && (
        <RecipeDropdown
          machine={selectedMachine}
          position={machinePopupPosition}
          unlockedRecipes={unlockedRecipes}
          rules={rules}
          onSelectRecipe={handleRecipeSelect}
          onClose={handleCloseRecipeSelector}
        />
      )}
    </Box>
  );
}

function ExplorationTab() {
  const { t } = useTranslation();
  const engineState = useGameStore((state) => state.engineState);
  const rules = useGameStore((state) => state.rules);
  const expandExploration = useGameStore((state) => state.expandExploration);
  const unlockExplorationNode = useGameStore((state) => state.unlockExplorationNode);

  const [selectedTile, setSelectedTile] = useState(null);
  const [expandedSection, setExpandedSection] = useState('stats');

  if (!engineState?.explorationMap) return null;

  const { explorationMap, credits } = engineState;
  const { exploredBounds, tiles } = explorationMap;

  // Count stats
  const exploredCount = Object.values(tiles).filter(t => t.explored).length;
  const totalNodes = Object.values(tiles).filter(t => t.explored && t.extractionNode).length;
  const unlockedNodes = Object.values(tiles).filter(t => t.explored && t.extractionNode?.unlocked).length;

  // Calculate expansion cost
  const exploredWidth = exploredBounds.maxX - exploredBounds.minX + 1;
  const exploredHeight = exploredBounds.maxY - exploredBounds.minY + 1;

  const handleTileClick = (tile) => {
    setSelectedTile(tile);
    setExpandedSection('selectedTile'); // Auto-expand the selected tile section
  };

  const handleExpand = () => {
    expandExploration();
  };

  const handleUnlockNode = () => {
    if (selectedTile?.extractionNode && !selectedTile.extractionNode.unlocked) {
      unlockExplorationNode(selectedTile.x, selectedTile.y);
      setSelectedTile(null);
    }
  };

  // Sidebar sections for Exploration
  const sidebarSections = [
    {
      id: 'stats',
      title: t('game.exploration.stats'),
      icon: <BarChartIcon sx={{ color: 'info.main', fontSize: 20 }} />,
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">{t('game.exploration.exploredTiles')}</Typography>
            <Typography variant="body2">{exploredCount}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">{t('game.exploration.mapSize')}</Typography>
            <Typography variant="body2">{exploredWidth} x {exploredHeight}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">{t('game.exploration.nodesFound')}</Typography>
            <Typography variant="body2">{totalNodes}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">{t('game.exploration.nodesUnlocked')}</Typography>
            <Typography variant="body2">{unlockedNodes}</Typography>
          </Box>
        </Box>
      )
    },
    {
      id: 'selectedTile',
      title: t('game.exploration.selectedTile'),
      icon: <InfoIcon sx={{ color: 'primary.main', fontSize: 20 }} />,
      content: selectedTile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">{t('game.exploration.terrain')}</Typography>
            <Chip
              label={rules.exploration.terrainTypes[selectedTile.terrain]?.name || selectedTile.terrain}
              size="small"
              sx={{
                backgroundColor: `#${rules.exploration.terrainTypes[selectedTile.terrain]?.color.toString(16).padStart(6, '0')}`,
                color: 'white'
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">{t('game.exploration.position')}</Typography>
            <Typography variant="body2">({selectedTile.x}, {selectedTile.y})</Typography>
          </Box>
          {selectedTile.extractionNode && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">{t('game.exploration.resource')}</Typography>
                <Typography variant="body2">{selectedTile.extractionNode.resourceType}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">{t('game.exploration.rate')}</Typography>
                <Typography variant="body2">{selectedTile.extractionNode.rate}/tick</Typography>
              </Box>
              {!selectedTile.extractionNode.unlocked && (
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  startIcon={<LockOpenIcon />}
                  onClick={handleUnlockNode}
                  disabled={credits < rules.exploration.nodeUnlockCost}
                  sx={{ mt: 1 }}
                >
                  {t('game.exploration.unlock')} ({rules.exploration.nodeUnlockCost})
                </Button>
              )}
              {selectedTile.extractionNode.unlocked && (
                <Chip
                  label={t('game.exploration.active')}
                  color="success"
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
            </>
          )}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t('game.exploration.clickToSelect')}
        </Typography>
      )
    }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Main content area with canvas and sidebar */}
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Canvas container */}
        <Box sx={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <FloatingHUD credits={credits} energy={engineState.energy} />
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, py: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {t('game.exploration.explored', { count: exploredCount })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('game.factory.zoomHint')}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <ExplorationCanvas
                explorationMap={explorationMap}
                rules={rules}
                onTileClick={handleTileClick}
              />
            </Box>
          </Box>
        </Box>

        {/* Right Sidebar */}
        <CollapsibleSidebar
          sections={sidebarSections}
          defaultExpanded="stats"
          expanded={expandedSection}
          onExpandedChange={setExpandedSection}
        />
      </Box>

      {/* Bottom Actions Panel */}
      <CollapsibleActionsPanel title={t('game.exploration.actions')}>
        <Button
          variant="contained"
          size="small"
          startIcon={<TerrainIcon />}
          onClick={handleExpand}
          disabled={credits < rules.exploration.baseCostPerCell}
        >
          {t('game.exploration.expand')} ({rules.exploration.baseCostPerCell}+)
        </Button>
      </CollapsibleActionsPanel>
    </Box>
  );
}

function PlaceholderTab({ title, description, icon: Icon }) {
  const { t } = useTranslation();

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto' }}>
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          py: 6
        }}
      >
        <Icon sx={{ fontSize: 64, color: 'primary.main', opacity: 0.6 }} />
        <Typography variant="h5">{title}</Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          {description}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('main.comingSoon')}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function GamePage() {
  const { t } = useTranslation();
  const { currentGame } = useGame();

  const engineState = useGameStore((state) => state.engineState);
  const isRunning = useGameStore((state) => state.isRunning);
  const simulate = useGameStore((state) => state.simulate);
  const startGameLoop = useGameStore((state) => state.startGameLoop);
  const stopGameLoop = useGameStore((state) => state.stopGameLoop);

  const [tabValue, setTabValue] = useState(0);

  // If no game is loaded, redirect to menu
  if (!currentGame || !engineState) {
    return <Navigate to="/" replace />;
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const toggleGameLoop = () => {
    if (isRunning) {
      stopGameLoop();
    } else {
      startGameLoop(1000); // 1 tick per second
    }
  };

  const tabs = [
    { label: t('main.tabs.factory'), icon: <FactoryIcon /> },
    { label: t('main.tabs.exploration'), icon: <ExploreIcon /> },
    { label: t('main.tabs.research'), icon: <ScienceIcon /> },
    { label: t('main.tabs.market'), icon: <StorefrontIcon /> }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      {/* Compact Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5">{currentGame.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('game.tick')}: {engineState.tick}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={t('game.controls.singleTick')}>
            <IconButton onClick={() => simulate()} disabled={isRunning} size="small">
              <SkipNextIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={isRunning ? t('game.controls.pause') : t('game.controls.play')}>
            <IconButton onClick={toggleGameLoop} color={isRunning ? 'primary' : 'default'} size="small">
              {isRunning ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="game tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              icon={tab.icon}
              label={tab.label}
              iconPosition="start"
              id={`game-tab-${index}`}
              aria-controls={`game-tabpanel-${index}`}
              sx={{ minHeight: 48 }}
            />
          ))}
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <FactoryTab />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ExplorationTab />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <PlaceholderTab
          title={t('main.tabs.research')}
          description={t('main.researchDescription')}
          icon={ScienceIcon}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <PlaceholderTab
          title={t('main.tabs.market')}
          description={t('main.marketDescription')}
          icon={StorefrontIcon}
        />
      </TabPanel>
    </Box>
  );
}
