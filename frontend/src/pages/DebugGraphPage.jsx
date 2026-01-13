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
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import GraphCanvas from '../components/debug/GraphCanvas';
import SidePanel from '../components/debug/SidePanel';
import { buildGraph } from '../utils/graphAnalysis';
import { defaultRules } from '../engine/defaultRules';

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
    return buildGraph(defaultRules);
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
    issues.recipesMissingMachine.length;

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
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
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
    </Box>
  );
}
