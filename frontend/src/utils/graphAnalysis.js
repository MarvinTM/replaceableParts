import dagre from 'dagre';

/**
 * Build the graph structure from defaultRules
 * Returns nodes and edges for React Flow
 */
export function buildGraph(rules) {
  const materialMap = new Map(rules.materials.map(m => [m.id, m]));
  const issues = analyzeIssues(rules);

  // Get extractable resources from exploration config
  const extractableResources = getExtractableResources(rules);

  // Determine tier for each material based on recipes
  const materialTiers = calculateMaterialTiers(rules);

  // Create nodes from materials
  const nodes = rules.materials.map(material => ({
    id: material.id,
    type: 'materialNode',
    data: {
      label: material.name,
      material,
      category: material.category,
      tier: materialTiers.get(material.id) || 0,
      isExtractable: extractableResources.has(material.id),
      issues: getIssuesForMaterial(material.id, issues),
    },
    position: { x: 0, y: 0 }, // Will be set by layout
  }));

  // Add nodes for materials referenced in recipes but not defined
  issues.missingMaterials.forEach(matId => {
    nodes.push({
      id: matId,
      type: 'materialNode',
      data: {
        label: matId,
        material: { id: matId, name: matId, category: 'unknown' },
        category: 'unknown',
        tier: 0,
        isExtractable: false,
        issues: [{ type: 'missing', message: 'Material not defined' }],
      },
      position: { x: 0, y: 0 },
    });
  });

  // Create edges from recipes
  const edges = [];
  rules.recipes.forEach(recipe => {
    const outputIds = Object.keys(recipe.outputs);
    const inputIds = Object.keys(recipe.inputs);

    // Create edge from each input to each output
    inputIds.forEach(inputId => {
      outputIds.forEach(outputId => {
        edges.push({
          id: `${recipe.id}-${inputId}-${outputId}`,
          source: inputId,
          target: outputId,
          data: {
            recipe,
            inputQuantity: recipe.inputs[inputId],
            outputQuantity: recipe.outputs[outputId],
          },
          label: recipe.id,
          animated: false,
          style: { stroke: '#888' },
        });
      });
    });
  });

  // Apply hierarchical layout
  const layoutedElements = applyDagreLayout(nodes, edges);

  return {
    nodes: layoutedElements.nodes,
    edges: layoutedElements.edges,
    issues,
  };
}

/**
 * Calculate material tiers based on recipe dependencies
 */
function calculateMaterialTiers(rules) {
  const tiers = new Map();
  const recipesByOutput = new Map();

  // Map outputs to their recipes
  rules.recipes.forEach(recipe => {
    Object.keys(recipe.outputs).forEach(outputId => {
      if (!recipesByOutput.has(outputId)) {
        recipesByOutput.set(outputId, []);
      }
      recipesByOutput.get(outputId).push(recipe);
    });
  });

  // Raw materials are tier 0
  rules.materials.forEach(m => {
    if (m.category === 'raw') {
      tiers.set(m.id, 0);
    }
  });

  // Calculate tiers iteratively
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 10) {
    changed = false;
    iterations++;

    rules.recipes.forEach(recipe => {
      const inputTiers = Object.keys(recipe.inputs)
        .map(id => tiers.get(id) ?? -1)
        .filter(t => t >= 0);

      if (inputTiers.length === Object.keys(recipe.inputs).length) {
        const maxInputTier = Math.max(...inputTiers, 0);
        const outputTier = maxInputTier + 1;

        Object.keys(recipe.outputs).forEach(outputId => {
          const currentTier = tiers.get(outputId);
          if (currentTier === undefined || outputTier < currentTier) {
            tiers.set(outputId, outputTier);
            changed = true;
          }
        });
      }
    });
  }

  return tiers;
}

/**
 * Get extractable resources from exploration config
 */
function getExtractableResources(rules) {
  const extractable = new Set();

  if (rules.exploration?.resourceAffinities) {
    Object.values(rules.exploration.resourceAffinities).forEach(affinities => {
      Object.keys(affinities).forEach(resourceId => {
        extractable.add(resourceId);
      });
    });
  }

  return extractable;
}

