import { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Paper,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import InfoIcon from '@mui/icons-material/Info';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import {
  getRecipesForMaterial,
  getRecipesUsingMaterial,
  getMachinesForRecipe,
} from '../../utils/graphAnalysis';

export default function SidePanel({
  issues,
  rules,
  selectedNode,
  onHighlightNodes,
  onSelectNode,
  materialsMissingIcons = [],
}) {
  const [expandedSection, setExpandedSection] = useState('issues');

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  const handleIssueClick = (nodeIds) => {
    onHighlightNodes(nodeIds);
    if (nodeIds.length === 1) {
      onSelectNode(nodeIds[0]);
    }
  };

  const handleMachineClick = (machine) => {
    // Find all outputs of recipes this machine can produce
    const outputNodes = [];
    machine.allowedRecipes.forEach(recipeId => {
      const recipe = rules.recipes.find(r => r.id === recipeId);
      if (recipe) {
        Object.keys(recipe.outputs).forEach(outputId => {
          if (!outputNodes.includes(outputId)) {
            outputNodes.push(outputId);
          }
        });
      }
    });
    onHighlightNodes(outputNodes);
  };

  return (
    <Paper
      elevation={2}
      sx={{
        width: 320,
        height: '100%',
        overflow: 'auto',
        borderLeft: '1px solid #e0e0e0',
      }}
    >
      {/* Issues Section */}
      <Accordion
        expanded={expandedSection === 'issues'}
        onChange={handleAccordionChange('issues')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            <Typography fontWeight={600}>Issues</Typography>
            <Chip
              label={
                issues.unusedParts.length +
                issues.missingMaterials.length +
                issues.unproduceable.length +
                issues.recipesMissingMachine.length +
                (issues.intermediateNotUsedInAge?.length || 0) +
                (issues.recipesWithZeroQuantity?.length || 0) +
                (issues.recipeAgeIssues?.length || 0) +
                (issues.machineCycleIssues?.length || 0) +
                materialsMissingIcons.length
              }
              size="small"
              color="warning"
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          {/* Missing Materials */}
          {issues.missingMaterials.length > 0 && (
            <>
              <Typography
                variant="caption"
                sx={{ px: 2, py: 1, display: 'block', bgcolor: '#fef2f2', color: '#7f1d1d', fontWeight: 600 }}
              >
                Missing Materials ({issues.missingMaterials.length})
              </Typography>
              <List dense disablePadding>
                {issues.missingMaterials.map((id) => (
                  <ListItemButton
                    key={id}
                    onClick={() => handleIssueClick([id])}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <ErrorIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={id}
                      secondary="Referenced but not defined"
                    />
                  </ListItemButton>
                ))}
              </List>
            </>
          )}

          {/* Unproduceable */}
          {issues.unproduceable.length > 0 && (
            <>
              <Typography
                variant="caption"
                sx={{ px: 2, py: 1, display: 'block', bgcolor: '#fef2f2', color: '#7f1d1d', fontWeight: 600 }}
              >
                Unproduceable ({issues.unproduceable.length})
              </Typography>
              <List dense disablePadding>
                {issues.unproduceable.map((id) => (
                  <ListItemButton
                    key={id}
                    onClick={() => handleIssueClick([id])}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <ErrorIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={rules.materials.find(m => m.id === id)?.name || id}
                      secondary="No recipe produces this"
                    />
                  </ListItemButton>
                ))}
              </List>
            </>
          )}

          {/* No Machine */}
          {issues.recipesMissingMachine.length > 0 && (
            <>
              <Typography
                variant="caption"
                sx={{ px: 2, py: 1, display: 'block', bgcolor: '#fefce8', color: '#713f12', fontWeight: 600 }}
              >
                No Machine ({issues.recipesMissingMachine.length})
              </Typography>
              <List dense disablePadding>
                {issues.recipesMissingMachine.map((recipeId) => {
                  const recipe = rules.recipes.find(r => r.id === recipeId);
                  const outputIds = recipe ? Object.keys(recipe.outputs) : [];
                  return (
                    <ListItemButton
                      key={recipeId}
                      onClick={() => handleIssueClick(outputIds)}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <WarningIcon fontSize="small" color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={recipeId}
                        secondary="Recipe has no machine"
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            </>
          )}

          {/* Intermediate Not Used in Age */}
          {issues.intermediateNotUsedInAge && issues.intermediateNotUsedInAge.length > 0 && (
            <>
              <Typography
                variant="caption"
                sx={{ px: 2, py: 1, display: 'block', bgcolor: '#fef3c7', color: '#78350f', fontWeight: 600 }}
              >
                Not Used in Own Age ({issues.intermediateNotUsedInAge.length})
              </Typography>
              <List dense disablePadding>
                {issues.intermediateNotUsedInAge.map((issue) => (
                  <ListItemButton
                    key={issue.id}
                    onClick={() => handleIssueClick([issue.id])}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <WarningIcon fontSize="small" color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={issue.name}
                      secondary={
                        issue.usedInAges.length > 0
                          ? `Age ${issue.age}, used in: ${issue.usedInAges.sort((a, b) => a - b).join(', ')}`
                          : `Age ${issue.age}, not used in any age`
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            </>
          )}

          {/* Recipes with Zero Quantity */}
          {issues.recipesWithZeroQuantity && issues.recipesWithZeroQuantity.length > 0 && (
            <>
              <Typography
                variant="caption"
                sx={{ px: 2, py: 1, display: 'block', bgcolor: '#fef3c7', color: '#78350f', fontWeight: 600 }}
              >
                Zero Quantity ({issues.recipesWithZeroQuantity.length})
              </Typography>
              <List dense disablePadding>
                {issues.recipesWithZeroQuantity.map((issue) => {
                  const recipe = rules.recipes.find(r => r.id === issue.recipeId);
                  const outputIds = recipe ? Object.keys(recipe.outputs) : [];
                  return (
                    <ListItemButton
                      key={issue.recipeId}
                      onClick={() => handleIssueClick(outputIds)}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <WarningIcon fontSize="small" color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={issue.recipeId}
                        secondary={
                          (issue.zeroInputs.length > 0 ? `In: ${issue.zeroInputs.join(', ')}` : '') +
                          (issue.zeroInputs.length > 0 && issue.zeroOutputs.length > 0 ? ' | ' : '') +
                          (issue.zeroOutputs.length > 0 ? `Out: ${issue.zeroOutputs.join(', ')}` : '')
                        }
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            </>
          )}

          {/* Recipe Age Issues */}
          {issues.recipeAgeIssues && issues.recipeAgeIssues.length > 0 && (
            <>
              <Typography
                variant="caption"
                sx={{ px: 2, py: 1, display: 'block', bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 600 }}
              >
                Machine Age Mismatch ({issues.recipeAgeIssues.length})
              </Typography>
              <List dense disablePadding>
                {issues.recipeAgeIssues.map((issue) => (
                  <ListItemButton
                    key={issue.recipeId}
                    onClick={() => handleIssueClick([issue.recipeId])}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <ErrorIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={issue.recipeId}
                      secondary={`Recipe Age ${issue.recipeAge} needs Machine Age ${issue.minMachineAge}`}
                    />
                  </ListItemButton>
                ))}
              </List>
            </>
          )}

          {/* Machine Cycle Issues */}
          {issues.machineCycleIssues && issues.machineCycleIssues.length > 0 && (
            <>
              <Typography
                variant="caption"
                sx={{ px: 2, py: 1, display: 'block', bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 600 }}
              >
                Circular Dependency ({issues.machineCycleIssues.length})
              </Typography>
              <List dense disablePadding>
                {issues.machineCycleIssues.map((issue, idx) => (
                  <ListItemButton
                    key={`${issue.machineId}-${issue.partId}-${idx}`}
                    onClick={() => handleIssueClick([issue.partId])}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <ErrorIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={issue.machineName}
                      secondary={`Requires ${issue.partName} (only made by this machine)`}
                    />
                  </ListItemButton>
                ))}
              </List>
            </>
          )}

          {/* Unused Parts */}
          {issues.unusedParts.length > 0 && (
            <>
              <Typography
                variant="caption"
                sx={{ px: 2, py: 1, display: 'block', bgcolor: '#f3f4f6', color: '#1f2937', fontWeight: 600 }}
              >
                Unused Parts ({issues.unusedParts.length})
              </Typography>
              <List dense disablePadding>
                {issues.unusedParts.map((id) => (
                  <ListItemButton
                    key={id}
                    onClick={() => handleIssueClick([id])}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <WarningIcon fontSize="small" sx={{ color: '#9ca3af' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={rules.materials.find(m => m.id === id)?.name || id}
                      secondary="Not used by any recipe"
                    />
                  </ListItemButton>
                ))}
              </List>
            </>
          )}

          {/* Materials Missing Icons */}
          {materialsMissingIcons.length > 0 && (
            <>
              <Typography
                variant="caption"
                sx={{ px: 2, py: 1, display: 'block', bgcolor: '#f0f9ff', color: '#0369a1', fontWeight: 600 }}
              >
                Missing Icons ({materialsMissingIcons.length})
              </Typography>
              <List dense disablePadding>
                {materialsMissingIcons.map(({ id, name }) => (
                  <ListItemButton
                    key={id}
                    onClick={() => handleIssueClick([id])}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <ImageNotSupportedIcon fontSize="small" sx={{ color: '#0284c7' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={name}
                      secondary={`${id}.png`}
                    />
                  </ListItemButton>
                ))}
              </List>
            </>
          )}

          {issues.unusedParts.length === 0 &&
            issues.missingMaterials.length === 0 &&
            issues.unproduceable.length === 0 &&
            issues.recipesMissingMachine.length === 0 &&
            (!issues.intermediateNotUsedInAge || issues.intermediateNotUsedInAge.length === 0) &&
            (!issues.recipesWithZeroQuantity || issues.recipesWithZeroQuantity.length === 0) &&
            (!issues.recipeAgeIssues || issues.recipeAgeIssues.length === 0) &&
            (!issues.machineCycleIssues || issues.machineCycleIssues.length === 0) &&
            materialsMissingIcons.length === 0 && (
              <Typography sx={{ p: 2, color: 'success.main' }}>
                No issues found
              </Typography>
            )}
        </AccordionDetails>
      </Accordion>

      {/* Machines Section */}
      <Accordion
        expanded={expandedSection === 'machines'}
        onChange={handleAccordionChange('machines')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PrecisionManufacturingIcon color="primary" />
            <Typography fontWeight={600}>Machines</Typography>
            <Chip label={rules.machines.length} size="small" color="primary" />
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <List dense disablePadding>
            {rules.machines.map((machine) => (
              <ListItemButton
                key={machine.id}
                onClick={() => handleMachineClick(machine)}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <PrecisionManufacturingIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={machine.name}
                  secondary={`${machine.allowedRecipes.length} recipes`}
                />
              </ListItemButton>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Selected Node Details */}
      <Accordion
        expanded={expandedSection === 'details'}
        onChange={handleAccordionChange('details')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="info" />
            <Typography fontWeight={600}>Details</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {selectedNode ? (
            <NodeDetails
              nodeId={selectedNode}
              rules={rules}
              onSelectNode={onSelectNode}
            />
          ) : (
            <Typography color="text.secondary">
              Click a node to see details
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}

function NodeDetails({ nodeId, rules, onSelectNode }) {
  const material = rules.materials.find(m => m.id === nodeId);
  const producingRecipes = getRecipesForMaterial(nodeId, rules);
  const consumingRecipes = getRecipesUsingMaterial(nodeId, rules);

  if (!material) {
    return (
      <Box>
        <Typography color="error" fontWeight={600}>
          {nodeId}
        </Typography>
        <Typography color="error" variant="body2">
          This material is not defined in defaultRules
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography fontWeight={600}>{material.name}</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {material.category} | Weight: {material.weight} | Price: {material.basePrice}
      </Typography>

      <Divider sx={{ my: 1 }} />

      {/* Producing Recipes */}
      <Typography variant="caption" fontWeight={600}>
        Produced by ({producingRecipes.length}):
      </Typography>
      {producingRecipes.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No recipes produce this
        </Typography>
      ) : (
        <List dense disablePadding>
          {producingRecipes.map((recipe) => {
            const machines = getMachinesForRecipe(recipe.id, rules);
            return (
              <ListItemButton
                key={recipe.id}
                sx={{ py: 0.25 }}
                onClick={() => {
                  const inputIds = Object.keys(recipe.inputs);
                  if (inputIds.length > 0) onSelectNode(inputIds[0]);
                }}
              >
                <ListItemText
                  primary={recipe.id}
                  secondary={
                    machines.length > 0
                      ? machines.map(m => m.name).join(', ')
                      : 'No machine'
                  }
                  secondaryTypographyProps={{
                    color: machines.length === 0 ? 'error' : 'text.secondary',
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      )}

      <Divider sx={{ my: 1 }} />

      {/* Consuming Recipes */}
      <Typography variant="caption" fontWeight={600}>
        Used by ({consumingRecipes.length}):
      </Typography>
      {consumingRecipes.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Not used by any recipe
        </Typography>
      ) : (
        <List dense disablePadding>
          {consumingRecipes.map((recipe) => {
            const outputIds = Object.keys(recipe.outputs);
            return (
              <ListItemButton
                key={recipe.id}
                sx={{ py: 0.25 }}
                onClick={() => {
                  if (outputIds.length > 0) onSelectNode(outputIds[0]);
                }}
              >
                <ListItemText
                  primary={recipe.id}
                  secondary={`Produces: ${outputIds.join(', ')}`}
                />
              </ListItemButton>
            );
          })}
        </List>
      )}
    </Box>
  );
}
