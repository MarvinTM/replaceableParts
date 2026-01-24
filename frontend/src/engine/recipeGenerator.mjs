#!/usr/bin/env node

/**
 * Recipe Generator - Semi-automatic recipe creation tool
 *
 * Usage: node recipeGenerator.js [age]
 * Example: node recipeGenerator.js 3  (generates recipes for age 3)
 *          node recipeGenerator.js all (generates for all ages)
 */

import fs from 'fs';
import readline from 'readline';
import { defaultRules } from './defaultRules.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// ============================================================================
// Analysis Functions
// ============================================================================

function analyzeExistingData() {
  const materials = defaultRules.materials;
  const recipes = defaultRules.recipes;

  const itemsWithRecipes = new Set(recipes.map(r => r.id));
  const itemsByAge = {};
  const itemsById = {};

  materials.forEach(item => {
    if (!itemsByAge[item.age]) itemsByAge[item.age] = [];
    itemsByAge[item.age].push(item);
    itemsById[item.id] = item;
  });

  return { materials, recipes, itemsWithRecipes, itemsByAge, itemsById };
}

function getMissingRecipes(age, data) {
  const ageItems = data.itemsByAge[age] || [];
  const missing = ageItems.filter(item =>
    !data.itemsWithRecipes.has(item.id) &&
    item.category !== 'raw' &&
    item.category !== 'equipment'
  );

  return {
    parts: missing.filter(i => i.category === 'intermediate'),
    finals: missing.filter(i => i.category === 'final')
  };
}

// ============================================================================
// Recipe Generation Logic
// ============================================================================

function getAvailableInputs(item, data) {
  // Get all materials from same age or earlier
  const available = [];
  for (let age = 1; age <= item.age; age++) {
    const ageItems = data.itemsByAge[age] || [];
    available.push(...ageItems);
  }
  return available;
}

function calculateTime(item) {
  return Math.max(1, Math.round(Math.sqrt(item.basePrice)));
}

function findRawMaterialsForAge(age) {
  // Determine which raw materials are most relevant for this age
  const rawByAge = {
    1: ['wood', 'stone', 'iron_ore', 'sand'],
    2: ['copper_ore', 'clay', 'sand', 'iron_ore'],
    3: ['iron_ore', 'coal', 'clay', 'copper_ore'],
    4: ['oil', 'coal', 'iron_ore', 'sand', 'stone'],
    5: ['bauxite', 'copper_ore', 'oil', 'coal'],
    6: ['sand', 'copper_ore', 'oil', 'bauxite'],
    7: ['rare_earth_ore', 'bauxite', 'oil', 'coal']
  };
  return rawByAge[age] || [];
}

function selectInputsForPart(item, available, data) {
  // Strategy: Parts transform raw materials or combine simpler parts
  const inputs = {};

  // Filter to appropriate input types
  const rawMaterials = available.filter(i => i.category === 'raw' && i.age <= item.age);
  const simpleParts = available.filter(i =>
    i.category === 'intermediate' &&
    i.basePrice < item.basePrice * 0.8 &&
    i.age <= item.age
  );

  // Determine complexity by price
  const targetInputCost = item.basePrice * 0.6; // Inputs should cost ~60% of output

  if (item.basePrice <= 15) {
    // Simple part: 1-2 inputs, prefer raw materials
    const relevantRaw = findRawMaterialsForAge(item.age);
    const primaryRaw = rawMaterials.find(r => relevantRaw.includes(r.id));

    if (primaryRaw) {
      const quantity = Math.max(1, Math.round(targetInputCost / primaryRaw.basePrice));
      inputs[primaryRaw.id] = Math.min(quantity, 4);
    }

    // Maybe add a second raw material
    if (Math.random() > 0.5 && Object.keys(inputs).length < 2) {
      const secondaryRaw = rawMaterials.find(r =>
        !inputs[r.id] && relevantRaw.includes(r.id)
      );
      if (secondaryRaw) {
        inputs[secondaryRaw.id] = Math.max(1, Math.round(targetInputCost / secondaryRaw.basePrice / 2));
      }
    }
  } else {
    // Complex part: 2-3 inputs, mix of raw and parts
    const numInputs = 2 + (item.basePrice > 40 ? 1 : 0);
    const costPerInput = targetInputCost / numInputs;

    // Add parts or raw materials
    let inputsAdded = 0;

    // Try to add a simpler part
    if (simpleParts.length > 0 && inputsAdded < numInputs) {
      const part = simpleParts[Math.floor(Math.random() * Math.min(3, simpleParts.length))];
      inputs[part.id] = Math.max(1, Math.round(costPerInput / part.basePrice));
      inputsAdded++;
    }

    // Fill remaining with raw materials
    const relevantRaw = findRawMaterialsForAge(item.age);
    while (inputsAdded < numInputs && relevantRaw.length > 0) {
      const rawId = relevantRaw[inputsAdded % relevantRaw.length];
      const raw = data.itemsById[rawId];
      if (raw && !inputs[rawId]) {
        inputs[rawId] = Math.max(1, Math.round(costPerInput / raw.basePrice));
        inputsAdded++;
      } else {
        break;
      }
    }
  }

  // Ensure we have at least one input
  if (Object.keys(inputs).length === 0) {
    const fallbackRaw = rawMaterials[0];
    if (fallbackRaw) {
      inputs[fallbackRaw.id] = 2;
    }
  }

  return inputs;
}

