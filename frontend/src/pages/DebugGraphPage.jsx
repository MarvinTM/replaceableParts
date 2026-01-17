import { useState, useMemo, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  IconButton,
  Tooltip,
  Chip,
  Paper,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import GraphCanvas from '../components/debug/GraphCanvas';
import SidePanel from '../components/debug/SidePanel';
import { buildGraph, calculateRawMaterialUsage, calculateRawMaterialCosts, calculateEnergyCosts } from '../utils/graphAnalysis';
import { defaultRules } from '../engine/defaultRules';
import { initialState } from '../engine/initialState';
import { findMaterialsMissingIcons } from '../services/iconService';

export default function DebugGraphPage() {
  const [filters, setFilters] = useState({
    showRaw: true,
    showIntermediate: true,
    showFinal: true,
    showEquipment: true,
    searchTerm: '',
  });

  const [selectedNode, setSelectedNode] = useState(null);
  const [highlightedNodes, setHighlightedNodes] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [bottomTab, setBottomTab] = useState(0);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });
  const [materialsMissingIcons, setMaterialsMissingIcons] = useState([]);

  // Build graph from rules
  const { nodes, edges, issues } = useMemo(() => {
    return buildGraph(defaultRules, initialState);
  }, [refreshKey]);

  // Calculate balance metrics
  const balanceMetrics = useMemo(() => ({
    rawUsage: calculateRawMaterialUsage(defaultRules),
    rawCosts: calculateRawMaterialCosts(defaultRules),
    energyCosts: calculateEnergyCosts(defaultRules),
  }), [refreshKey]);

  // Check for materials missing icons
  useEffect(() => {
    findMaterialsMissingIcons(defaultRules.materials).then(setMaterialsMissingIcons);
  }, [refreshKey]);

  // Get list of all raw material IDs for column headers
  const rawMaterialIds = useMemo(() => {
    return defaultRules.materials
      .filter(m => m.category === 'raw')
      .map(m => m.id);
  }, []);

  const handleFilterChange = (key) => (event) => {
    setFilters(prev => ({
      ...prev,
      [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
    }));
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setSelectedNode(null);
    setHighlightedNodes([]);
  };

  const handleHighlightNodes = (nodeIds) => {
    setHighlightedNodes(nodeIds);
  };

  const handleSelectNode = (nodeId) => {
    setSelectedNode(nodeId);
    setHighlightedNodes([]);
  };

  const totalIssues =
    issues.unusedParts.length +
    issues.missingMaterials.length +
    issues.unproduceable.length +
    issues.recipesMissingMachine.length +
    (issues.intermediateNotUsedInAge?.length || 0) +
    (issues.recipesWithZeroQuantity?.length || 0) +
    (issues.recipeAgeIssues?.length || 0) +
    (issues.machineCycleIssues?.length || 0) +
    materialsMissingIcons.length;

  // Generate issues text log
  const generateIssuesLog = () => {
    let log = '=== Recipe Graph Issues ===\n\n';

    if (issues.missingMaterials.length > 0) {
      log += `Missing Materials (${issues.missingMaterials.length}):\n`;
      issues.missingMaterials.forEach(id => {
        log += `  - ${id} (Referenced but not defined)\n`;
      });
      log += '\n';
    }

    if (issues.unproduceable.length > 0) {
      log += `Unproduceable (${issues.unproduceable.length}):\n`;
      issues.unproduceable.forEach(id => {
        const material = defaultRules.materials.find(m => m.id === id);
        log += `  - ${material?.name || id} (No recipe produces this)\n`;
      });
      log += '\n';
    }

    if (issues.recipesMissingMachine.length > 0) {
      log += `Recipes Missing Machine (${issues.recipesMissingMachine.length}):\n`;
      issues.recipesMissingMachine.forEach(recipeId => {
        log += `  - ${recipeId} (Recipe has no machine)\n`;
      });
      log += '\n';
    }

    if (issues.intermediateNotUsedInAge && issues.intermediateNotUsedInAge.length > 0) {
      log += `Intermediate Parts Not Used in Their Age (${issues.intermediateNotUsedInAge.length}):\n`;
      issues.intermediateNotUsedInAge.forEach(issue => {
        const usedAgesStr = issue.usedInAges.length > 0
          ? `Used in ages: ${issue.usedInAges.sort((a, b) => a - b).join(', ')}`
          : 'Not used in any age';
        log += `  - ${issue.name} (Age ${issue.age}) - ${usedAgesStr}\n`;
      });
      log += '\n';
    }

    if (issues.recipesWithZeroQuantity && issues.recipesWithZeroQuantity.length > 0) {
      log += `Recipes with Zero Quantity (${issues.recipesWithZeroQuantity.length}):\n`;
      issues.recipesWithZeroQuantity.forEach(issue => {
        const parts = [];
        if (issue.zeroInputs.length > 0) {
          parts.push(`Inputs: ${issue.zeroInputs.join(', ')}`);
        }
        if (issue.zeroOutputs.length > 0) {
          parts.push(`Outputs: ${issue.zeroOutputs.join(', ')}`);
        }
        log += `  - ${issue.recipeId} (${parts.join(' | ')})\n`;
      });
      log += '\n';
    }

    if (issues.recipeAgeIssues && issues.recipeAgeIssues.length > 0) {
      log += `Machine Age Mismatch (${issues.recipeAgeIssues.length}):\n`;
      issues.recipeAgeIssues.forEach(issue => {
        log += `  - ${issue.recipeId} (Age ${issue.recipeAge}): Needs Machine Age ${issue.minMachineAge} (${issue.machines})\n`;
      });
      log += '\n';
    }

    if (issues.machineCycleIssues && issues.machineCycleIssues.length > 0) {
      log += `Circular Dependency (${issues.machineCycleIssues.length}):\n`;
      issues.machineCycleIssues.forEach(issue => {
        log += `  - ${issue.machineName} requires ${issue.partName} (only produced by this machine)\n`;
      });
      log += '\n';
    }

    if (issues.unusedParts.length > 0) {
      log += `Unused Parts (${issues.unusedParts.length}):\n`;
      issues.unusedParts.forEach(id => {
        const material = defaultRules.materials.find(m => m.id === id);
        log += `  - ${material?.name || id} (Not used by any recipe)\n`;
      });
      log += '\n';
    }

    if (materialsMissingIcons.length > 0) {
      log += `Materials Missing Icons (${materialsMissingIcons.length}):\n`;
      materialsMissingIcons.forEach(({ id, name }) => {
        log += `  - ${name} (${id}.png)\n`;
      });
      log += '\n';
    }

    if (totalIssues === 0) {
      log += 'No issues found!\n';
    }

    return log;
  };

  const handleCopyLog = () => {
    const log = generateIssuesLog();
    navigator.clipboard.writeText(log);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  // Prepare sorted data for Raw Material Usage table
  const rawUsageData = useMemo(() => {
    const data = Array.from(balanceMetrics.rawUsage.entries()).map(([id, info]) => ({
      id,
      ...info,
    }));
    if (sortConfig.key) {
      data.sort((a, b) => {
        const aVal = a[sortConfig.key] ?? 0;
        const bVal = b[sortConfig.key] ?? 0;
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      });
    } else {
      data.sort((a, b) => b.totalDependentMaterials - a.totalDependentMaterials);
    }
    return data;
  }, [balanceMetrics.rawUsage, sortConfig]);

  // Prepare sorted data for Final Good Costs table
  const finalGoodCostsData = useMemo(() => {
    const data = Array.from(balanceMetrics.rawCosts.entries()).map(([id, info]) => {
      const energyInfo = balanceMetrics.energyCosts.get(id) || { totalEnergy: 0, directEnergy: 0 };
      const totalRawUnits = Object.values(info.rawMaterials).reduce((sum, qty) => sum + qty, 0);
      return {
        id,
        ...info,
        totalEnergy: energyInfo.totalEnergy,
        directEnergy: energyInfo.directEnergy,
        totalRawUnits,
      };
    });
    if (sortConfig.key) {
      data.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        // Handle raw material columns
        if (sortConfig.key.startsWith('raw_')) {
          const rawId = sortConfig.key.replace('raw_', '');
          aVal = a.rawMaterials[rawId] ?? 0;
          bVal = b.rawMaterials[rawId] ?? 0;
        }
        if (typeof aVal === 'string') {
          return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return sortConfig.direction === 'asc' ? (aVal ?? 0) - (bVal ?? 0) : (bVal ?? 0) - (aVal ?? 0);
      });
    } else {
      data.sort((a, b) => a.age - b.age || a.name.localeCompare(b.name));
    }
    return data;
  }, [balanceMetrics.rawCosts, balanceMetrics.energyCosts, sortConfig]);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense" sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Recipe Graph Debug
          </Typography>

          <Chip
            label={`${defaultRules.materials.length} materials`}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Chip
            label={`${defaultRules.recipes.length} recipes`}
            size="small"
            color="secondary"
            variant="outlined"
          />
          {totalIssues > 0 && (
            <Chip
              label={`${totalIssues} issues`}
              size="small"
              color="warning"
            />
          )}

          <Box sx={{ flexGrow: 1 }} />

          <TextField
            size="small"
            placeholder="Search materials..."
            value={filters.searchTerm}
            onChange={handleFilterChange('searchTerm')}
            sx={{ width: 200 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={filters.showRaw}
                onChange={handleFilterChange('showRaw')}
                size="small"
              />
            }
            label={<Typography variant="body2" sx={{ color: '#16a34a' }}>Raw</Typography>}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.showIntermediate}
                onChange={handleFilterChange('showIntermediate')}
                size="small"
              />
            }
            label={<Typography variant="body2" sx={{ color: '#2563eb' }}>Intermediate</Typography>}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.showFinal}
                onChange={handleFilterChange('showFinal')}
                size="small"
              />
            }
            label={<Typography variant="body2" sx={{ color: '#ea580c' }}>Final</Typography>}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.showEquipment}
                onChange={handleFilterChange('showEquipment')}
                size="small"
              />
            }
            label={<Typography variant="body2" sx={{ color: '#9333ea' }}>Equipment</Typography>}
          />

          <Tooltip title="Refresh graph">
            <IconButton onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Graph Area */}
        <Box sx={{ flexGrow: 1, height: '100%' }}>
          <ReactFlowProvider>
            <GraphCanvas
              initialNodes={nodes}
              initialEdges={edges}
              highlightedNodes={highlightedNodes}
              selectedNode={selectedNode}
              onNodeSelect={handleSelectNode}
              filters={filters}
            />
          </ReactFlowProvider>
        </Box>

        {/* Side Panel */}
        <SidePanel
          issues={issues}
          rules={defaultRules}
          selectedNode={selectedNode}
          onHighlightNodes={handleHighlightNodes}
          onSelectNode={handleSelectNode}
          materialsMissingIcons={materialsMissingIcons}
        />
      </Box>

      {/* Bottom Panel with Tabs */}
      <Paper
        elevation={3}
        sx={{
          borderTop: '2px solid #e0e0e0',
          height: '250px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            borderBottom: '1px solid #e0e0e0',
            bgcolor: '#1976d2',
          }}
        >
          <Tabs
            value={bottomTab}
            onChange={(e, v) => { setBottomTab(v); setSortConfig({ key: null, direction: 'desc' }); }}
            sx={{
              minHeight: 40,
              '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)', minHeight: 40, py: 0 },
              '& .Mui-selected': { color: '#fff' },
              '& .MuiTabs-indicator': { bgcolor: '#fff' },
            }}
          >
            <Tab label="Issues Log" />
            <Tab label="Raw Material Usage" />
            <Tab label="Final Good Costs" />
          </Tabs>
          {bottomTab === 0 && (
            <Button
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyLog}
              variant="contained"
              sx={{ bgcolor: '#fff', color: '#1976d2', '&:hover': { bgcolor: '#f0f0f0' } }}
            >
              Copy All
            </Button>
          )}
        </Box>

        {/* Tab 0: Issues Log */}
        {bottomTab === 0 && (
          <Box
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              p: 2,
              bgcolor: '#fafafa',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap',
              color: '#000',
            }}
          >
            {generateIssuesLog()}
          </Box>
        )}

        {/* Tab 1: Raw Material Usage */}
        {bottomTab === 1 && (
          <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortConfig.key === 'name'}
                      direction={sortConfig.key === 'name' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort('name')}
                    >
                      Raw Material
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortConfig.key === 'directRecipeCount'}
                      direction={sortConfig.key === 'directRecipeCount' ? sortConfig.direction : 'desc'}
                      onClick={() => handleSort('directRecipeCount')}
                    >
                      Direct Recipes
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortConfig.key === 'totalDependentMaterials'}
                      direction={sortConfig.key === 'totalDependentMaterials' ? sortConfig.direction : 'desc'}
                      onClick={() => handleSort('totalDependentMaterials')}
                    >
                      Total Dependent Items
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rawUsageData.map(row => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.name}</TableCell>
                    <TableCell align="right">{row.directRecipeCount}</TableCell>
                    <TableCell align="right">{row.totalDependentMaterials}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Tab 2: Final Good Costs */}
        {bottomTab === 2 && (
          <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortConfig.key === 'name'}
                      direction={sortConfig.key === 'name' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort('name')}
                    >
                      Final Good
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortConfig.key === 'age'}
                      direction={sortConfig.key === 'age' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort('age')}
                    >
                      Age
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortConfig.key === 'totalEnergy'}
                      direction={sortConfig.key === 'totalEnergy' ? sortConfig.direction : 'desc'}
                      onClick={() => handleSort('totalEnergy')}
                    >
                      Total Energy
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortConfig.key === 'totalRawUnits'}
                      direction={sortConfig.key === 'totalRawUnits' ? sortConfig.direction : 'desc'}
                      onClick={() => handleSort('totalRawUnits')}
                    >
                      Total Raw Units
                    </TableSortLabel>
                  </TableCell>
                  {rawMaterialIds.map(rawId => {
                    const rawMat = defaultRules.materials.find(m => m.id === rawId);
                    return (
                      <TableCell key={rawId} align="right" sx={{ minWidth: 80 }}>
                        <TableSortLabel
                          active={sortConfig.key === `raw_${rawId}`}
                          direction={sortConfig.key === `raw_${rawId}` ? sortConfig.direction : 'desc'}
                          onClick={() => handleSort(`raw_${rawId}`)}
                        >
                          {rawMat?.name || rawId}
                        </TableSortLabel>
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {finalGoodCostsData.map(row => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.name}</TableCell>
                    <TableCell align="right">{row.age}</TableCell>
                    <TableCell align="right">{row.totalEnergy.toFixed(1)}</TableCell>
                    <TableCell align="right">{row.totalRawUnits.toFixed(1)}</TableCell>
                    {rawMaterialIds.map(rawId => (
                      <TableCell key={rawId} align="right">
                        {row.rawMaterials[rawId] ? row.rawMaterials[rawId].toFixed(2) : '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
