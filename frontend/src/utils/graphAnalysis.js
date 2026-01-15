import dagre from 'dagre';

/**
 * Build the graph structure from defaultRules
 * Returns nodes and edges for React Flow
 */
export function buildGraph(rules, initialState = null) {
  const materialMap = new Map(rules.materials.map(m => [m.id, m]));
  const issues = analyzeIssues(rules, initialState);

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

  // Check if this material is an intermediate not used in its own age
  const ageIssue = issues.intermediateNotUsedInAge?.find(issue => issue.id === materialId);
  if (ageIssue) {
    const usedAgesStr = ageIssue.usedInAges.length > 0
      ? `Used in ages: ${ageIssue.usedInAges.sort((a, b) => a - b).join(', ')}`
      : 'Not used in any age';
    materialIssues.push({
      type: 'notUsedInAge',
      message: `Not used in own age (${ageIssue.age}). ${usedAgesStr}`
    });
  }

  return materialIssues;
}

/**
 * Analyze all inconsistencies in the rules
 */
export function analyzeIssues(rules, initialState = null) {
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

  // Track recipes with zero quantities
  const recipesWithZeroQuantity = [];

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

    // Check for zero quantity inputs or outputs
    const zeroInputs = Object.entries(recipe.inputs)
      .filter(([_, quantity]) => quantity === 0)
      .map(([id]) => id);
    const zeroOutputs = Object.entries(recipe.outputs)
      .filter(([_, quantity]) => quantity === 0)
      .map(([id]) => id);

    if (zeroInputs.length > 0 || zeroOutputs.length > 0) {
      recipesWithZeroQuantity.push({
        recipeId: recipe.id,
        zeroInputs,
        zeroOutputs,
      });
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

  // Find intermediate parts not used in their own age
  const intermediateNotUsedInAge = findIntermediatePartsNotUsedInAge(rules);

  // Find recipes requiring machines from subsequent ages
  const recipeAgeIssues = findRecipeAgeIssues(rules);

  // Find machines with circular production dependencies
  const machineCycleIssues = findMachineCycleIssues(rules, initialState);

  return {
    unusedParts,
    missingMaterials: Array.from(missingMaterials),
    unproduceable,
    recipesMissingMachine,
    noMachineOutputs,
    intermediateNotUsedInAge,
    recipesWithZeroQuantity,
    recipeAgeIssues,
    machineCycleIssues,
  };
}

/**
 * Find intermediate parts that are not used in any recipe for their own age
 */
function findIntermediatePartsNotUsedInAge(rules) {
  const materialMap = new Map(rules.materials.map(m => [m.id, m]));
  const issuesMap = new Map(); // materialId -> { material, usedInAges: Set }

  // Get all intermediate parts
  const intermediateParts = rules.materials.filter(m => m.category === 'intermediate');

  // For each intermediate part, track which ages use it
  intermediateParts.forEach(part => {
    const usedInAges = new Set();

    // Check all recipes that use this part as input
    rules.recipes.forEach(recipe => {
      if (recipe.inputs[part.id] !== undefined) {
        // This recipe uses the part, check the ages of outputs
        Object.keys(recipe.outputs).forEach(outputId => {
          const outputMaterial = materialMap.get(outputId);
          if (outputMaterial && outputMaterial.age !== undefined) {
            usedInAges.add(outputMaterial.age);
          }
        });
      }
    });

    // Check if the part's own age is in the usedInAges set
    if (part.age !== undefined && !usedInAges.has(part.age)) {
      issuesMap.set(part.id, {
        material: part,
        usedInAges: Array.from(usedInAges),
      });
    }
  });

  return Array.from(issuesMap.entries()).map(([id, data]) => ({
    id,
    name: data.material.name,
    age: data.material.age,
    usedInAges: data.usedInAges,
  }));
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

/**
 * Find recipes that require a machine from a subsequent age
 */
function findRecipeAgeIssues(rules) {
  const issues = [];
  const materialMap = new Map(rules.materials.map(m => [m.id, m]));
  const machineAgeMap = new Map();

  // Map machine ID to its material age
  rules.machines.forEach(machine => {
    // Machine ID usually matches the item ID or has an itemId property
    const matId = machine.itemId || machine.id;
    const material = materialMap.get(matId);
    if (material && material.age) {
      machineAgeMap.set(machine.id, material.age);
    } else {
      machineAgeMap.set(machine.id, 1);
    }
  });

  rules.recipes.forEach(recipe => {
    if (!recipe.age) return;

    const capableMachines = rules.machines.filter(m => m.allowedRecipes.includes(recipe.id));
    if (capableMachines.length === 0) return; // Handled by recipesMissingMachine

    // Find the earliest age machine that can process this recipe
    let minMachineAge = Infinity;
    capableMachines.forEach(m => {
      const age = machineAgeMap.get(m.id);
      if (age < minMachineAge) minMachineAge = age;
    });

    if (minMachineAge > recipe.age) {
      issues.push({
        recipeId: recipe.id,
        recipeAge: recipe.age,
        minMachineAge: minMachineAge,
        machines: capableMachines.map(m => m.name || m.id).join(', ')
      });
    }
  });

  return issues;
}

/**
 * Find machines that can only be produced by themselves (circular dependency)
 */
function findMachineCycleIssues(rules, initialState = null) {
  const issues = [];
  const materialMap = new Map(rules.materials.map(m => [m.id, m]));
  const machineAgeMap = new Map();

  // Create set of starter items from initial state
  const starterItems = new Set();
  if (initialState) {
    // Items in inventory
    if (initialState.inventory) {
      Object.keys(initialState.inventory).forEach(key => starterItems.add(key));
    }
    // Items already deployed (machines/generators)
    if (initialState.floorSpace && initialState.floorSpace.placements) {
      initialState.floorSpace.placements.forEach(p => {
        if (p.structureType) starterItems.add(p.structureType);
      });
    }
    // Deployed machines list might be redundant but safe to check
    if (initialState.machines) {
      initialState.machines.forEach(m => starterItems.add(m.type));
    }
  }

  // Map machine ID to its material age
  rules.machines.forEach(machine => {
    const matId = machine.itemId || machine.id;
    const material = materialMap.get(matId);
    if (material && material.age) {
      machineAgeMap.set(machine.id, material.age);
    } else {
      machineAgeMap.set(machine.id, 1);
    }
  });

  // For each machine, find inputs needed to produce it
  rules.machines.forEach(machine => {
    const machineAge = machineAgeMap.get(machine.id);
    const machineItemId = machine.itemId || machine.id;

    // If we start with this machine, the cycle is broken (bootstrapped)
    if (starterItems.has(machineItemId)) return;
    
    // Find recipes that output this machine's item
    const producingRecipes = rules.recipes.filter(r => r.outputs[machineItemId]);

    if (producingRecipes.length === 0) return;

    // Check each input of these recipes
    producingRecipes.forEach(recipe => {
      Object.keys(recipe.inputs).forEach(inputId => {
        // Find how this input is produced
        const inputProducingRecipes = rules.recipes.filter(r => r.outputs[inputId]);
        
        // If the input is raw (no recipes), it's fine
        if (inputProducingRecipes.length === 0) return;

        // Check which machines can run the input-producing recipes
        // We only care about machines that are available at or before the current machine's age
        // because we are looking for bootstrap issues
        const capableMachinesForInput = new Set();
        
        inputProducingRecipes.forEach(r => {
          const machinesForRecipe = rules.machines.filter(m => m.allowedRecipes.includes(r.id));
          machinesForRecipe.forEach(m => {
             const mAge = machineAgeMap.get(m.id);
             // If another machine of equal or lower age can produce it, we are fine
             if (mAge <= machineAge) {
               capableMachinesForInput.add(m.id);
             }
          });
        });

        // If the ONLY capable machine (of relevant age) is the machine itself
        if (capableMachinesForInput.size === 1 && capableMachinesForInput.has(machine.id)) {
          issues.push({
            machineId: machine.id,
            machineName: machine.name,
            partId: inputId,
            partName: materialMap.get(inputId)?.name || inputId
          });
        }
      });
    });
  });

  return issues;
}