/**
 * Get issues for a specific material
 */
function getIssuesForMaterial(materialId, issues) {
  const materialIssues = [];

  if (issues.unusedParts.includes(materialId)) {
    materialIssues.push({ type: 'unused', message: 'Not used by any recipe' });
  }
  if (issues.unproduceable.includes(materialId)) {
    materialIssues.push({ type: 'unproduceable', message: 'Cannot be produced (no recipe)' });
  }
  if (issues.noMachineOutputs.includes(materialId)) {
    materialIssues.push({ type: 'noMachine', message: 'No machine can produce this' });
  }

  return materialIssues;
}

/**
 * Analyze all inconsistencies in the rules
 */
export function analyzeIssues(rules) {
  const materialIds = new Set(rules.materials.map(m => m.id));
  const usedAsInput = new Set();
  const producedByRecipe = new Set();
  const recipesMissingMachine = [];
  const missingMaterials = new Set();

  // Get extractable resources
  const extractableResources = getExtractableResources(rules);

  // Get all recipes that have a machine
  const recipesWithMachine = new Set();
  rules.machines.forEach(machine => {
    machine.allowedRecipes.forEach(recipeId => {
      recipesWithMachine.add(recipeId);
    });
  });

  // Analyze recipes
  rules.recipes.forEach(recipe => {
    // Track what's used as input
    Object.keys(recipe.inputs).forEach(inputId => {
      usedAsInput.add(inputId);
      if (!materialIds.has(inputId)) {
        missingMaterials.add(inputId);
      }
    });

    // Track what's produced
    Object.keys(recipe.outputs).forEach(outputId => {
      producedByRecipe.add(outputId);
      if (!materialIds.has(outputId)) {
        missingMaterials.add(outputId);
      }
    });

    // Check if recipe has a machine
    if (!recipesWithMachine.has(recipe.id)) {
      recipesMissingMachine.push(recipe.id);
    }
  });

  // Find unused parts (not used as input, not final/equipment)
  const unusedParts = rules.materials
    .filter(m =>
      !usedAsInput.has(m.id) &&
      m.category !== 'final' &&
      m.category !== 'equipment'
    )
    .map(m => m.id);

  // Find unproduceable (non-raw, non-extractable, not produced by any recipe)
  const unproduceable = rules.materials
    .filter(m =>
      m.category !== 'raw' &&
      !extractableResources.has(m.id) &&
      !producedByRecipe.has(m.id)
    )
    .map(m => m.id);

  // Find outputs from recipes that have no machine
  const noMachineOutputs = [];
  rules.recipes
    .filter(r => recipesMissingMachine.includes(r.id))
    .forEach(recipe => {
      Object.keys(recipe.outputs).forEach(outputId => {
        if (!noMachineOutputs.includes(outputId)) {
          noMachineOutputs.push(outputId);
        }
      });
    });

  return {
    unusedParts,
    missingMaterials: Array.from(missingMaterials),
    unproduceable,
    recipesMissingMachine,
    noMachineOutputs,
  };
}

/**
 * Apply dagre layout for hierarchical positioning
 */
function applyDagreLayout(nodes, edges) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: 'TB',
    nodesep: 80,
    ranksep: 100,
    marginx: 50,
    marginy: 50,
  });

  const nodeWidth = 150;
  const nodeHeight = 60;

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

/**
 * Get recipes that produce a given material
 */
export function getRecipesForMaterial(materialId, rules) {
  return rules.recipes.filter(recipe =>
    Object.keys(recipe.outputs).includes(materialId)
  );
}

/**
 * Get recipes that use a given material as input
 */
export function getRecipesUsingMaterial(materialId, rules) {
  return rules.recipes.filter(recipe =>
    Object.keys(recipe.inputs).includes(materialId)
  );
}

/**
 * Get machines that can produce a given recipe
 */
export function getMachinesForRecipe(recipeId, rules) {
  return rules.machines.filter(machine =>
    machine.allowedRecipes.includes(recipeId)
  );
}
