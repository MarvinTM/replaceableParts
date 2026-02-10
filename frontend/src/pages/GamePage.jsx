import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Badge from '@mui/material/Badge';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import FactoryIcon from '@mui/icons-material/Factory';
import ExploreIcon from '@mui/icons-material/Explore';
import ScienceIcon from '@mui/icons-material/Science';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import BoltIcon from '@mui/icons-material/Bolt';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import TerrainIcon from '@mui/icons-material/Terrain';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import GridViewIcon from '@mui/icons-material/GridView';
import InfoIcon from '@mui/icons-material/Info';
import BarChartIcon from '@mui/icons-material/BarChart';
import BuildIcon from '@mui/icons-material/Build';
import SaveIcon from '@mui/icons-material/Save';
import CheckIcon from '@mui/icons-material/Check';
import Divider from '@mui/material/Divider';
import { getMaterialName } from '../utils/translationHelpers';
import { calculateRawMaterialIncome } from '../utils/explorationIncome';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import useGameStore from '../stores/gameStore';
import {
  getNextExpansionChunk,
  getNextExplorationExpansion,
  expandGeneratedMap,
  getNodeUnlockCost,
  calculateHighestUnlockedAge,
} from '../engine/engine.js';
import FactoryCanvas from '../components/factory/FactoryCanvas';
import ExplorationCanvas from '../components/exploration/ExplorationCanvas';
import RecipeDropdown from '../components/factory/RecipeDropdown';
import MachineInfoPopup from '../components/factory/MachineInfoPopup';
import BuildPopup from '../components/factory/BuildPopup';
import BuildSelectionPopup from '../components/factory/BuildSelectionPopup';
import MaterialIcon from '../components/common/MaterialIcon';
import FloatingHUD from '../components/common/FloatingHUD';
import CollapsibleSidebar from '../components/common/CollapsibleSidebar';
import CollapsibleActionsPanel from '../components/common/CollapsibleActionsPanel';
import SplitSidebar from '../components/common/SplitSidebar';
import FactoryBottomBar from '../components/factory/FactoryBottomBar';
import MarketTab from '../components/market/MarketTab';
import EncyclopediaTab from '../components/encyclopedia/EncyclopediaTab';
import ResearchTab from '../components/research/ResearchTab';
import FlowPrototypeNotifier from '../components/research/FlowPrototypeNotifier';
import DiscoveryNotifier from '../components/research/DiscoveryNotifier';
import TutorialOverlay from '../components/tutorial/TutorialOverlay';
import TipSnackbar from '../components/tips/TipSnackbar';
import { formatCredits } from '../utils/currency';
import { calculateRawMaterialBalance } from '../utils/rawMaterialBalance';
import { calculateMaterialThroughput } from '../utils/materialThroughput';
import { calculateRequestedEnergyConsumption } from '../utils/energyDemand';
import { getExperimentCostForAge } from '../utils/researchCosts';
import {
  getEnergyTipLevel,
  hasLowRawMaterialProduction,
  hasLowPartsProduction,
  hasMachineWithoutRecipeAssigned,
  hasGeneratorOutOfFuel,
  hasPrototypeReadyForParts,
  hasAffordableLockedExplorationNode,
  hasMarketSaturationWarning,
  hasMarketDiversificationOpportunity,
} from '../utils/tipTriggers';

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
  const { isAdmin } = useAuth();
  const engineState = useGameStore((state) => state.engineState);
  const rules = useGameStore((state) => state.rules);
  const machineAnimationMode = useGameStore((state) => state.machineAnimationMode);
  const currentSpeed = useGameStore((state) => state.currentSpeed);
  const buyFloorSpace = useGameStore((state) => state.buyFloorSpace);
  const addMachine = useGameStore((state) => state.addMachine);
  const addGenerator = useGameStore((state) => state.addGenerator);
  const removeMachine = useGameStore((state) => state.removeMachine);
  const removeGenerator = useGameStore((state) => state.removeGenerator);
  const assignRecipe = useGameStore((state) => state.assignRecipe);
  const toggleMachine = useGameStore((state) => state.toggleMachine);
  const moveMachine = useGameStore((state) => state.moveMachine);
  const moveGenerator = useGameStore((state) => state.moveGenerator);
  const buildMachineAction = useGameStore((state) => state.buildMachine);
  const buildGeneratorAction = useGameStore((state) => state.buildGenerator);

  // Admin cheat mode - only visible to admins
  const [cheatMode, setCheatMode] = useState(false);

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

  // State for build popup
  const [buildPopupOpen, setBuildPopupOpen] = useState(false);
  const [buildPopupType, setBuildPopupType] = useState(null); // 'machine' or 'generator'
  const [buildPopupItemType, setBuildPopupItemType] = useState(null); // e.g., 'stone_furnace'

  // State for build selection popup (selecting which machine/generator to build)
  const [buildSelectionOpen, setBuildSelectionOpen] = useState(false);
  const [buildSelectionType, setBuildSelectionType] = useState(null); // 'machine' or 'generator'

  // Ref for inventory panel (used for fly-to-inventory animations)
  const inventoryPanelRef = useRef(null);

  if (!engineState) return null;

  const { machines, generators, floorSpace, inventory, credits, unlockedRecipes, builtMachines, builtGenerators } = engineState;

  // Get current machine state from engineState (ensures fresh data after toggle)
  const selectedMachine = selectedMachineId
    ? machines.find(m => m.id === selectedMachineId)
    : null;

  const rawMaterialBalance = calculateRawMaterialBalance({
    machines,
    generators,
    extractionNodes: engineState.extractionNodes,
    materials: rules.materials,
    recipes: rules.recipes,
    generatorConfigs: rules.generators,
  }).map(({ materialId, produced, consumed }) => {
    const mat = rules.materials.find(m => m.id === materialId);
    return {
      materialId, produced, consumed,
      materialName: getMaterialName(materialId, mat?.name),
      category: mat?.category || 'raw',
    };
  });
  const materialThroughput = calculateMaterialThroughput({
    machines,
    materials: rules.materials,
    recipes: rules.recipes,
  });
  const requestedEnergyConsumption = calculateRequestedEnergyConsumption({
    machines,
    machineConfigs: rules.machines,
  });
  const hudEnergy = {
    ...engineState.energy,
    consumed: Math.max(Number(engineState.energy?.consumed) || 0, requestedEnergyConsumption),
  };

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
    assignRecipe(machineId, recipeId, cheatMode);
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

  // Build popup handlers
  const handleOpenBuildPopup = (type, itemType) => {
    setBuildPopupType(type);
    setBuildPopupItemType(itemType);
    setBuildPopupOpen(true);
  };

  const handleCloseBuildPopup = () => {
    setBuildPopupOpen(false);
    setBuildPopupType(null);
    setBuildPopupItemType(null);
  };

  const handleBuild = (itemType, quantity = 1) => {
    if (buildPopupType === 'machine') {
      buildMachineAction(itemType, cheatMode, quantity);
    } else if (buildPopupType === 'generator') {
      buildGeneratorAction(itemType, cheatMode, quantity);
    }
  };

  // Build selection popup handlers
  const handleOpenBuildSelection = (type) => {
    setBuildSelectionType(type);
    setBuildSelectionOpen(true);
  };

  const handleCloseBuildSelection = () => {
    setBuildSelectionOpen(false);
    setBuildSelectionType(null);
  };

  const handleSelectItemToBuild = (item) => {
    // Close selection popup and open build popup
    handleCloseBuildSelection();
    handleOpenBuildPopup(buildSelectionType, item.id);
  };

  // Get available generators and machines from built pools (ready to deploy)
  const availableGenerators = rules.generators
    .map(genType => ({ ...genType, count: builtGenerators?.[genType.id] || 0 }))
    .filter(gen => gen.count > 0);

  const availableMachines = rules.machines
    .map(machineType => ({ ...machineType, count: builtMachines?.[machineType.id] || 0 }))
    .filter(machine => machine.count > 0);

  // Get buildable machines and generators (those with recipes AND unlocked AND not disabled, or all non-disabled if cheat mode)
  const buildableMachines = rules.machines
    .filter(machineType => !machineType.disabled && rules.machineRecipes?.[machineType.id] && (cheatMode || unlockedRecipes.includes(machineType.id)));

  const buildableGenerators = rules.generators
    .filter(genType => !genType.disabled && rules.generatorRecipes?.[genType.id] && (cheatMode || unlockedRecipes.includes(genType.id)));

  const PREVIEW_SIZE = 48;

  // Sidebar sections for SplitSidebar
  const generatorsSection = {
    title: t('game.factory.generators'),
    icon: <BoltIcon sx={{ color: 'success.main', fontSize: 20 }} />,
    badge: availableGenerators.length > 0 ? availableGenerators.reduce((sum, g) => sum + g.count, 0) : undefined,
    action: buildableGenerators.length > 0 ? {
      label: t('game.factory.build', 'Build'),
      icon: <BuildIcon sx={{ fontSize: 14 }} />,
      color: 'warning',
      onClick: () => handleOpenBuildSelection('generator'),
    } : undefined,
    content: (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Built generators ready to deploy */}
        {availableGenerators.length > 0 && (
          <>
            <Typography variant="caption" color="text.secondary">
              {t('game.factory.readyToDeploy', 'Ready to Deploy')}
            </Typography>
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
                <Box component="img" src={`/assets/factory/${generator.id}.png`} alt={getMaterialName(generator.id, generator.name)}
                  sx={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE, objectFit: 'contain', flexShrink: 0, imageRendering: 'pixelated' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" noWrap>{getMaterialName(generator.id, generator.name)}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <BoltIcon sx={{ fontSize: 14, color: 'success.main' }} />
                    <Typography variant="caption" color="success.main">+{generator.energyOutput}</Typography>
                  </Box>
                </Box>
                <Chip label={`x${generator.count}`} size="small" color="warning" />
              </Box>
            ))}
          </>
        )}
        {availableGenerators.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            {t('game.factory.noGeneratorsBuilt', 'No generators built yet')}
          </Typography>
        )}
      </Box>
    )
  };

  const machinesSection = {
    title: t('game.factory.machines'),
    icon: <PrecisionManufacturingIcon sx={{ color: 'primary.main', fontSize: 20 }} />,
    badge: availableMachines.length > 0 ? availableMachines.reduce((sum, m) => sum + m.count, 0) : undefined,
    action: buildableMachines.length > 0 ? {
      label: t('game.factory.build', 'Build'),
      icon: <BuildIcon sx={{ fontSize: 14 }} />,
      color: 'primary',
      onClick: () => handleOpenBuildSelection('machine'),
    } : undefined,
    content: (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Built machines ready to deploy */}
        {availableMachines.length > 0 && (
          <>
            <Typography variant="caption" color="text.secondary">
              {t('game.factory.readyToDeploy', 'Ready to Deploy')}
            </Typography>
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
                <Box component="img" src={`/assets/factory/${machine.id}_idle.png`} alt={getMaterialName(machine.id, machine.name)}
                  sx={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE, objectFit: 'contain', flexShrink: 0, imageRendering: 'pixelated' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" noWrap>{getMaterialName(machine.id, machine.name)}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <BoltIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                    <Typography variant="caption" color="text.secondary">-{machine.energyConsumption}</Typography>
                  </Box>
                </Box>
                <Chip label={`x${machine.count}`} size="small" color="primary" />
              </Box>
            ))}
          </>
        )}
        {availableMachines.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            {t('game.factory.noMachinesBuilt', 'No machines built yet')}
          </Typography>
        )}
      </Box>
    )
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      {/* Main content area with canvas and sidebar */}
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Canvas container */}
        <Box sx={{ flex: 1, position: 'relative', minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <FloatingHUD credits={credits} energy={hudEnergy} rawMaterialBalance={rawMaterialBalance} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, py: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {t('game.factory.gridSize', { width: floorSpace.width, height: floorSpace.height })}
            </Typography>
            {isAdmin && (
              <FormControlLabel
                control={
                  <Switch
                    checked={cheatMode}
                    onChange={(e) => setCheatMode(e.target.checked)}
                    size="small"
                    color="warning"
                  />
                }
                label={
                  <Typography variant="caption" sx={{ color: cheatMode ? 'warning.main' : 'text.secondary' }}>
                    Cheat
                  </Typography>
                }
                sx={{ m: 0 }}
              />
            )}
            <Typography variant="caption" color="text.secondary">
              {t('game.factory.zoomHint')}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <FactoryCanvas
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
                simulationSpeed={currentSpeed}
                inventoryPanelRef={inventoryPanelRef}
              />
              {/* Floating Expand Factory Button */}
              <Tooltip title={t('game.factory.expandInfo', { width: expansion.newWidth, height: expansion.newHeight })}>
                <span style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 10 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<GridViewIcon />}
                    onClick={handleExpand}
                    disabled={credits < expansion.cost}
                  >
                    {t('game.factory.expand')} ({formatCredits(expansion.cost)})
                  </Button>
                </span>
            </Tooltip>
          </Box>
        </Box>

        {/* Right Sidebar - Split view with Generators and Machines */}
        <SplitSidebar topSection={generatorsSection} bottomSection={machinesSection} />
      </Box>

      {/* Bottom Bar with Inventory and Play Controls */}
      <FactoryBottomBar
        ref={inventoryPanelRef}
        inventory={inventory}
        rules={rules}
        tick={engineState.tick}
        materialThroughput={materialThroughput}
        inventoryCapacity={engineState.inventorySpace}
      />

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
          cheatMode={cheatMode}
        />
      )}

      {/* Build Selection Popup */}
      <BuildSelectionPopup
        open={buildSelectionOpen}
        onClose={handleCloseBuildSelection}
        onSelect={handleSelectItemToBuild}
        items={buildSelectionType === 'generator' ? buildableGenerators : buildableMachines}
        itemType={buildSelectionType}
      />

      {/* Build Popup */}
      <BuildPopup
        open={buildPopupOpen}
        onClose={handleCloseBuildPopup}
        type={buildPopupType}
        itemType={buildPopupItemType}
        itemConfig={
          buildPopupType === 'machine'
            ? rules.machines.find(m => m.id === buildPopupItemType)
            : rules.generators.find(g => g.id === buildPopupItemType)
        }
        buildRecipe={
          buildPopupType === 'machine'
            ? rules.machineRecipes?.[buildPopupItemType]
            : rules.generatorRecipes?.[buildPopupItemType]
        }
        inventory={inventory}
        rules={rules}
        onBuild={handleBuild}
        cheatMode={cheatMode}
      />
    </Box>
  );
}