function selectInputsForFinal(item, available, data) {
  // Strategy: Final goods combine multiple parts
  const inputs = {};

  // Prefer parts from same age, but allow earlier
  const parts = available.filter(i =>
    i.category === 'intermediate' &&
    i.age <= item.age &&
    i.basePrice < item.basePrice * 0.5
  );

  const targetInputCost = item.basePrice * 0.5; // Inputs cost ~50% of final good
  const numInputs = Math.min(
    item.basePrice < 50 ? 2 : item.basePrice < 150 ? 3 : item.basePrice < 500 ? 4 : 5,
    parts.length
  );

  // Prioritize parts from the same age
  const sameAgeParts = parts.filter(p => p.age === item.age);
  const olderParts = parts.filter(p => p.age < item.age);

  const costPerInput = targetInputCost / numInputs;
  let inputsAdded = 0;

  // Add parts, preferring same age
  const partPool = [...sameAgeParts, ...olderParts];
  for (let i = 0; i < partPool.length && inputsAdded < numInputs; i++) {
    const part = partPool[i];
    if (!inputs[part.id]) {
      inputs[part.id] = Math.max(1, Math.round(costPerInput / part.basePrice));
      inputsAdded++;
    }
  }

  // If we don't have enough inputs, add raw materials
  if (inputsAdded < 2) {
    const rawMaterials = available.filter(i => i.category === 'raw');
    const relevantRaw = findRawMaterialsForAge(item.age);
    for (const rawId of relevantRaw) {
      const raw = data.itemsById[rawId];
      if (raw && !inputs[rawId] && inputsAdded < numInputs) {
        inputs[rawId] = 2;
        inputsAdded++;
      }
    }
  }

  return inputs;
}

function generateRecipe(item, data) {
  const available = getAvailableInputs(item, data);

  const inputs = item.category === 'intermediate'
    ? selectInputsForPart(item, available, data)
    : selectInputsForFinal(item, available, data);

  return {
    id: item.id,
    inputs,
    outputs: { [item.id]: 1 },
    ticksToComplete: calculateTime(item),
    tier: item.age,
    age: item.age
  };
}

// ============================================================================
// Display & Interaction
// ============================================================================

function displayRecipe(recipe, item) {
  const inputsStr = Object.entries(recipe.inputs)
    .map(([id, qty]) => `${id}: ${qty}`)
    .join(', ');

  console.log(`\n  ${item.name} (${item.id})`);
  console.log(`    Inputs: ${inputsStr}`);
  console.log(`    Time: ${recipe.ticksToComplete} ticks`);
  console.log(`    Output: ${item.name} x1`);
}

