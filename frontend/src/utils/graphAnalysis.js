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
  const recipeIds = new Set(rules.recipes.map(r => r.id));
  const usedAsInput = new Set();
  const producedByRecipe = new Set();
  const recipesMissingMachine = [];
  const missingMaterials = new Set();

  // Get extractable resources
  const extractableResources = getExtractableResources(rules);

  // Get all recipes that have a machine, and check for invalid recipe references
  const recipesWithMachine = new Set();
  const invalidAllowedRecipes = [];
  rules.machines.forEach(machine => {
    machine.allowedRecipes.forEach(recipeId => {
      recipesWithMachine.add(recipeId);
      // Check if this recipe ID actually exists
      if (!recipeIds.has(recipeId)) {
        invalidAllowedRecipes.push({
          machineId: machine.id,
          machineName: machine.name,
          recipeId: recipeId
        });
      }
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
    invalidAllowedRecipes,
  };
}

/**
 * Calculate how many recipes/materials depend on each raw material
 * Returns a Map of rawMaterialId -> { directRecipeCount, totalDependentMaterials, dependentMaterials[] }
 */
export function calculateRawMaterialUsage(rules) {
  // Build forward dependency map: material -> materials that are produced using it
  const usedBy = new Map();

  rules.recipes.forEach(recipe => {
    Object.keys(recipe.inputs).forEach(inputId => {
      Object.keys(recipe.outputs).forEach(outputId => {
        if (!usedBy.has(inputId)) usedBy.set(inputId, new Set());
        usedBy.get(inputId).add(outputId);
      });
    });
  });

  const rawMaterials = rules.materials.filter(m => m.category === 'raw');
  const result = new Map();

  rawMaterials.forEach(raw => {
    // Count direct recipes (recipes that directly use this raw material as input)
    const directRecipeCount = rules.recipes.filter(r => r.inputs[raw.id] !== undefined).length;

    // BFS to find all materials that transitively depend on this raw material
    const visited = new Set();
    const queue = [raw.id];

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);

      const dependents = usedBy.get(current) || new Set();
      dependents.forEach(dep => {
        if (!visited.has(dep)) queue.push(dep);
      });
    }

    visited.delete(raw.id); // Don't count itself

    result.set(raw.id, {
      name: raw.name,
      directRecipeCount,
      totalDependentMaterials: visited.size,
      dependentMaterials: Array.from(visited),
    });
  });

  return result;
}

/**
 * Calculate total raw material costs for each final good
 * Returns a Map of finalGoodId -> { name, age, rawMaterials: { rawId: quantity } }
 */
export function calculateRawMaterialCosts(rules) {
  const materialMap = new Map(rules.materials.map(m => [m.id, m]));
  const recipesByOutput = new Map();

  // Build recipe lookup by output (assuming one recipe per output)
  rules.recipes.forEach(recipe => {
    Object.keys(recipe.outputs).forEach(outputId => {
      recipesByOutput.set(outputId, recipe);
    });
  });

  // Memoization cache for raw costs
  const rawCostCache = new Map();

  function getRawCosts(materialId, visited = new Set()) {
    // Handle circular dependencies
    if (visited.has(materialId)) {
      return new Map();
    }

    // Return cached result
    if (rawCostCache.has(materialId)) {
      return new Map(rawCostCache.get(materialId));
    }

    const material = materialMap.get(materialId);
    const costs = new Map();

    // If raw material, return itself with quantity 1
    if (material?.category === 'raw') {
      costs.set(materialId, 1);
      rawCostCache.set(materialId, costs);
      return new Map(costs);
    }

    // Find recipe that produces this material
    const recipe = recipesByOutput.get(materialId);
    if (!recipe) {
      rawCostCache.set(materialId, costs);
      return costs;
    }

    // Get output quantity
    const outputQuantity = recipe.outputs[materialId];

    // Mark as visiting to detect cycles
    visited.add(materialId);

    // Recursively calculate raw costs for each input
    Object.entries(recipe.inputs).forEach(([inputId, inputQty]) => {
      const inputRawCosts = getRawCosts(inputId, new Set(visited));
      inputRawCosts.forEach((rawQty, rawId) => {
        // Scale by input quantity needed, divide by output quantity
        const scaledCost = (rawQty * inputQty) / outputQuantity;
        costs.set(rawId, (costs.get(rawId) || 0) + scaledCost);
      });
    });

    rawCostCache.set(materialId, new Map(costs));
    return costs;
  }

  // Calculate for all final goods
  const finalGoods = rules.materials.filter(m => m.category === 'final');
  const results = new Map();

  finalGoods.forEach(finalGood => {
    const rawCosts = getRawCosts(finalGood.id);
    results.set(finalGood.id, {
      name: finalGood.name,
      age: finalGood.age,
      rawMaterials: Object.fromEntries(rawCosts),
    });
  });

  return results;
}

/**
 * Calculate total energy costs for each final good
 * Energy is defined at the machine level. This function calculates the total energy
 * by summing the energy consumption of machines needed to produce each recipe,
 * including all intermediate recipes in cascade.
 * Returns a Map of finalGoodId -> { name, age, totalEnergy, directEnergy }
 */
