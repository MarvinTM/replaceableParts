import { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box } from '@mui/material';
import MaterialNode from './MaterialNode';

const nodeTypes = {
  materialNode: MaterialNode,
};

const categoryColors = {
  raw: '#16a34a',
  intermediate: '#2563eb',
  final: '#ea580c',
  equipment: '#9333ea',
  unknown: '#dc2626',
};

export default function GraphCanvas({
  initialNodes,
  initialEdges,
  highlightedNodes,
  selectedNode,
  onNodeSelect,
  filters,
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView, setCenter } = useReactFlow();

  // Filter and update nodes when data or filters change
  useEffect(() => {
    const filteredNodes = initialNodes
      .filter(node => {
        const category = node.data.category;
        if (!filters.showRaw && category === 'raw') return false;
        if (!filters.showIntermediate && category === 'intermediate') return false;
        if (!filters.showFinal && category === 'final') return false;
        if (!filters.showEquipment && category === 'equipment') return false;
        if (category === 'unknown') return true; // Always show unknown/missing
        return true;
      })
      .filter(node => {
        if (!filters.searchTerm) return true;
        const searchLower = filters.searchTerm.toLowerCase();
        return (
          node.id.toLowerCase().includes(searchLower) ||
          node.data.label.toLowerCase().includes(searchLower)
        );
      })
      .map(node => ({
        ...node,
        selected: node.id === selectedNode,
        style: {
          opacity: highlightedNodes.length === 0 || highlightedNodes.includes(node.id)
            ? 1
            : 0.3,
        },
      }));

    setNodes(filteredNodes);
  }, [initialNodes, filters, highlightedNodes, selectedNode, setNodes]);

  // Filter edges when nodes change
  useEffect(() => {
    const visibleNodeIds = new Set(nodes.map(n => n.id));
    const filteredEdges = initialEdges
      .filter(edge =>
        visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
      )
      .map(edge => ({
        ...edge,
        style: {
          ...edge.style,
          opacity: highlightedNodes.length === 0 ||
            (highlightedNodes.includes(edge.source) && highlightedNodes.includes(edge.target))
            ? 1
            : 0.2,
        },
      }));

    setEdges(filteredEdges);
  }, [initialEdges, nodes, highlightedNodes, setEdges]);

  // Center on selected node
  useEffect(() => {
    if (selectedNode) {
      const node = nodes.find(n => n.id === selectedNode);
      if (node) {
        setCenter(node.position.x + 75, node.position.y + 30, {
          zoom: 1,
          duration: 500,
        });
      }
    }
  }, [selectedNode, nodes, setCenter]);

  const onNodeClick = useCallback(
    (event, node) => {
      onNodeSelect(node.id);
    },
    [onNodeSelect]
  );

  const miniMapNodeColor = useCallback((node) => {
    return categoryColors[node.data.category] || '#666';
  }, []);

  return (
    <Box sx={{
      width: '100%',
      height: '100%',
      bgcolor: '#f8fafc',
      '& .react-flow__controls': {
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      },
      '& .react-flow__controls-button': {
        backgroundColor: '#fff',
        borderColor: '#1976d2',
        color: '#1976d2',
        '&:hover': {
          backgroundColor: '#e3f2fd',
        },
        '& svg': {
          fill: '#1976d2',
        }
      }
    }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
      >
        <Background color="#e2e8f0" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={miniMapNodeColor}
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>
    </Box>
  );
}