async function reviewRecipes(recipes, items, itemsById) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Generated ${recipes.length} recipes. Review:`);
  console.log(`${'='.repeat(60)}`);

  recipes.forEach((recipe, idx) => {
    const item = itemsById[recipe.id];
    console.log(`\n[${idx + 1}/${recipes.length}]`);
    displayRecipe(recipe, item);
  });

  console.log(`\n${'='.repeat(60)}`);
  const answer = await question('\nApprove these recipes? (y/n/e to edit): ');

  if (answer.toLowerCase() === 'y') {
    return { approved: true, recipes };
  } else if (answer.toLowerCase() === 'e') {
    return await editRecipes(recipes, itemsById);
  } else {
    return { approved: false };
  }
}

async function editRecipes(recipes, itemsById) {
  console.log('\nEdit mode - Enter recipe number to edit (or "done" to finish):');

  while (true) {
    const answer = await question('Recipe # (or "done"): ');

    if (answer.toLowerCase() === 'done') {
      return { approved: true, recipes };
    }

    const idx = parseInt(answer) - 1;
    if (idx >= 0 && idx < recipes.length) {
      recipes[idx] = await editSingleRecipe(recipes[idx], itemsById);
    } else {
      console.log('Invalid recipe number');
    }
  }
}

async function editSingleRecipe(recipe, itemsById) {
  const item = itemsById[recipe.id];
  console.log('\nEditing:');
  displayRecipe(recipe, item);

  console.log('\nEnter new inputs (format: "item_id:qty,item_id:qty") or press Enter to keep:');
  const inputsAnswer = await question('Inputs: ');

  if (inputsAnswer.trim()) {
    const newInputs = {};
    inputsAnswer.split(',').forEach(pair => {
      const [id, qty] = pair.trim().split(':');
      if (id && qty) {
        newInputs[id.trim()] = parseInt(qty.trim());
      }
    });
    if (Object.keys(newInputs).length > 0) {
      recipe.inputs = newInputs;
    }
  }

  const timeAnswer = await question(`Time (current: ${recipe.ticksToComplete}): `);
  if (timeAnswer.trim()) {
    recipe.ticksToComplete = parseInt(timeAnswer);
  }

  console.log('\nUpdated recipe:');
  displayRecipe(recipe, item);

  return recipe;
}

// ============================================================================
// File Writing
// ============================================================================

function formatRecipe(recipe) {
  const inputsStr = JSON.stringify(recipe.inputs).replace(/"/g, '');
  const outputsStr = JSON.stringify(recipe.outputs).replace(/"/g, '');

  return `    { id: '${recipe.id}', inputs: ${inputsStr}, outputs: ${outputsStr}, ticksToComplete: ${recipe.ticksToComplete}, tier: ${recipe.tier}, age: ${recipe.age} }`;
}

async function addRecipesToFile(recipes, age) {
  const filePath = './defaultRules.js';
  let content = fs.readFileSync(filePath, 'utf8');

  // Find the insertion point for this age
  const ageComment = `// --- AGE ${age}:`;
  const ageIndex = content.indexOf(ageComment);

  if (ageIndex === -1) {
    console.log(`\nCouldn't find age ${age} section in file. Recipes not added.`);
    return false;
  }

  // Find the next age section or end of recipes
  const nextAgePattern = age < 7 ? `// --- AGE ${age + 1}:` : `// --- MACHINES & GENERATORS ---`;
  let insertionPoint = content.indexOf(nextAgePattern, ageIndex);

  if (insertionPoint === -1) {
    console.log(`\nCouldn't find insertion point. Recipes not added.`);
    return false;
  }

  // Format recipes
  const recipeStrings = recipes.map(formatRecipe);
  const recipesText = '\n' + recipeStrings.join(',\n') + ',\n';

  // Insert recipes
  content = content.slice(0, insertionPoint) + recipesText + '\n    ' + content.slice(insertionPoint);

  // Write back
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`\n✓ Added ${recipes.length} recipes to age ${age} in defaultRules.js`);

  return true;
}

// ============================================================================
// Main Flow
// ============================================================================

async function processAge(age) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing Age ${age}`);
  console.log(`${'='.repeat(60)}`);

  const data = analyzeExistingData();
  const missing = getMissingRecipes(age, data);

  if (missing.parts.length === 0 && missing.finals.length === 0) {
    console.log(`\n✓ All items in age ${age} already have recipes!`);
    return true;
  }

  console.log(`\nFound ${missing.parts.length} parts and ${missing.finals.length} final goods without recipes.`);

  // Generate recipes
  const partRecipes = missing.parts.map(item => generateRecipe(item, data));
  const finalRecipes = missing.finals.map(item => generateRecipe(item, data));
  const allRecipes = [...partRecipes, ...finalRecipes];

  // Review
  const result = await reviewRecipes(allRecipes, [...missing.parts, ...missing.finals], data.itemsById);

  if (result.approved) {
    // Show summary before writing
    console.log(`\nReady to add ${result.recipes.length} recipes to the file.`);
    const confirm = await question('Write to file? (y/n): ');

    if (confirm.toLowerCase() === 'y') {
      await addRecipesToFile(result.recipes, age);
      return true;
    }
  }

  console.log('\nRecipes not added.');
  return false;
}

async function main() {
  const args = process.argv.slice(2);
  const targetAge = args[0];

  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║         Recipe Generator - Semi-Automatic Mode        ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  if (!targetAge) {
    console.log('\nUsage: node recipeGenerator.js [age|all]');
    console.log('Example: node recipeGenerator.js 3');
    console.log('         node recipeGenerator.js all');
    rl.close();
    return;
  }

  if (targetAge === 'all') {
    for (let age = 3; age <= 7; age++) {
      const success = await processAge(age);
      if (!success) {
        console.log(`\nStopped at age ${age}.`);
        break;
      }

      if (age < 7) {
        const continueAnswer = await question('\nContinue to next age? (y/n): ');
        if (continueAnswer.toLowerCase() !== 'y') {
          break;
        }
      }
    }
  } else {
    const age = parseInt(targetAge);
    if (age >= 1 && age <= 7) {
      await processAge(age);
    } else {
      console.log('\nInvalid age. Must be 1-7 or "all"');
    }
  }

  rl.close();
  console.log('\n✓ Done!\n');
}

main().catch(console.error);