export function calculateEnergyCosts(rules) {
  const materialMap = new Map(rules.materials.map(m => [m.id, m]));
  const recipesByOutput = new Map();

  // Build recipe lookup by output
  rules.recipes.forEach(recipe => {
    Object.keys(recipe.outputs).forEach(outputId => {
      recipesByOutput.set(outputId, recipe);
    });
  });

  // Build machine lookup by recipe - get the minimum energy machine for each recipe
  const machineEnergyByRecipe = new Map();
  rules.machines.forEach(machine => {
    const energy = machine.energyConsumption || 0;
    machine.allowedRecipes.forEach(recipeId => {
      const currentEnergy = machineEnergyByRecipe.get(recipeId);
      // Use the minimum energy machine if multiple machines can produce the same recipe
      if (currentEnergy === undefined || energy < currentEnergy) {
        machineEnergyByRecipe.set(recipeId, energy);
      }
    });
  });

  // Memoization cache for energy costs
  const energyCostCache = new Map();

  function getEnergyCost(materialId, visited = new Set()) {
    // Handle circular dependencies
    if (visited.has(materialId)) {
      return 0;
    }

    // Return cached result
    if (energyCostCache.has(materialId)) {
      return energyCostCache.get(materialId);
    }

    const material = materialMap.get(materialId);

    // Raw materials don't require energy to produce
    if (material?.category === 'raw') {
      energyCostCache.set(materialId, 0);
      return 0;
    }

    // Find recipe that produces this material
    const recipe = recipesByOutput.get(materialId);
    if (!recipe) {
      energyCostCache.set(materialId, 0);
      return 0;
    }

    // Get output quantity
    const outputQuantity = recipe.outputs[materialId];

    // Mark as visiting to detect cycles
    visited.add(materialId);

    // Get energy for the machine that runs this recipe
    const machineEnergy = machineEnergyByRecipe.get(recipe.id) || 0;

    // Energy cost per unit produced = machine energy / output quantity
    let totalEnergy = machineEnergy / outputQuantity;

    // Add energy costs for each input material (scaled by input quantity)
    Object.entries(recipe.inputs).forEach(([inputId, inputQty]) => {
      const inputEnergy = getEnergyCost(inputId, new Set(visited));
      // Scale by input quantity needed, divide by output quantity
      totalEnergy += (inputEnergy * inputQty) / outputQuantity;
    });

    energyCostCache.set(materialId, totalEnergy);
    return totalEnergy;
  }

  // Calculate for all final goods
  const finalGoods = rules.materials.filter(m => m.category === 'final');
  const results = new Map();

  finalGoods.forEach(finalGood => {
    const recipe = recipesByOutput.get(finalGood.id);
    const directEnergy = recipe ? (machineEnergyByRecipe.get(recipe.id) || 0) / (recipe.outputs[finalGood.id] || 1) : 0;
    const totalEnergy = getEnergyCost(finalGood.id);

    results.set(finalGood.id, {
      name: finalGood.name,
      age: finalGood.age,
      totalEnergy,
      directEnergy,
    });
  });

  return results;
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
 * Find machines with circular production dependencies.
 * This detects:
 * 1. Direct self-dependencies: machine's recipe can only be run by itself
 * 2. Longer cycles: A requires B, B requires C, C requires A
 *
 * A machine "requires" another if, to manufacture it, the only machines capable
 * of running the necessary recipe(s) include that other machine.
 */
function findMachineCycleIssues(rules, initialState = null) {
  const materialMap = new Map(rules.materials.map(m => [m.id, m]));
  const machineMap = new Map(rules.machines.map(m => [m.id, m]));
  const machineAgeMap = new Map();

  // Create set of starter machines from initial state (bootstrapped machines)
  const starterMachines = new Set();
  if (initialState) {
    // Items in inventory
    if (initialState.inventory) {
      Object.keys(initialState.inventory).forEach(key => starterMachines.add(key));
    }
    // Items already deployed (machines/generators)
    if (initialState.floorSpace && initialState.floorSpace.placements) {
      initialState.floorSpace.placements.forEach(p => {
        if (p.structureType) starterMachines.add(p.structureType);
      });
    }
    // Deployed machines list
    if (initialState.machines) {
      initialState.machines.forEach(m => starterMachines.add(m.type));
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

  // Build dependency graph: machine -> set of machines it depends on
  // A machine M depends on machine N if N is required to produce M
  const dependencies = new Map(); // machineId -> Set of machineIds it depends on
  const dependencyReasons = new Map(); // "machineId->depId" -> reason string

  rules.machines.forEach(machine => {
    const machineAge = machineAgeMap.get(machine.id);
    const machineItemId = machine.itemId || machine.id;
    const deps = new Set();
    dependencies.set(machine.id, deps);

    // If bootstrapped, no dependencies matter
    if (starterMachines.has(machineItemId)) return;

    // Find recipes that output this machine's item
    const producingRecipes = rules.recipes.filter(r => r.outputs[machineItemId]);
    if (producingRecipes.length === 0) return;

    // Check 1: Which machines can RUN the recipe that produces this machine?
    const machinesThatCanProduceThis = new Set();
    producingRecipes.forEach(recipe => {
      rules.machines.forEach(m => {
        if (m.allowedRecipes.includes(recipe.id)) {
          const mAge = machineAgeMap.get(m.id);
          if (mAge <= machineAge) {
            machinesThatCanProduceThis.add(m.id);
          }
        }
      });
    });

    // If only specific machines can produce this, we depend on them
    if (machinesThatCanProduceThis.size > 0) {
      // We depend on ALL of these machines (need at least one)
      // But for cycle detection, if the ONLY option includes ourselves, that's a problem
      // We track all required machines
      machinesThatCanProduceThis.forEach(mId => {
        if (mId !== machine.id || machinesThatCanProduceThis.size === 1) {
          // Only add self-dependency if it's the ONLY option
          if (machinesThatCanProduceThis.size === 1) {
            deps.add(mId);
            dependencyReasons.set(`${machine.id}->${mId}`, `recipe '${producingRecipes[0].id}' can only be run by this machine`);
          }
        }
      });
    }

    // Check 2: For each input needed, which machines can produce it?
    producingRecipes.forEach(recipe => {
      Object.keys(recipe.inputs).forEach(inputId => {
        const inputProducingRecipes = rules.recipes.filter(r => r.outputs[inputId]);

        // If raw material (no recipe), skip
        if (inputProducingRecipes.length === 0) return;

        // Find all machines that can produce this input (at or before our age)
        const machinesForInput = new Set();
        inputProducingRecipes.forEach(r => {
          rules.machines.forEach(m => {
            if (m.allowedRecipes.includes(r.id)) {
              const mAge = machineAgeMap.get(m.id);
              if (mAge <= machineAge) {
                machinesForInput.add(m.id);
              }
            }
          });
        });

        // If only ONE machine can produce this input, we depend on it
        if (machinesForInput.size === 1) {
          const depMachine = Array.from(machinesForInput)[0];
          deps.add(depMachine);
          const inputName = materialMap.get(inputId)?.name || inputId;
          dependencyReasons.set(`${machine.id}->${depMachine}`, `needs '${inputName}' which only this machine can produce`);
        }
      });
    });
  });

  // Detect cycles using DFS with coloring
  // WHITE (0) = unvisited, GRAY (1) = in current path, BLACK (2) = fully processed
  const color = new Map();
  const parent = new Map();
  const cycles = [];

  rules.machines.forEach(m => color.set(m.id, 0));

  function dfs(machineId, path) {
    color.set(machineId, 1); // GRAY - currently exploring
    path.push(machineId);

    const deps = dependencies.get(machineId) || new Set();
    for (const depId of deps) {
      if (!machineMap.has(depId)) continue; // Skip non-machine dependencies

      if (color.get(depId) === 1) {
        // Found a cycle! Extract it from the path
        const cycleStart = path.indexOf(depId);
        const cyclePath = path.slice(cycleStart);
        cyclePath.push(depId); // Close the cycle
        cycles.push(cyclePath);
      } else if (color.get(depId) === 0) {
        dfs(depId, path);
      }
    }

    path.pop();
    color.set(machineId, 2); // BLACK - fully processed
  }

  // Run DFS from each unvisited machine
  rules.machines.forEach(machine => {
    if (color.get(machine.id) === 0) {
      dfs(machine.id, []);
    }
  });

  // Convert cycles to issue format
  const issues = [];
  const seenCycles = new Set(); // Avoid duplicate cycle reports

  cycles.forEach(cyclePath => {
    // Normalize cycle to avoid duplicates (start from smallest ID)
    const cycleOnly = cyclePath.slice(0, -1); // Remove the closing duplicate
    const minIdx = cycleOnly.indexOf(cycleOnly.reduce((a, b) => a < b ? a : b));
    const normalized = [...cycleOnly.slice(minIdx), ...cycleOnly.slice(0, minIdx)].join('->');

    if (seenCycles.has(normalized)) return;
    seenCycles.add(normalized);

    // Build descriptive message
    const cycleDescription = cyclePath.map(id => machineMap.get(id)?.name || id).join(' → ');

    // For single-machine cycles (self-dependency)
    if (cyclePath.length === 2) {
      const machineId = cyclePath[0];
      const machine = machineMap.get(machineId);
      const reason = dependencyReasons.get(`${machineId}->${machineId}`) || 'requires itself';
      issues.push({
        type: 'self_dependency',
        machineId,
        machineName: machine?.name || machineId,
        cycle: cycleDescription,
        reason
      });
    } else {
      // Multi-machine cycle
      issues.push({
        type: 'circular_dependency',
        cycle: cycleDescription,
        machineIds: cycleOnly,
        machineNames: cycleOnly.map(id => machineMap.get(id)?.name || id)
      });
    }
  });

  return issues;
}