function ExplorationTab() {
  const { t, i18n } = useTranslation();
  const engineState = useGameStore((state) => state.engineState);
  const rules = useGameStore((state) => state.rules);
  const expandExploration = useGameStore((state) => state.expandExploration);
  const unlockExplorationNode = useGameStore((state) => state.unlockExplorationNode);

  const [selectedTile, setSelectedTile] = useState(null);

  // Compute which resources are used by discovered or unlocked recipes (same logic as ExplorationCanvas)
  const usedResources = useMemo(() => {
    const resources = new Set();
    if (!rules?.recipes) return resources;

    const recipeMap = new Map(rules.recipes.map(r => [r.id, r]));

    // Include resources from unlocked recipes
    if (engineState?.unlockedRecipes) {
      for (const recipeId of engineState.unlockedRecipes) {
        const recipe = recipeMap.get(recipeId);
        if (recipe?.inputs) {
          for (const inputResource of Object.keys(recipe.inputs)) {
            resources.add(inputResource);
          }
        }
      }
    }

    // Include resources from discovered recipes
    if (engineState?.discoveredRecipes) {
      for (const recipeId of engineState.discoveredRecipes) {
        const recipe = recipeMap.get(recipeId);
        if (recipe?.inputs) {
          for (const inputResource of Object.keys(recipe.inputs)) {
            resources.add(inputResource);
          }
        }
      }
    }

    return resources;
  }, [rules?.recipes, engineState?.unlockedRecipes, engineState?.discoveredRecipes]);

  const materialsById = useMemo(
    () => new Map((rules?.materials || []).map(material => [material.id, material])),
    [rules?.materials]
  );

  const rawMaterialIncome = useMemo(() => {
    const baseIncome = calculateRawMaterialIncome(engineState?.extractionNodes, rules?.materials);

    return baseIncome
      .map(({ materialId, rate }) => ({
        materialId,
        rate,
        materialName: getMaterialName(materialId, materialsById.get(materialId)?.name),
        category: materialsById.get(materialId)?.category || 'raw',
      }))
      .sort((a, b) => a.materialName.localeCompare(b.materialName));
  }, [engineState?.extractionNodes, rules?.materials, materialsById, i18n.language]);

  if (!engineState?.explorationMap) return null;

  const { explorationMap, credits } = engineState;
  const requestedEnergyConsumption = calculateRequestedEnergyConsumption({
    machines: engineState.machines,
    machineConfigs: rules.machines,
  });
  const hudEnergy = {
    ...engineState.energy,
    consumed: Math.max(Number(engineState.energy?.consumed) || 0, requestedEnergyConsumption),
  };
  const { exploredBounds, tiles } = explorationMap;

  // Count stats
  const exploredCount = Object.values(tiles).filter(t => t.explored).length;
  const totalNodes = Object.values(tiles).filter(t => t.explored && t.extractionNode).length;
  const unlockedNodes = Object.values(tiles).filter(t => t.explored && t.extractionNode?.unlocked).length;

  // Calculate expansion cost
  const exploredWidth = exploredBounds.maxX - exploredBounds.minX + 1;
  const exploredHeight = exploredBounds.maxY - exploredBounds.minY + 1;
  let nextExpansion = getNextExplorationExpansion(explorationMap, rules);

  // If at edge with no cells to explore, simulate map expansion to get actual cost
  if (nextExpansion?.cellsToExplore === 0 && nextExpansion?.atMapEdge) {
    const expandedMap = expandGeneratedMap(explorationMap, rules);
    if (expandedMap) {
      nextExpansion = getNextExplorationExpansion(expandedMap, rules);
    }
  }

  const expansionCost = nextExpansion?.cost || 0;
  const canExplore = expansionCost > 0;

  const handleTileClick = (tile) => {
    setSelectedTile(tile);
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
      id: 'income',
      title: t('game.exploration.income'),
      icon: <BoltIcon sx={{ color: 'success.main', fontSize: 20 }} />,
      content: rawMaterialIncome.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {rawMaterialIncome.map(({ materialId, materialName, category, rate }) => (
            <Box
              key={materialId}
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                <MaterialIcon
                  materialId={materialId}
                  materialName={materialName}
                  category={category}
                  size={20}
                />
                <Typography variant="body2" noWrap>
                  {materialName}
                </Typography>
              </Box>
              <Typography variant="body2" color="success.main" sx={{ fontFamily: 'monospace', flexShrink: 0 }}>
                +{rate}{t('game.exploration.perTick', '/ tick')}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t('game.exploration.noIncome')}
        </Typography>
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
          {selectedTile.extractionNode && usedResources.has(selectedTile.extractionNode.resourceType) && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">{t('game.exploration.resource')}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <MaterialIcon
                    materialId={selectedTile.extractionNode.resourceType}
                    category="raw"
                    size={20}
                  />
                  <Typography variant="body2">
                    {getMaterialName(
                      selectedTile.extractionNode.resourceType,
                      materialsById.get(selectedTile.extractionNode.resourceType)?.name
                    )}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">{t('game.exploration.rate')}</Typography>
                <Typography variant="body2">
                  {selectedTile.extractionNode.rate}{t('game.exploration.perTick', '/ tick')}
                </Typography>
              </Box>
              {!selectedTile.extractionNode.unlocked && (() => {
                const unlockCost = getNodeUnlockCost(
                  selectedTile.extractionNode.resourceType,
                  engineState.extractionNodes,
                  rules
                );
                return (
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    startIcon={<LockOpenIcon />}
                    onClick={handleUnlockNode}
                    disabled={credits < unlockCost}
                    sx={{ mt: 1 }}
                  >
                    {t('game.exploration.unlock')} ({unlockCost})
                  </Button>
                );
              })()}
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
          <FloatingHUD credits={credits} energy={hudEnergy} />
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
                unlockedRecipes={engineState.unlockedRecipes}
                discoveredRecipes={engineState.discoveredRecipes}
                onTileClick={handleTileClick}
              />
            </Box>
          </Box>
        </Box>

        {/* Right Sidebar */}
        <CollapsibleSidebar
          sections={sidebarSections}
          staticSections={true}
        />
      </Box>

      {/* Bottom Actions Panel */}
      <CollapsibleActionsPanel title={t('game.exploration.actions')}>
        <Button
          variant="contained"
          size="small"
          startIcon={<TerrainIcon />}
          onClick={handleExpand}
          disabled={!canExplore || credits < expansionCost}
        >
          {t('game.exploration.expand')} ({formatCredits(expansionCost)})
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
  const { currentGame, isAutoRestoring, saveGame } = useGame();

  const engineState = useGameStore((state) => state.engineState);
  const rules = useGameStore((state) => state.rules);
  const isRunning = useGameStore((state) => state.isRunning);
  const startGameLoop = useGameStore((state) => state.startGameLoop);
  const completeTutorial = useGameStore((state) => state.completeTutorial);
  const queueTip = useGameStore((state) => state.queueTip);

  // Save state for manual save button
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Track if we've auto-started for this game session
  const hasAutoStarted = useRef(false);

  // Auto-start game loop when engine state becomes available
  useEffect(() => {
    if (engineState && !hasAutoStarted.current && !isRunning) {
      hasAutoStarted.current = true;
      startGameLoop('normal');
    }
  }, [engineState, isRunning, startGameLoop]);

  // Reset the auto-start flag when game is cleared (user exits)
  useEffect(() => {
    if (!engineState) {
      hasAutoStarted.current = false;
    }
  }, [engineState]);

  // Tutorial state - show if not completed
  const showTutorial = engineState && !engineState.tutorialCompleted;

  const handleTutorialComplete = () => {
    completeTutorial();
  };

  const [tabValue, setTabValue] = useState(0);

  // Tab tip triggers - show tip when opening a tab for the first time
  const tabTips = {
    0: { id: 'tab-factory', messageKey: 'tips.factory' },
    1: { id: 'tab-exploration', messageKey: 'tips.exploration' },
    2: { id: 'tab-research', messageKey: 'tips.research' },
    3: { id: 'tab-market', messageKey: 'tips.market' },
  };

  // Track if we've already triggered the initial tab tip
  const initialTipTriggered = useRef(false);

  const tipSignals = useMemo(() => {
    if (!engineState || !rules) {
      return {
        energy: 'normal',
        rawMaterials: false,
        parts: false,
        machineNoRecipeAssigned: false,
        generatorOutOfFuel: false,
        researchReadyButIdle: false,
        prototypeReadyForParts: false,
        explorationNodeAffordable: false,
        marketSaturationWarning: false,
        marketDiversificationOpportunity: false,
      };
    }

    const requestedEnergyConsumption = calculateRequestedEnergyConsumption({
      machines: engineState.machines,
      machineConfigs: rules.machines,
    });
    const consumed = Math.max(Number(engineState.energy?.consumed) || 0, requestedEnergyConsumption);
    const produced = Number(engineState.energy?.produced) || 0;

    const rawMaterialBalance = calculateRawMaterialBalance({
      machines: engineState.machines,
      generators: engineState.generators,
      extractionNodes: engineState.extractionNodes,
      materials: rules.materials,
      recipes: rules.recipes,
      generatorConfigs: rules.generators,
    });
    const materialThroughput = calculateMaterialThroughput({
      machines: engineState.machines,
      materials: rules.materials,
      recipes: rules.recipes,
    });

    const highestUnlockedAge = calculateHighestUnlockedAge(engineState, rules);
    const randomExperimentCost = getExperimentCostForAge(highestUnlockedAge, rules);
    const researchPoints = Number(engineState.research?.researchPoints) || 0;
    const undiscoveredCount = Math.max(0, rules.recipes.length - (engineState.discoveredRecipes?.length || 0));

    const usedResources = new Set();
    const recipeMap = new Map((rules.recipes || []).map(recipe => [recipe.id, recipe]));
    for (const recipeId of [...(engineState.unlockedRecipes || []), ...(engineState.discoveredRecipes || [])]) {
      const recipe = recipeMap.get(recipeId);
      if (!recipe?.inputs) continue;
      for (const resourceId of Object.keys(recipe.inputs)) {
        usedResources.add(resourceId);
      }
    }

    const inStockFinalGoodIds = Object.entries(engineState.inventory || {})
      .filter(([, quantity]) => Number(quantity) > 0)
      .map(([itemId]) => {
        const material = rules.materials.find(m => m.id === itemId);
        return material?.category === 'final' ? itemId : null;
      })
      .filter(Boolean);

    return {
      energy: getEnergyTipLevel({ produced, consumed }),
      rawMaterials: hasLowRawMaterialProduction(rawMaterialBalance),
      parts: hasLowPartsProduction(materialThroughput),
      machineNoRecipeAssigned: hasMachineWithoutRecipeAssigned({
        machines: engineState.machines,
        machineConfigs: rules.machines,
      }),
      generatorOutOfFuel: hasGeneratorOutOfFuel({
        generators: engineState.generators,
        generatorConfigs: rules.generators,
      }),
      researchReadyButIdle: !engineState.research?.active &&
        undiscoveredCount > 0 &&
        researchPoints >= randomExperimentCost,
      prototypeReadyForParts: hasPrototypeReadyForParts({
        awaitingPrototype: engineState.research?.awaitingPrototype || [],
        inventory: engineState.inventory,
        materials: rules.materials,
      }),
      explorationNodeAffordable: hasAffordableLockedExplorationNode({
        explorationMap: engineState.explorationMap,
        extractionNodes: engineState.extractionNodes,
        credits: engineState.credits,
        relevantResourceIds: usedResources,
        getUnlockCost: (resourceType, extractionNodes) => getNodeUnlockCost(resourceType, extractionNodes, rules),
      }),
      marketSaturationWarning: hasMarketSaturationWarning({
        marketRecentSales: engineState.marketRecentSales || [],
        marketPopularity: engineState.marketPopularity || {},
        tick: engineState.tick,
        recentTicks: 20,
      }),
      marketDiversificationOpportunity: hasMarketDiversificationOpportunity({
        marketRecentSales: engineState.marketRecentSales || [],
        tick: engineState.tick,
        diversificationWindow: rules.market?.diversificationWindow || 100,
        diversificationBonuses: rules.market?.diversificationBonuses || {},
        inStockFinalGoodIds,
      }),
    };
  }, [engineState, rules]);

  // Manual save handler - must be before conditional returns
  const handleManualSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await saveGame({ reason: 'manual_save_button' });
      setSaveSuccess(true);
      // Reset success indicator after 2 seconds
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save game:', error);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, saveGame]);

  // Tab change handler - must be before conditional returns
  const handleTabChange = useCallback((event, newValue) => {
    // Save game when switching tabs (fire and forget)
    saveGame({ reason: 'tab_change' }).catch(console.error);
    setTabValue(newValue);
  }, [saveGame]);

  useEffect(() => {
    // Don't show tips until tutorial is complete
    if (!engineState?.tutorialCompleted) return;

    const tip = tabTips[tabValue];
    if (tip) {
      // Small delay to let the tab content render first
      const timer = setTimeout(() => {
        queueTip(tip.id, tip.messageKey);
      }, initialTipTriggered.current ? 500 : 1000);

      initialTipTriggered.current = true;
      return () => clearTimeout(timer);
    }
  }, [tabValue, engineState?.tutorialCompleted, queueTip]);

  useEffect(() => {
    if (!engineState?.tutorialCompleted) return;

    if (tipSignals.energy === 'negative') {
      queueTip('event-energy-negative', 'tips.energyNegative');
    } else if (tipSignals.energy === 'low') {
      queueTip('event-energy-low', 'tips.energyLow');
    }

    if (tipSignals.rawMaterials) {
      queueTip('event-raw-production-low', 'tips.rawProductionLow');
    }

    if (tipSignals.parts) {
      queueTip('event-parts-production-low', 'tips.partsProductionLow');
    }

    if (tipSignals.machineNoRecipeAssigned) {
      queueTip('event-machine-no-recipe-assigned', 'tips.machineNoRecipeAssigned');
    }

    if (tipSignals.generatorOutOfFuel) {
      queueTip('event-generator-out-of-fuel', 'tips.generatorOutOfFuel');
    }

    if (tipSignals.researchReadyButIdle) {
      queueTip('event-research-ready-idle', 'tips.researchReadyIdle');
    }

    if (tipSignals.prototypeReadyForParts) {
      queueTip('event-prototype-ready-for-parts', 'tips.prototypeReadyForParts');
    }

    if (tipSignals.explorationNodeAffordable) {
      queueTip('event-exploration-node-affordable', 'tips.explorationNodeAffordable');
    }

    if (tipSignals.marketSaturationWarning) {
      queueTip('event-market-saturation-warning', 'tips.marketSaturationWarning');
    }

    if (tipSignals.marketDiversificationOpportunity) {
      queueTip('event-market-diversification-opportunity', 'tips.marketDiversificationOpportunity');
    }
  }, [engineState?.tutorialCompleted, tipSignals, queueTip]);

  // If no game is loaded and not auto-restoring, redirect to menu
  if ((!currentGame || !engineState) && !isAutoRestoring) {
    return <Navigate to="/" replace />;
  }

  // Show loading screen during auto-restore
  if (isAutoRestoring) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 2 }}>
        <CircularProgress />
        <Typography variant="h6">{t('game.restoring', 'Restoring game...')}</Typography>
      </Box>
    );
  }

  // Calculate pending research count for badge
  const pendingResearchCount = engineState?.research?.awaitingPrototype?.length || 0;

  const tabs = [
    { label: t('main.tabs.factory'), icon: <FactoryIcon /> },
    { label: t('main.tabs.exploration'), icon: <ExploreIcon /> },
    {
      label: t('main.tabs.research'),
      icon: (
        <Badge
          badgeContent={pendingResearchCount}
          color="error"
          invisible={pendingResearchCount === 0}
        >
          <ScienceIcon />
        </Badge>
      )
    },
    { label: t('main.tabs.market'), icon: <StorefrontIcon /> },
    { label: t('main.tabs.encyclopedia'), icon: <MenuBookIcon /> }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {/* Tabs and Game Name */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 2 }}>
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">
            {currentGame.name}
          </Typography>
          <Tooltip title={saveSuccess ? t('game.saved', 'Saved!') : t('game.save', 'Save Game')}>
            <IconButton
              size="small"
              onClick={handleManualSave}
              disabled={isSaving}
              sx={{
                color: saveSuccess ? 'success.main' : 'text.secondary',
                transition: 'color 0.2s',
              }}
            >
              {isSaving ? (
                <CircularProgress size={20} />
              ) : saveSuccess ? (
                <CheckIcon fontSize="small" />
              ) : (
                <SaveIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <FactoryTab />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ExplorationTab />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <ResearchTab />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <MarketTab />
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <EncyclopediaTab />
      </TabPanel>

      {/* Global notifier for flow-mode prototype completions */}
      <FlowPrototypeNotifier />

      {/* Global notifier for recipe discoveries */}
      <DiscoveryNotifier />

      {/* Tutorial overlay for new games */}
      <TutorialOverlay open={showTutorial} onComplete={handleTutorialComplete} />

      {/* Contextual tips snackbar */}
      <TipSnackbar />
    </Box>
  );
}
