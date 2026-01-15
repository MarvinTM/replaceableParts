import { useState, useMemo } from 'react';
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
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import GraphCanvas from '../components/debug/GraphCanvas';
import SidePanel from '../components/debug/SidePanel';
import { buildGraph } from '../utils/graphAnalysis';
import { defaultRules } from '../engine/defaultRules';
import { initialState } from '../engine/initialState';

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

  // Build graph from rules
  const { nodes, edges, issues } = useMemo(() => {
    return buildGraph(defaultRules, initialState);
  }, [refreshKey]);

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
    (issues.machineCycleIssues?.length || 0);

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

    if (totalIssues === 0) {
      log += 'No issues found!\n';
    }

    return log;
  };

  const handleCopyLog = () => {
    const log = generateIssuesLog();
    navigator.clipboard.writeText(log);
  };

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
        />
      </Box>

      {/* Issues Text Log */}
      <Paper
        elevation={3}
        sx={{
          borderTop: '2px solid #e0e0e0',
          height: '200px',
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
            py: 1,
            borderBottom: '1px solid #e0e0e0',
            bgcolor: '#1976d2',
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#fff' }}>
            Issues Log (Copy for AI Processing)
          </Typography>
          <Button
            size="small"
            startIcon={<ContentCopyIcon />}
            onClick={handleCopyLog}
            variant="contained"
            sx={{ bgcolor: '#fff', color: '#1976d2', '&:hover': { bgcolor: '#f0f0f0' } }}
          >
            Copy All
          </Button>
        </Box>
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
      </Paper>
    </Box>
  );
}
