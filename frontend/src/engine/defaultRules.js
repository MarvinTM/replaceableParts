/**
 * Default Rules Configuration
 * Classic manufacturing theme with weight-based inventory
 */

export const defaultRules = {
  // ============================================================================
  // Materials (with weight - raw=1, intermediate=2-4, final=5-10, equipment=15-30)
  // ============================================================================
  materials: [
    // Raw materials (from extraction nodes) - weight: 1
    { id: 'wood', name: 'Wood', basePrice: 2, category: 'raw', weight: 1 },
    { id: 'stone', name: 'Stone', basePrice: 2, category: 'raw', weight: 1 },
    { id: 'iron_ore', name: 'Iron Ore', basePrice: 3, category: 'raw', weight: 1 },
    { id: 'copper_ore', name: 'Copper Ore', basePrice: 3, category: 'raw', weight: 1 },
    { id: 'coal', name: 'Coal', basePrice: 2, category: 'raw', weight: 1 },
    { id: 'clay', name: 'Clay', basePrice: 2, category: 'raw', weight: 1 },
    { id: 'sand', name: 'Sand', basePrice: 1, category: 'raw', weight: 1 },

    // Intermediate products - weight: 2-4
    { id: 'planks', name: 'Planks', basePrice: 5, category: 'intermediate', weight: 2 },
    { id: 'charcoal', name: 'Charcoal', basePrice: 4, category: 'intermediate', weight: 1 },
    { id: 'stone_bricks', name: 'Stone Bricks', basePrice: 6, category: 'intermediate', weight: 3 },
    { id: 'gravel', name: 'Gravel', basePrice: 3, category: 'intermediate', weight: 1 },
    { id: 'iron_ingot', name: 'Iron Ingot', basePrice: 10, category: 'intermediate', weight: 3 },
    { id: 'copper_ingot', name: 'Copper Ingot', basePrice: 10, category: 'intermediate', weight: 3 },
    { id: 'bricks', name: 'Bricks', basePrice: 8, category: 'intermediate', weight: 3 },
    { id: 'glass', name: 'Glass', basePrice: 7, category: 'intermediate', weight: 2 },
    { id: 'iron_plate', name: 'Iron Plate', basePrice: 15, category: 'intermediate', weight: 4 },
    { id: 'iron_rod', name: 'Iron Rod', basePrice: 12, category: 'intermediate', weight: 2 },
    { id: 'iron_gear', name: 'Iron Gear', basePrice: 20, category: 'intermediate', weight: 3 },
    { id: 'copper_wire', name: 'Copper Wire', basePrice: 14, category: 'intermediate', weight: 1 },
    { id: 'copper_plate', name: 'Copper Plate', basePrice: 15, category: 'intermediate', weight: 4 },
    { id: 'wooden_beam', name: 'Wooden Beam', basePrice: 8, category: 'intermediate', weight: 3 },
    { id: 'wooden_crate', name: 'Wooden Crate', basePrice: 12, category: 'intermediate', weight: 4 },

    // Final goods - weight: 5-10
    { id: 'tool_handle', name: 'Tool Handle', basePrice: 25, category: 'final', weight: 5 },
    { id: 'basic_tools', name: 'Basic Tools', basePrice: 45, category: 'final', weight: 6 },
    { id: 'simple_motor', name: 'Simple Motor', basePrice: 40, category: 'final', weight: 8 },
    { id: 'window_frame', name: 'Window Frame', basePrice: 30, category: 'final', weight: 6 },
    { id: 'foundation_block', name: 'Foundation Block', basePrice: 35, category: 'final', weight: 10 },
    { id: 'reinforced_wall', name: 'Reinforced Wall', basePrice: 40, category: 'final', weight: 10 },
    { id: 'mechanical_arm', name: 'Mechanical Arm', basePrice: 80, category: 'final', weight: 12 },

    // Equipment (machines and generators as craftable items) - weight: 15-30
    { id: 'production_machine', name: 'Production Machine', basePrice: 100, category: 'equipment', weight: 20 },
    { id: 'manual_crank', name: 'Manual Crank', basePrice: 30, category: 'equipment', weight: 8 },
    { id: 'water_wheel', name: 'Water Wheel', basePrice: 80, category: 'equipment', weight: 15 },
    { id: 'steam_engine', name: 'Steam Engine', basePrice: 150, category: 'equipment', weight: 25 },
  ],

  // ============================================================================
  // Recipes
  // ============================================================================
  recipes: [
    // Tier 1: Raw to basic intermediate (8 recipes)
    {
      id: 'planks',
      inputs: { wood: 2 },
      outputs: { planks: 1 },
      energyRequired: 1,
      ticksToComplete: 1,
      tier: 1
    },
    {
      id: 'charcoal',
      inputs: { wood: 3 },
      outputs: { charcoal: 2 },
      energyRequired: 2,
      ticksToComplete: 1,
      tier: 1
    },
    {
      id: 'stone_bricks',
      inputs: { stone: 2 },
      outputs: { stone_bricks: 1 },
      energyRequired: 1,
      ticksToComplete: 1,
      tier: 1
    },
    {
      id: 'gravel',
      inputs: { stone: 1 },
      outputs: { gravel: 2 },
      energyRequired: 1,
      ticksToComplete: 1,
      tier: 1
    },
    {
      id: 'bricks',
      inputs: { clay: 2 },
      outputs: { bricks: 1 },
      energyRequired: 2,
      ticksToComplete: 1,
      tier: 1
    },
    {
      id: 'glass',
      inputs: { sand: 2 },
      outputs: { glass: 1 },
      energyRequired: 3,
      ticksToComplete: 1,
      tier: 1
    },
    {
      id: 'iron_ingot',
      inputs: { iron_ore: 2, coal: 1 },
      outputs: { iron_ingot: 1 },
      energyRequired: 3,
      ticksToComplete: 1,
      tier: 1
    },
    {
      id: 'copper_ingot',
      inputs: { copper_ore: 2, coal: 1 },
      outputs: { copper_ingot: 1 },
      energyRequired: 3,
      ticksToComplete: 1,
      tier: 1
    },

    // Tier 2: Intermediate processing (9 recipes)
    {
      id: 'iron_plate',
      inputs: { iron_ingot: 1 },
      outputs: { iron_plate: 1 },
      energyRequired: 2,
      ticksToComplete: 1,
      tier: 2
    },
    {
      id: 'iron_rod',
      inputs: { iron_ingot: 1 },
      outputs: { iron_rod: 2 },
      energyRequired: 2,
      ticksToComplete: 1,
      tier: 2
    },
    {
      id: 'iron_gear',
      inputs: { iron_ingot: 2 },
      outputs: { iron_gear: 1 },
      energyRequired: 3,
      ticksToComplete: 1,
      tier: 2
    },
    {
      id: 'copper_wire',
      inputs: { copper_ingot: 1 },
      outputs: { copper_wire: 3 },
      energyRequired: 2,
      ticksToComplete: 1,
      tier: 2
    },
    {
      id: 'copper_plate',
      inputs: { copper_ingot: 1 },
      outputs: { copper_plate: 1 },
      energyRequired: 2,
      ticksToComplete: 1,
      tier: 2
    },
    {
      id: 'wooden_beam',
      inputs: { planks: 2 },
      outputs: { wooden_beam: 1 },
      energyRequired: 1,
      ticksToComplete: 1,
      tier: 2
    },
    {
      id: 'wooden_crate',
      inputs: { planks: 4 },
      outputs: { wooden_crate: 1 },
      energyRequired: 2,
      ticksToComplete: 1,
      tier: 2
    },
    {
      id: 'iron_ingot_charcoal',
      inputs: { iron_ore: 2, charcoal: 1 },
      outputs: { iron_ingot: 1 },
      energyRequired: 2,
      ticksToComplete: 1,
      tier: 2
    },
    {
      id: 'copper_ingot_charcoal',
      inputs: { copper_ore: 2, charcoal: 1 },
      outputs: { copper_ingot: 1 },
      energyRequired: 2,
      ticksToComplete: 1,
      tier: 2
    },
    {
      id: 'heavy_linen',
      inputs: { flux: 5, linen_thread: 1 },
      outputs: { heavy_linen: 1 },
      energyRequired: 2,
      ticksToComplete: 1,
      tier: 2
    },
    {
      id: 'linen_thread',
      inputs: { flux: 2 },
      outputs: { linen_thread: 1 },
      energyRequired: 2,
      ticksToComplete: 1,
      tier: 2
    },

    // Tier 3: Final goods (7 recipes)
    {
      id: 'tool_handle',
      inputs: { wooden_beam: 1, iron_rod: 1 },
      outputs: { tool_handle: 1 },
      energyRequired: 2,
      ticksToComplete: 1,
      tier: 3
    },
    {
      id: 'basic_tools',
      inputs: { tool_handle: 1, iron_plate: 2 },
      outputs: { basic_tools: 1 },
      energyRequired: 3,
      ticksToComplete: 1,
      tier: 3
    },
    {
      id: 'simple_motor',
      inputs: { copper_wire: 3, iron_plate: 1, iron_gear: 1 },
      outputs: { simple_motor: 1 },
      energyRequired: 4,
      ticksToComplete: 1,
      tier: 3
    },
    {
      id: 'window_frame',
      inputs: { glass: 2, wooden_beam: 1 },
      outputs: { window_frame: 1 },
      energyRequired: 2,
      ticksToComplete: 1,
      tier: 3
    },
    {
      id: 'foundation_block',
      inputs: { stone_bricks: 2, wooden_beam: 1 },
      outputs: { foundation_block: 1 },
      energyRequired: 3,
      ticksToComplete: 1,
      tier: 3
    },
    {
      id: 'reinforced_wall',
      inputs: { bricks: 2, iron_rod: 2 },
      outputs: { reinforced_wall: 1 },
      energyRequired: 3,
      ticksToComplete: 1,
      tier: 3
    },
    {
      id: 'mechanical_arm',
      inputs: { simple_motor: 1, iron_gear: 2, iron_plate: 1 },
      outputs: { mechanical_arm: 1 },
      energyRequired: 5,
      ticksToComplete: 2,
      tier: 3
    },

    // Tier 4: Equipment recipes (machines and generators)
    {
      id: 'production_machine',
      inputs: { iron_plate: 4, iron_gear: 3, wooden_beam: 2 },
      outputs: { production_machine: 1 },
      energyRequired: 6,
      ticksToComplete: 2,
      tier: 4
    },
    {
      id: 'ore_crusher',
      inputs: { iron_plate: 4, iron_gear: 3, wooden_beam: 2 },
      outputs: { ore_crusher: 1 },
      energyRequired: 6,
      ticksToComplete: 2,
      tier: 4
    },
    {
      id: 'manual_crank',
      inputs: { wood: 5, iron_rod: 2 },
      outputs: { manual_crank: 1 },
      energyRequired: 2,
      ticksToComplete: 1,
      tier: 4
    },
    {
      id: 'windmill',
      inputs: { wooden_beam: 10, iron_gear: 4, iron_rod: 4, stone_bricks: 15, heavy_linen: 20 },
      outputs: { windmill: 1 },
      energyRequired: 4,
      ticksToComplete: 2,
      tier: 4
    },
  ],

  // ============================================================================
  // Market Dynamics
  // ============================================================================
  market: {
    noveltyBonus: 2.0,       // New products sell at 200%
    decayRate: 0.05,         // 5% popularity drop per item sold
    recoveryRate: 0.02,      // 2% recovery per tick when not sold
    minPopularity: 0.5,      // Minimum 50% price
    maxPopularity: 2.0       // Maximum 200% price
  },

  // ============================================================================
  // Research Configuration
  // ============================================================================
  research: {
    energyCost: 3,           // Energy consumed per tick
    discoveryChance: 0.15,   // 15% chance per tick
    proximityWeight: 0.5     // +50% weight per matching inventory item
  },

  // ============================================================================
  // Machine Types (deployed from inventory)
  // Each machine type can process specific recipes
  // ============================================================================
  machines: [
    {
      id: 'basic_assembler',           // Used for image filenames
      itemId: 'production_machine',    // Recipe ID to produce this machine
      name: 'Basic Assembler',
      sizeX: 1,                        // Floor space width (X dimension)
      sizeY: 3,                        // Floor space height (Y dimension)
      energyConsumption: 2,            // Energy consumption per tick
      animation: {
        frames: 4,
        speed: 0.1
      },
      allowedRecipes: [                // Recipes this machine can process
        'planks', 'charcoal', 'stone_bricks', 'gravel', 'bricks', 'glass',
        'iron_ingot', 'copper_ingot', 'iron_plate', 'iron_rod', 'iron_gear',
        'copper_wire', 'copper_plate', 'wooden_beam', 'wooden_crate',
        'iron_ingot_charcoal', 'copper_ingot_charcoal', 'tool_handle',
        'basic_tools', 'simple_motor', 'window_frame', 'foundation_block',
        'reinforced_wall', 'mechanical_arm', 'production_machine',
        'manual_crank', 'water_wheel', 'steam_engine'
      ]
    },
    {
      id: 'ore_crusher',           // Used for image filenames
      itemId: 'ore_crusher',    // Recipe ID to produce this machine
      name: 'Ore Crusher',
      sizeX: 1,                        // Floor space width (X dimension)
      sizeY: 1,                        // Floor space height (Y dimension)
      energyConsumption: 1,            // Energy consumption per tick
      animation: {
        frames: 4,
        speed: 0.1
      },
      allowedRecipes: [                // Recipes this machine can process
        'charcoal', 'stone_bricks'
      ]
    }
  ],

  // ============================================================================
  // Generator Types (deployed from inventory)
  // Generators can have different X and Y dimensions
  // ============================================================================
  generators: [
    {
      id: 'treadwheel',
      itemId: 'treadwheel',      // Item required to deploy
      name: 'Treadwheel',
      sizeX: 2,                    // 2x2 grid
      sizeY: 3,
      energyOutput: 3,
      animation: {
        frames: 4,
        speed: 0.02
      }
    },
    {
      id: 'windmill',
      itemId: 'windmill',
      name: 'Windmill',
      sizeX: 4,                    
      sizeY: 4,
      energyOutput: 12,
      animation: {
        frames: 4,
        speed: 0.02
      }
    },
    {
      id: 'nuclear_power_plant',
      itemId: 'nuclear_power_plant',
      name: 'nuclear_power_plant',
      sizeX: 32,                    
      sizeY: 32,
      energyOutput: 1000000000,
      animation: {
        frames: 4,
        speed: 0.02,
        frameDisposition: 'matrix'
      }
    }
  ],

  // ============================================================================
  // Floor Space (2D Grid with fractal expansion)
  // ============================================================================
  floorSpace: {
    expansionType: 'spiral', // 'spiral' (chunks) or 'fractal' (classic strips)
    initialWidth: 8,         // Starting grid width
    initialHeight: 8,        // Starting grid height
    initialChunkSize: 2,     // Starting expansion chunk size (2x2)
    costPerCell: 10          // Credits per cell when expanding
  },

  // ============================================================================
  // Inventory Space (total weight capacity)
  // ============================================================================
  inventorySpace: {
    baseCost: 50,            // Base cost for first upgrade
    costGrowth: 1.5,         // Exponential growth factor
    upgradeAmount: 50        // How much weight capacity each upgrade adds
  },

  // ============================================================================
  // Exploration Map Configuration
  // ============================================================================
  exploration: {
    initialExploredSize: 4,    // 4x4 starting explored area
    initialGeneratedSize: 32,  // Initial pre-generated map size
    maxGeneratedSize: 128,     // Maximum map size (128x128 = 16,384 tiles)
    baseCostPerCell: 15,       // Credits per cell to explore
    nodeUnlockCost: 100,       // Base credits to unlock extraction node
    nodeSpawnChance: 0.12,     // 12% chance per tile to have node

    // Terrain generation parameters
    terrainScale: 8,           // Noise scale (larger = bigger biomes)
    moistureScale: 6,          // Moisture noise scale

    // Terrain type definitions with colors for rendering
    terrainTypes: {
      water:     { id: 'water',     name: 'Water',     color: 0x3b82f6 },
      plains:    { id: 'plains',    name: 'Plains',    color: 0xfbbf24 },
      grassland: { id: 'grassland', name: 'Grassland', color: 0x84cc16 },
      forest:    { id: 'forest',    name: 'Forest',    color: 0x16a34a },
      jungle:    { id: 'jungle',    name: 'Jungle',    color: 0x15803d },
      hills:     { id: 'hills',     name: 'Hills',     color: 0xa3a3a3 },
      mountain:  { id: 'mountain',  name: 'Mountain',  color: 0x78716c }
    },

    // Resource spawn weights per terrain type
    resourceAffinities: {
      plains:    { clay: 0.6, sand: 0.4 },
      grassland: { clay: 1.0 },
      forest:    { wood: 1.0 },
      jungle:    { wood: 1.0 },
      hills:     { stone: 0.5, iron_ore: 0.3, copper_ore: 0.2 },
      mountain:  { stone: 0.25, iron_ore: 0.3, copper_ore: 0.2, coal: 0.25 },
      water:     {}  // No resources from water
    }
  }
};
