import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
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
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TerrainIcon from '@mui/icons-material/Terrain';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useGame } from '../contexts/GameContext';
import useGameStore from '../stores/gameStore';
import FactoryCanvas from '../components/factory/FactoryCanvas';
import ExplorationCanvas from '../components/exploration/ExplorationCanvas';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`game-tabpanel-${index}`}
      aria-labelledby={`game-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = 'primary' }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
        <Icon sx={{ fontSize: 32, color: `${color}.main` }} />
        <Box>
          <Typography variant="h5">{value}</Typography>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function FactoryTab() {
  const { t } = useTranslation();
  const engineState = useGameStore((state) => state.engineState);
  const rules = useGameStore((state) => state.rules);

  if (!engineState) return null;

  const { machines, generators, floorSpace, inventory } = engineState;

  return (
    <Box>
      {/* Isometric Factory View */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, px: 1 }}>
            <Typography variant="subtitle1">{t('game.factory.title')}</Typography>
            <Typography variant="caption" color="text.secondary">
              {t('game.factory.gridSize', { width: floorSpace.width, height: floorSpace.height })} | {t('game.factory.zoomHint')}
            </Typography>
          </Box>
          <FactoryCanvas
            floorSpace={floorSpace}
            machines={machines}
            generators={generators}
          />
        </CardContent>
      </Card>

      {/* Info panels in a row */}
      <Grid container spacing={2}>
        {/* Generators */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                {t('game.factory.generators')} ({generators.length})
              </Typography>
              {generators.length === 0 ? (
                <Typography variant="body2" color="text.secondary">{t('game.factory.noGenerators')}</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {generators.map((gen) => (
                    <Chip
                      key={gen.id}
                      icon={<BoltIcon />}
                      label={`${gen.type} (+${gen.energyOutput})`}
                      variant="outlined"
                      color="warning"
                      size="small"
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Machines */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                {t('game.factory.machines')} ({machines.length})
              </Typography>
              {machines.length === 0 ? (
                <Typography variant="body2" color="text.secondary">{t('game.factory.noMachines')}</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {machines.map((machine) => (
                    <Chip
                      key={machine.id}
                      icon={<FactoryIcon />}
                      label={machine.recipeId || 'Idle'}
                      variant="outlined"
                      color={machine.status === 'working' ? 'success' : machine.status === 'blocked' ? 'error' : 'default'}
                      size="small"
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Inventory */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                {t('game.factory.inventory')} ({engineState.inventorySpace} {t('game.factory.capacity')})
              </Typography>
              {Object.keys(inventory).length === 0 ? (
                <Typography variant="body2" color="text.secondary">{t('game.factory.emptyInventory')}</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(inventory).map(([itemId, quantity]) => {
                    const material = rules.materials.find(m => m.id === itemId);
                    return (
                      <Chip
                        key={itemId}
                        icon={<InventoryIcon />}
                        label={`${material?.name || itemId}: ${quantity}`}
                        variant="outlined"
                        size="small"
                      />
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
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

  return (
    <Box>
      {/* Exploration Map */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, px: 1 }}>
            <Typography variant="subtitle1">{t('game.exploration.title')}</Typography>
            <Typography variant="caption" color="text.secondary">
              {t('game.exploration.explored', { count: exploredCount })} | {t('game.factory.zoomHint')}
            </Typography>
          </Box>
          <ExplorationCanvas
            key={`${exploredBounds.minX}-${exploredBounds.maxX}-${exploredBounds.minY}-${exploredBounds.maxY}`}
            explorationMap={explorationMap}
            rules={rules}
            onTileClick={handleTileClick}
          />
        </CardContent>
      </Card>

      {/* Info panels */}
      <Grid container spacing={2}>
        {/* Exploration Stats */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                {t('game.exploration.stats')}
              </Typography>
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
            </CardContent>
          </Card>
        </Grid>

        {/* Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                {t('game.exploration.actions')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<TerrainIcon />}
                  onClick={handleExpand}
                  disabled={credits < rules.exploration.baseCostPerCell}
                >
                  {t('game.exploration.expand')} ({rules.exploration.baseCostPerCell}+ {t('game.stats.credits')})
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Selected Tile Info */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                {t('game.exploration.selectedTile')}
              </Typography>
              {selectedTile ? (
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
                          startIcon={<LockOpenIcon />}
                          onClick={handleUnlockNode}
                          disabled={credits < rules.exploration.nodeUnlockCost}
                          sx={{ mt: 1 }}
                        >
                          {t('game.exploration.unlock')} ({rules.exploration.nodeUnlockCost} {t('game.stats.credits')})
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
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
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
    <Box>
      {/* Header with stats */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h4">{currentGame.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('game.tick')}: {engineState.tick}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={t('game.controls.singleTick')}>
              <IconButton onClick={() => simulate()} disabled={isRunning}>
                <SkipNextIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={isRunning ? t('game.controls.pause') : t('game.controls.play')}>
              <IconButton onClick={toggleGameLoop} color={isRunning ? 'primary' : 'default'}>
                {isRunning ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <StatCard
              icon={AccountBalanceIcon}
              label={t('game.stats.credits')}
              value={engineState.credits}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              icon={BoltIcon}
              label={t('game.stats.energy')}
              value={`${engineState.energy.produced - engineState.energy.consumed} / ${engineState.energy.produced}`}
              color={engineState.energy.produced >= engineState.energy.consumed ? 'warning' : 'error'}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              icon={InventoryIcon}
              label={t('game.stats.items')}
              value={Object.values(engineState.inventory).reduce((a, b) => a + b, 0)}
              color="info"
            />
          </Grid>
        </Grid>
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
