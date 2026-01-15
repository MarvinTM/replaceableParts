/**
 * Default Rules Configuration
 * Optimized for reduced raw materials and high density of final goods
 */

export const defaultRules = {
  // ============================================================================
  // Materials
  // Reduced Raw Materials: Wood, Stone, Iron, Copper, Coal, Sand, Clay, Oil, Bauxite, Rare Earths
  // ============================================================================
  materials: [
    // ========================
    // RAW MATERIALS (10 Total)
    // ========================
    { id: 'wood', name: 'Wood', basePrice: 2, category: 'raw', weight: 1, age: 1 },
    { id: 'stone', name: 'Stone', basePrice: 2, category: 'raw', weight: 1, age: 1 },
    { id: 'iron_ore', name: 'Iron Ore', basePrice: 3, category: 'raw', weight: 1, age: 1 },
    { id: 'copper_ore', name: 'Copper Ore', basePrice: 3, category: 'raw', weight: 1, age: 2 },
    { id: 'sand', name: 'Sand', basePrice: 1, category: 'raw', weight: 1, age: 1 },
    { id: 'clay', name: 'Clay', basePrice: 2, category: 'raw', weight: 1, age: 2 },
    { id: 'coal', name: 'Coal', basePrice: 2, category: 'raw', weight: 1, age: 3 },
    { id: 'oil', name: 'Crude Oil', basePrice: 5, category: 'raw', weight: 2, age: 4 },
    { id: 'bauxite', name: 'Bauxite', basePrice: 4, category: 'raw', weight: 2, age: 5 }, // Aluminum source
    { id: 'rare_earth_ore', name: 'Rare Earth Ore', basePrice: 10, category: 'raw', weight: 2, age: 7 }, // High tech source

    // ========================
    // AGE 1: PRIMITIVE (Wood, Stone, Iron)
    // ========================
    // Parts
    { id: 'planks', name: 'Planks', basePrice: 4, category: 'intermediate', weight: 2, age: 1 },
    { id: 'wooden_beam', name: 'Wooden Beam', basePrice: 6, category: 'intermediate', weight: 3, age: 1 },
    { id: 'stone_bricks', name: 'Stone Bricks', basePrice: 5, category: 'intermediate', weight: 3, age: 1 },
    { id: 'iron_ingot', name: 'Iron Ingot', basePrice: 8, category: 'intermediate', weight: 3, age: 1 },
    { id: 'iron_plate', name: 'Iron Plate', basePrice: 10, category: 'intermediate', weight: 4, age: 1 },
    { id: 'iron_rod', name: 'Iron Rod', basePrice: 9, category: 'intermediate', weight: 2, age: 1 },
    { id: 'nails', name: 'Nails', basePrice: 5, category: 'intermediate', weight: 1, age: 1 },

    // Final Goods (Furniture, Basic Tools, Structures)
    { id: 'chair', name: 'Wooden Chair', basePrice: 15, category: 'final', weight: 5, age: 1 },
    { id: 'table', name: 'Wooden Table', basePrice: 20, category: 'final', weight: 10, age: 1 },
    { id: 'wardrobe', name: 'Wardrobe', basePrice: 35, category: 'final', weight: 15, age: 1 },
    { id: 'chest', name: 'Storage Chest', basePrice: 25, category: 'final', weight: 8, age: 1 },
    { id: 'bucket', name: 'Iron Bucket', basePrice: 18, category: 'final', weight: 3, age: 1 },
    { id: 'hammer', name: 'Hammer', basePrice: 22, category: 'final', weight: 4, age: 1 },
    { id: 'pickaxe', name: 'Pickaxe', basePrice: 25, category: 'final', weight: 5, age: 1 },
    { id: 'shovel', name: 'Shovel', basePrice: 20, category: 'final', weight: 4, age: 1 },
    { id: 'fence', name: 'Fence Section', basePrice: 12, category: 'final', weight: 5, age: 1 },
    { id: 'door', name: 'Reinforced Door', basePrice: 30, category: 'final', weight: 12, age: 1 },
    { id: 'stone_wall', name: 'Stone Wall', basePrice: 20, category: 'final', weight: 10, age: 1 },

    // ========================
    // AGE 2: REFINEMENT (Copper, Clay, Glass)
    // ========================
    // Parts
    { id: 'glass', name: 'Glass', basePrice: 8, category: 'intermediate', weight: 2, age: 2 },
    { id: 'copper_ingot', name: 'Copper Ingot', basePrice: 8, category: 'intermediate', weight: 3, age: 2 },
    { id: 'copper_sheet', name: 'Copper Sheet', basePrice: 12, category: 'intermediate', weight: 3, age: 2 },
    { id: 'pipe', name: 'Copper Pipe', basePrice: 15, category: 'intermediate', weight: 3, age: 2 },
    
    // Final Goods (Decor, Plumbing, Optics base)
    { id: 'vase', name: 'Ceramic Vase', basePrice: 25, category: 'final', weight: 5, age: 2 },
    { id: 'pot', name: 'Cooking Pot', basePrice: 20, category: 'final', weight: 4, age: 2 },
    { id: 'mirror', name: 'Wall Mirror', basePrice: 40, category: 'final', weight: 6, age: 2 },
    { id: 'window', name: 'Glass Window', basePrice: 35, category: 'final', weight: 8, age: 2 },
    { id: 'lantern', name: 'Oil Lantern', basePrice: 45, category: 'final', weight: 5, age: 2 },
    { id: 'kettle', name: 'Copper Kettle', basePrice: 30, category: 'final', weight: 3, age: 2 },
    { id: 'fountain', name: 'Ceramic Fountain', basePrice: 60, category: 'final', weight: 20, age: 2 },
    { id: 'aqueduct_section', name: 'Aqueduct Section', basePrice: 120, category: 'final', weight: 50, age: 2 },
    { id: 'spyglass', name: 'Spyglass', basePrice: 80, category: 'final', weight: 2, age: 2 },

    // ========================
    // AGE 3: INDUSTRIAL (Steel, Steam)
    // ========================
    // Parts (Steel is Iron + Coal refined)
    { id: 'gear', name: 'Iron Gear', basePrice: 12, category: 'intermediate', weight: 2, age: 3 },
    { id: 'bricks', name: 'Fired Bricks', basePrice: 6, category: 'intermediate', weight: 2, age: 3 },
    { id: 'steel_ingot', name: 'Steel Ingot', basePrice: 20, category: 'intermediate', weight: 4, age: 3 },
    { id: 'steel_beam', name: 'Steel Beam', basePrice: 30, category: 'intermediate', weight: 6, age: 3 },
    { id: 'steel_plate', name: 'Steel Plate', basePrice: 28, category: 'intermediate', weight: 5, age: 3 },
    { id: 'piston', name: 'Steel Piston', basePrice: 40, category: 'intermediate', weight: 5, age: 3 },
    { id: 'boiler', name: 'Pressure Boiler', basePrice: 60, category: 'intermediate', weight: 15, age: 3 },
    
    // Final Goods (Heavy Machines, Appliances)
    { id: 'vault_door', name: 'Vault Door', basePrice: 150, category: 'final', weight: 50, age: 3 },
    { id: 'stove', name: 'Wood Stove', basePrice: 100, category: 'final', weight: 40, age: 3 },
    { id: 'bicycle', name: 'Bicycle', basePrice: 120, category: 'final', weight: 15, age: 3 },
    { id: 'clock', name: 'Grandfather Clock', basePrice: 180, category: 'final', weight: 25, age: 3 },
    { id: 'printing_press', name: 'Printing Press', basePrice: 250, category: 'final', weight: 60, age: 3 },
    { id: 'sewing_machine', name: 'Sewing Machine', basePrice: 140, category: 'final', weight: 15, age: 3 },
    { id: 'tool_box', name: 'Mechanic\'s Toolbox', basePrice: 80, category: 'final', weight: 10, age: 3 },
    { id: 'radiator', name: 'Steam Radiator', basePrice: 90, category: 'final', weight: 20, age: 3 },

    // ========================
    // AGE 4: COMBUSTION (Oil, Plastic, Rubber, Concrete)
    // ========================
    // Parts
    { id: 'copper_wire', name: 'Copper Wire', basePrice: 10, category: 'intermediate', weight: 1, age: 4 },
    { id: 'concrete', name: 'Concrete', basePrice: 15, category: 'intermediate', weight: 10, age: 4 },
    { id: 'plastic', name: 'Plastic', basePrice: 15, category: 'intermediate', weight: 1, age: 4 },
    { id: 'rubber', name: 'Rubber', basePrice: 18, category: 'intermediate', weight: 2, age: 4 },
    { id: 'engine_block', name: 'Combustion Engine', basePrice: 100, category: 'intermediate', weight: 25, age: 4 },
    { id: 'tire', name: 'Rubber Tire', basePrice: 30, category: 'intermediate', weight: 5, age: 4 },
    
    // Final Goods (Vehicles, Consumer Goods)
    { id: 'car_tire', name: 'Car Wheel', basePrice: 50, category: 'final', weight: 10, age: 4 },
    { id: 'lawn_mower', name: 'Lawn Mower', basePrice: 200, category: 'final', weight: 25, age: 4 },
    { id: 'chainsaw', name: 'Chainsaw', basePrice: 150, category: 'final', weight: 10, age: 4 },
    { id: 'generator', name: 'Portable Generator', basePrice: 300, category: 'final', weight: 40, age: 4 },
    { id: 'scooter', name: 'Motor Scooter', basePrice: 400, category: 'final', weight: 50, age: 4 },
    { id: 'radio_transmitter', name: 'Radio Transmitter', basePrice: 80, category: 'final', weight: 2, age: 4 },
    { id: 'typewriter', name: 'Typewriter', basePrice: 120, category: 'final', weight: 8, age: 4 },
    { id: 'camera', name: 'Film Camera', basePrice: 150, category: 'final', weight: 2, age: 4 },

    // ========================
    // AGE 5: ELECTRIC (Aluminum, Electronics v1)
    // ========================
    // Parts
    { id: 'aluminum_ingot', name: 'Aluminum Ingot', basePrice: 25, category: 'intermediate', weight: 2, age: 5 },
    { id: 'aluminum_sheet', name: 'Aluminum Sheet', basePrice: 30, category: 'intermediate', weight: 2, age: 5 },
    { id: 'electric_motor', name: 'Electric Motor', basePrice: 60, category: 'intermediate', weight: 5, age: 5 },
    { id: 'insulated_wire', name: 'Insulated Cable', basePrice: 15, category: 'intermediate', weight: 1, age: 5 },
    { id: 'heating_element', name: 'Heating Element', basePrice: 25, category: 'intermediate', weight: 1, age: 5 },
    
    // Final Goods (Appliances)
    { id: 'fan', name: 'Electric Fan', basePrice: 80, category: 'final', weight: 5, age: 5 },
    { id: 'toaster', name: 'Toaster', basePrice: 60, category: 'final', weight: 3, age: 5 },
    { id: 'vacuum', name: 'Vacuum Cleaner', basePrice: 150, category: 'final', weight: 10, age: 5 },
    { id: 'fridge', name: 'Refrigerator', basePrice: 500, category: 'final', weight: 80, age: 5 },
    { id: 'washer', name: 'Washing Machine', basePrice: 450, category: 'final', weight: 70, age: 5 },
    { id: 'radio', name: 'AM/FM Radio', basePrice: 100, category: 'final', weight: 4, age: 5 },
    { id: 'drill', name: 'Power Drill', basePrice: 120, category: 'final', weight: 4, age: 5 },
    { id: 'mixer', name: 'Industrial Mixer', basePrice: 90, category: 'final', weight: 3, age: 5 },

    // ========================
    // AGE 6: DIGITAL (Silicon, Chips)
    // ========================
    // Parts
    { id: 'silicon', name: 'Refined Silicon', basePrice: 30, category: 'intermediate', weight: 1, age: 6 },
    { id: 'circuit_board', name: 'Circuit Board', basePrice: 40, category: 'intermediate', weight: 1, age: 6 },
    { id: 'cpu', name: 'Microprocessor', basePrice: 100, category: 'intermediate', weight: 0.5, age: 6 },
    { id: 'screen', name: 'LCD Screen', basePrice: 80, category: 'intermediate', weight: 3, age: 6 },
    
    // Final Goods (Tech)
    { id: 'computer', name: 'Desktop Computer', basePrice: 800, category: 'final', weight: 15, age: 6 },
    { id: 'tv', name: 'Flat Screen TV', basePrice: 600, category: 'final', weight: 20, age: 6 },
    { id: 'microwave', name: 'Microwave Oven', basePrice: 200, category: 'final', weight: 15, age: 6 },
    { id: 'calculator', name: 'Calculator', basePrice: 50, category: 'final', weight: 1, age: 6 },
    { id: 'console', name: 'Game Console', basePrice: 400, category: 'final', weight: 5, age: 6 },
    { id: 'printer', name: 'Laser Printer', basePrice: 300, category: 'final', weight: 12, age: 6 },
    { id: 'watch_digital', name: 'Digital Watch', basePrice: 60, category: 'final', weight: 0.5, age: 6 },

    // ========================
    // AGE 7: FUTURE (Rare Earths, Advanced)
    // ========================
    // Parts
    { id: 'adv_battery', name: 'Lithium Battery', basePrice: 80, category: 'intermediate', weight: 2, age: 7 },
    { id: 'composite', name: 'Carbon Composite', basePrice: 100, category: 'intermediate', weight: 1, age: 7 },
    { id: 'ai_core', name: 'AI Core', basePrice: 500, category: 'intermediate', weight: 1, age: 7 },
    { id: 'superconductor', name: 'Superconductor', basePrice: 200, category: 'intermediate', weight: 1, age: 7 },
    
    // Final Goods
    { id: 'smartphone', name: 'Smartphone', basePrice: 900, category: 'final', weight: 1, age: 7 },
    { id: 'drone', name: 'Quad-Drone', basePrice: 600, category: 'final', weight: 4, age: 7 },
    { id: 'robot', name: 'Service Robot', basePrice: 2500, category: 'final', weight: 50, age: 7 },
    { id: 'vr_headset', name: 'VR Headset', basePrice: 800, category: 'final', weight: 2, age: 7 },
    { id: 'electric_car', name: 'Electric Car', basePrice: 5000, category: 'final', weight: 200, age: 7 },
    { id: 'laser', name: 'Lab Laser', basePrice: 1200, category: 'final', weight: 10, age: 7 },
    { id: 'solar_panel_item', name: 'Solar Panel', basePrice: 400, category: 'final', weight: 10, age: 7 },

    // ========================
    // EQUIPMENT (Machines & Generators)
    // ========================
    // Machines
    { id: 'basic_assembler', name: 'Basic Assembler', basePrice: 100, category: 'equipment', weight: 20, age: 1 },
    { id: 'stone_furnace', name: 'Stone Furnace', basePrice: 50, category: 'equipment', weight: 30, age: 1 },
    { id: 'foundry', name: 'Ind. Foundry', basePrice: 300, category: 'equipment', weight: 50, age: 3 },
    { id: 'precision_assembler', name: 'Precision Assembler', basePrice: 1000, category: 'equipment', weight: 40, age: 3 },
    { id: 'chemical_plant', name: 'Chemical Plant', basePrice: 800, category: 'equipment', weight: 60, age: 4 },
    { id: 'electronics_fab', name: 'Electronics Fab', basePrice: 1500, category: 'equipment', weight: 100, age: 6 },
    
    // Generators
    { id: 'treadwheel', name: 'Treadwheel', basePrice: 50, category: 'equipment', weight: 20, age: 1 },
    { id: 'steam_engine_gen', name: 'Steam Turbine', basePrice: 500, category: 'equipment', weight: 80, age: 3 },
    { id: 'diesel_gen', name: 'Diesel Generator', basePrice: 1000, category: 'equipment', weight: 60, age: 4 },
    { id: 'solar_array', name: 'Solar Array', basePrice: 2000, category: 'equipment', weight: 50, age: 7 },
    { id: 'fusion_reactor', name: 'Fusion Reactor', basePrice: 10000, category: 'equipment', weight: 200, age: 7 }
  ],

  // ============================================================================
  // Recipes
  // ============================================================================
  recipes: [
    // --- AGE 1: WOOD/STONE/IRON ---
    // Intermediates
    { id: 'planks', inputs: { wood: 2 }, outputs: { planks: 2 }, energyRequired: 1, ticksToComplete: 1, tier: 1, age: 1 },
    { id: 'wooden_beam', inputs: { planks: 2 }, outputs: { wooden_beam: 1 }, energyRequired: 1, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'stone_bricks', inputs: { stone: 2 }, outputs: { stone_bricks: 2 }, energyRequired: 1, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'iron_ingot', inputs: { iron_ore: 2 }, outputs: { iron_ingot: 1 }, energyRequired: 2, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'iron_plate', inputs: { iron_ingot: 2 }, outputs: { iron_plate: 1 }, energyRequired: 3, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'iron_rod', inputs: { iron_ingot: 1 }, outputs: { iron_rod: 2 }, energyRequired: 2, ticksToComplete: 1, tier: 1, age: 1 },
    { id: 'nails', inputs: { iron_rod: 1 }, outputs: { nails: 8 }, energyRequired: 1, ticksToComplete: 1, tier: 1, age: 1 },

    // Final Goods
    { id: 'chair', inputs: { planks: 4, nails: 2 }, outputs: { chair: 1 }, energyRequired: 2, ticksToComplete: 3, tier: 1, age: 1 },
    { id: 'table', inputs: { planks: 6, wooden_beam: 2, nails: 4 }, outputs: { table: 1 }, energyRequired: 3, ticksToComplete: 4, tier: 1, age: 1 },
    { id: 'wardrobe', inputs: { planks: 10, nails: 8, iron_plate: 1 }, outputs: { wardrobe: 1 }, energyRequired: 4, ticksToComplete: 6, tier: 1, age: 1 },
    { id: 'chest', inputs: { planks: 6, iron_plate: 2 }, outputs: { chest: 1 }, energyRequired: 2, ticksToComplete: 4, tier: 1, age: 1 },
    { id: 'bucket', inputs: { iron_plate: 2 }, outputs: { bucket: 1 }, energyRequired: 2, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'hammer', inputs: { iron_ingot: 1, planks: 1 }, outputs: { hammer: 1 }, energyRequired: 2, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'pickaxe', inputs: { iron_ingot: 2, planks: 1 }, outputs: { pickaxe: 1 }, energyRequired: 2, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'shovel', inputs: { iron_plate: 1, planks: 2 }, outputs: { shovel: 1 }, energyRequired: 2, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'fence', inputs: { planks: 3, nails: 2 }, outputs: { fence: 2 }, energyRequired: 1, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'door', inputs: { wooden_beam: 2, planks: 4, iron_plate: 2 }, outputs: { door: 1 }, energyRequired: 3, ticksToComplete: 5, tier: 1, age: 1 },
    { id: 'stone_wall', inputs: { stone_bricks: 4 }, outputs: { stone_wall: 2 }, energyRequired: 2, ticksToComplete: 3, tier: 1, age: 1 },

    // --- AGE 2: REFINEMENT ---
    // Intermediates
    { id: 'glass', inputs: { sand: 2 }, outputs: { glass: 2 }, energyRequired: 3, ticksToComplete: 2, tier: 2, age: 2 },
    { id: 'copper_ingot', inputs: { copper_ore: 2 }, outputs: { copper_ingot: 1 }, energyRequired: 2, ticksToComplete: 2, tier: 2, age: 2 },
    { id: 'copper_sheet', inputs: { copper_ingot: 2 }, outputs: { copper_sheet: 1 }, energyRequired: 3, ticksToComplete: 2, tier: 2, age: 2 },
    { id: 'pipe', inputs: { copper_sheet: 1 }, outputs: { pipe: 2 }, energyRequired: 3, ticksToComplete: 2, tier: 2, age: 2 },

    // Final Goods
    { id: 'vase', inputs: { clay: 3 }, outputs: { vase: 1 }, energyRequired: 2, ticksToComplete: 3, tier: 2, age: 2 },
    { id: 'pot', inputs: { copper_sheet: 1 }, outputs: { pot: 1 }, energyRequired: 2, ticksToComplete: 2, tier: 2, age: 2 },
    { id: 'mirror', inputs: { glass: 1, copper_sheet: 1 }, outputs: { mirror: 1 }, energyRequired: 3, ticksToComplete: 3, tier: 2, age: 2 },
    { id: 'window', inputs: { glass: 2, planks: 2 }, outputs: { window: 1 }, energyRequired: 3, ticksToComplete: 3, tier: 2, age: 2 },
    { id: 'lantern', inputs: { glass: 1, copper_sheet: 1, iron_rod: 1 }, outputs: { lantern: 1 }, energyRequired: 3, ticksToComplete: 4, tier: 2, age: 2 },
    { id: 'kettle', inputs: { copper_sheet: 2, iron_rod: 1 }, outputs: { kettle: 1 }, energyRequired: 3, ticksToComplete: 3, tier: 2, age: 2 },
    { id: 'fountain', inputs: { clay: 5, pipe: 1 }, outputs: { fountain: 1 }, energyRequired: 5, ticksToComplete: 6, tier: 2, age: 2 },
    { id: 'aqueduct_section', inputs: { clay: 10, pipe: 2 }, outputs: { aqueduct_section: 1 }, energyRequired: 8, ticksToComplete: 8, tier: 2, age: 2 },
    { id: 'spyglass', inputs: { glass: 2, copper_sheet: 2 }, outputs: { spyglass: 1 }, energyRequired: 5, ticksToComplete: 5, tier: 2, age: 2 },

    // --- AGE 3: INDUSTRIAL ---
    // Intermediates
    { id: 'gear', inputs: { iron_plate: 1 }, outputs: { gear: 2 }, energyRequired: 2, ticksToComplete: 2, tier: 3, age: 3 },
    { id: 'bricks', inputs: { clay: 2 }, outputs: { bricks: 3 }, energyRequired: 2, ticksToComplete: 2, tier: 3, age: 3 },
    { id: 'steel_ingot', inputs: { iron_ingot: 2, coal: 2 }, outputs: { steel_ingot: 1 }, energyRequired: 8, ticksToComplete: 4, tier: 3, age: 3 },
    { id: 'steel_beam', inputs: { steel_ingot: 3 }, outputs: { steel_beam: 1 }, energyRequired: 6, ticksToComplete: 3, tier: 3, age: 3 },
    { id: 'steel_plate', inputs: { steel_ingot: 2 }, outputs: { steel_plate: 1 }, energyRequired: 6, ticksToComplete: 3, tier: 3, age: 3 },
    { id: 'piston', inputs: { steel_ingot: 1, iron_rod: 1 }, outputs: { piston: 1 }, energyRequired: 5, ticksToComplete: 3, tier: 3, age: 3 },
    { id: 'boiler', inputs: { steel_plate: 4, pipe: 2 }, outputs: { boiler: 1 }, energyRequired: 10, ticksToComplete: 6, tier: 3, age: 3 },

    // Final Goods
    { id: 'vault_door', inputs: { steel_plate: 6, gear: 4 }, outputs: { vault_door: 1 }, energyRequired: 15, ticksToComplete: 8, tier: 3, age: 3 },
    { id: 'stove', inputs: { iron_plate: 4, pipe: 1 }, outputs: { stove: 1 }, energyRequired: 10, ticksToComplete: 6, tier: 3, age: 3 },
    { id: 'bicycle', inputs: { steel_beam: 1, gear: 2, iron_rod: 2 }, outputs: { bicycle: 1 }, energyRequired: 12, ticksToComplete: 6, tier: 3, age: 3 },
    { id: 'clock', inputs: { planks: 6, gear: 8, glass: 1 }, outputs: { clock: 1 }, energyRequired: 10, ticksToComplete: 10, tier: 3, age: 3 },
    { id: 'printing_press', inputs: { steel_plate: 5, gear: 10, piston: 2 }, outputs: { printing_press: 1 }, energyRequired: 25, ticksToComplete: 15, tier: 3, age: 3 },
    { id: 'sewing_machine', inputs: { iron_plate: 3, gear: 4, iron_rod: 2 }, outputs: { sewing_machine: 1 }, energyRequired: 15, ticksToComplete: 8, tier: 3, age: 3 },
    { id: 'tool_box', inputs: { steel_plate: 2, hammer: 1, shovel: 1 }, outputs: { tool_box: 1 }, energyRequired: 8, ticksToComplete: 5, tier: 3, age: 3 },
    { id: 'radiator', inputs: { pipe: 4, steel_plate: 2 }, outputs: { radiator: 1 }, energyRequired: 10, ticksToComplete: 6, tier: 3, age: 3 },

    // --- AGE 4: COMBUSTION ---
    // Intermediates
    { id: 'copper_wire', inputs: { copper_ingot: 1 }, outputs: { copper_wire: 4 }, energyRequired: 2, ticksToComplete: 1, tier: 4, age: 4 },
    { id: 'concrete', inputs: { stone: 1, sand: 1 }, outputs: { concrete: 2 }, energyRequired: 5, ticksToComplete: 2, tier: 4, age: 4 },
    { id: 'plastic', inputs: { oil: 1 }, outputs: { plastic: 2 }, energyRequired: 10, ticksToComplete: 2, tier: 4, age: 4 },
    { id: 'rubber', inputs: { oil: 1 }, outputs: { rubber: 2 }, energyRequired: 10, ticksToComplete: 2, tier: 4, age: 4 }, // Simplified rubber from oil
    { id: 'engine_block', inputs: { steel_ingot: 4, piston: 4, gear: 2 }, outputs: { engine_block: 1 }, energyRequired: 30, ticksToComplete: 10, tier: 4, age: 4 },
    { id: 'tire', inputs: { rubber: 2, steel_plate: 1 }, outputs: { tire: 1 }, energyRequired: 8, ticksToComplete: 3, tier: 4, age: 4 },

    // Final Goods
    { id: 'car_tire', inputs: { tire: 1, steel_plate: 1 }, outputs: { car_tire: 1 }, energyRequired: 5, ticksToComplete: 2, tier: 4, age: 4 },
    { id: 'lawn_mower', inputs: { engine_block: 1, steel_plate: 2, tire: 4 }, outputs: { lawn_mower: 1 }, energyRequired: 40, ticksToComplete: 12, tier: 4, age: 4 },
    { id: 'chainsaw', inputs: { engine_block: 1, gear: 2, plastic: 1 }, outputs: { chainsaw: 1 }, energyRequired: 35, ticksToComplete: 8, tier: 4, age: 4 },
    { id: 'generator', inputs: { engine_block: 1, copper_wire: 5, steel_plate: 2 }, outputs: { generator: 1 }, energyRequired: 40, ticksToComplete: 10, tier: 4, age: 4 },
    { id: 'scooter', inputs: { engine_block: 1, tire: 2, steel_beam: 2 }, outputs: { scooter: 1 }, energyRequired: 50, ticksToComplete: 15, tier: 4, age: 4 },
    { id: 'radio_transmitter', inputs: { plastic: 3, copper_wire: 2 }, outputs: { radio_transmitter: 1 }, energyRequired: 15, ticksToComplete: 5, tier: 4, age: 4 },
    { id: 'typewriter', inputs: { steel_plate: 2, gear: 10, plastic: 1 }, outputs: { typewriter: 1 }, energyRequired: 20, ticksToComplete: 8, tier: 4, age: 4 },
    { id: 'camera', inputs: { plastic: 2, glass: 2, gear: 2 }, outputs: { camera: 1 }, energyRequired: 15, ticksToComplete: 6, tier: 4, age: 4 },

    // --- AGE 5: ELECTRIC ---
    // Intermediates
    { id: 'aluminum_ingot', inputs: { bauxite: 2 }, outputs: { aluminum_ingot: 1 }, energyRequired: 25, ticksToComplete: 4, tier: 5, age: 5 },
    { id: 'aluminum_sheet', inputs: { aluminum_ingot: 2 }, outputs: { aluminum_sheet: 1 }, energyRequired: 15, ticksToComplete: 2, tier: 5, age: 5 },
    { id: 'electric_motor', inputs: { copper_wire: 5, steel_ingot: 1 }, outputs: { electric_motor: 1 }, energyRequired: 30, ticksToComplete: 5, tier: 5, age: 5 },
    { id: 'insulated_wire', inputs: { copper_wire: 1, plastic: 1 }, outputs: { insulated_wire: 2 }, energyRequired: 5, ticksToComplete: 1, tier: 5, age: 5 },
    { id: 'heating_element', inputs: { iron_rod: 1, copper_wire: 2 }, outputs: { heating_element: 1 }, energyRequired: 10, ticksToComplete: 2, tier: 5, age: 5 },

    // Final Goods
    { id: 'fan', inputs: { electric_motor: 1, plastic: 2 }, outputs: { fan: 1 }, energyRequired: 20, ticksToComplete: 5, tier: 5, age: 5 },
    { id: 'toaster', inputs: { heating_element: 2, aluminum_sheet: 1, plastic: 1 }, outputs: { toaster: 1 }, energyRequired: 15, ticksToComplete: 4, tier: 5, age: 5 },
    { id: 'vacuum', inputs: { electric_motor: 1, plastic: 3, pipe: 1 }, outputs: { vacuum: 1 }, energyRequired: 30, ticksToComplete: 6, tier: 5, age: 5 },
    { id: 'fridge', inputs: { aluminum_sheet: 4, electric_motor: 1, plastic: 2 }, outputs: { fridge: 1 }, energyRequired: 50, ticksToComplete: 10, tier: 5, age: 5 },
    { id: 'washer', inputs: { steel_plate: 3, electric_motor: 1, glass: 1 }, outputs: { washer: 1 }, energyRequired: 50, ticksToComplete: 10, tier: 5, age: 5 },
    { id: 'radio', inputs: { plastic: 2, insulated_wire: 3, copper_sheet: 1 }, outputs: { radio: 1 }, energyRequired: 25, ticksToComplete: 5, tier: 5, age: 5 },
    { id: 'drill', inputs: { electric_motor: 1, plastic: 2, gear: 1 }, outputs: { drill: 1 }, energyRequired: 25, ticksToComplete: 5, tier: 5, age: 5 },
    { id: 'mixer', inputs: { electric_motor: 1, glass: 1, plastic: 1 }, outputs: { mixer: 1 }, energyRequired: 20, ticksToComplete: 4, tier: 5, age: 5 },

    // --- AGE 6: DIGITAL ---
    // Intermediates
    { id: 'silicon', inputs: { sand: 4 }, outputs: { silicon: 1 }, energyRequired: 40, ticksToComplete: 5, tier: 6, age: 6 },
    { id: 'circuit_board', inputs: { plastic: 1, copper_sheet: 1 }, outputs: { circuit_board: 2 }, energyRequired: 15, ticksToComplete: 3, tier: 6, age: 6 },
    { id: 'cpu', inputs: { silicon: 2, circuit_board: 1 }, outputs: { cpu: 1 }, energyRequired: 50, ticksToComplete: 8, tier: 6, age: 6 },
    { id: 'screen', inputs: { glass: 2, plastic: 1, silicon: 1 }, outputs: { screen: 1 }, energyRequired: 30, ticksToComplete: 5, tier: 6, age: 6 },

    // Final Goods
    { id: 'computer', inputs: { cpu: 1, circuit_board: 2, aluminum_sheet: 2 }, outputs: { computer: 1 }, energyRequired: 100, ticksToComplete: 15, tier: 6, age: 6 },
    { id: 'tv', inputs: { screen: 1, circuit_board: 1, plastic: 4 }, outputs: { tv: 1 }, energyRequired: 80, ticksToComplete: 12, tier: 6, age: 6 },
    { id: 'microwave', inputs: { heating_element: 1, circuit_board: 1, steel_plate: 2 }, outputs: { microwave: 1 }, energyRequired: 60, ticksToComplete: 8, tier: 6, age: 6 },
    { id: 'calculator', inputs: { circuit_board: 1, screen: 1, plastic: 1 }, outputs: { calculator: 1 }, energyRequired: 20, ticksToComplete: 4, tier: 6, age: 6 },
    { id: 'console', inputs: { cpu: 1, plastic: 3, copper_wire: 2 }, outputs: { console: 1 }, energyRequired: 70, ticksToComplete: 10, tier: 6, age: 6 },
    { id: 'printer', inputs: { electric_motor: 1, circuit_board: 1, plastic: 3 }, outputs: { printer: 1 }, energyRequired: 60, ticksToComplete: 8, tier: 6, age: 6 },
    { id: 'watch_digital', inputs: { circuit_board: 1, plastic: 1 }, outputs: { watch_digital: 1 }, energyRequired: 15, ticksToComplete: 3, tier: 6, age: 6 },

    // --- AGE 7: FUTURE ---
    // Intermediates
    { id: 'adv_battery', inputs: { bauxite: 1, rare_earth_ore: 1, plastic: 1 }, outputs: { adv_battery: 1 }, energyRequired: 60, ticksToComplete: 6, tier: 7, age: 7 }, // simplified lithium
    { id: 'composite', inputs: { plastic: 2, coal: 2 }, outputs: { composite: 1 }, energyRequired: 80, ticksToComplete: 6, tier: 7, age: 7 },
    { id: 'ai_core', inputs: { cpu: 4, rare_earth_ore: 2 }, outputs: { ai_core: 1 }, energyRequired: 200, ticksToComplete: 20, tier: 7, age: 7 },
    { id: 'superconductor', inputs: { rare_earth_ore: 2, copper_wire: 4 }, outputs: { superconductor: 1 }, energyRequired: 150, ticksToComplete: 10, tier: 7, age: 7 },

    // Final Goods
    { id: 'smartphone', inputs: { cpu: 1, screen: 1, adv_battery: 1 }, outputs: { smartphone: 1 }, energyRequired: 80, ticksToComplete: 10, tier: 7, age: 7 },
    { id: 'drone', inputs: { electric_motor: 4, adv_battery: 1, circuit_board: 1 }, outputs: { drone: 1 }, energyRequired: 90, ticksToComplete: 10, tier: 7, age: 7 },
    { id: 'robot', inputs: { ai_core: 1, electric_motor: 6, composite: 4, adv_battery: 2 }, outputs: { robot: 1 }, energyRequired: 300, ticksToComplete: 30, tier: 7, age: 7 },
    { id: 'vr_headset', inputs: { screen: 2, cpu: 1, plastic: 2 }, outputs: { vr_headset: 1 }, energyRequired: 100, ticksToComplete: 12, tier: 7, age: 7 },
    { id: 'electric_car', inputs: { composite: 6, adv_battery: 4, electric_motor: 2, screen: 1 }, outputs: { electric_car: 1 }, energyRequired: 500, ticksToComplete: 50, tier: 7, age: 7 },
    { id: 'laser', inputs: { rare_earth_ore: 1, glass: 2, circuit_board: 2 }, outputs: { laser: 1 }, energyRequired: 150, ticksToComplete: 15, tier: 7, age: 7 },
    { id: 'solar_panel_item', inputs: { silicon: 4, glass: 2, aluminum_sheet: 1 }, outputs: { solar_panel_item: 1 }, energyRequired: 80, ticksToComplete: 8, tier: 7, age: 7 },

    // --- MACHINES & GENERATORS ---
    { id: 'basic_assembler', inputs: { iron_plate: 4, iron_rod: 4 }, outputs: { basic_assembler: 1 }, energyRequired: 10, ticksToComplete: 5, tier: 1, age: 1 },
    { id: 'stone_furnace', inputs: { stone: 8 }, outputs: { stone_furnace: 1 }, energyRequired: 0, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'treadwheel', inputs: { wood: 10 }, outputs: { treadwheel: 1 }, energyRequired: 0, ticksToComplete: 5, tier: 1, age: 1 },
    
    { id: 'foundry', inputs: { bricks: 10, steel_beam: 4 }, outputs: { foundry: 1 }, energyRequired: 50, ticksToComplete: 10, tier: 3, age: 3 },
    { id: 'steam_engine_gen', inputs: { steel_plate: 10, boiler: 1, piston: 2 }, outputs: { steam_engine_gen: 1 }, energyRequired: 100, ticksToComplete: 20, tier: 3, age: 3 },
    { id: 'precision_assembler', inputs: { steel_plate: 10, gear: 10, electric_motor: 2 }, outputs: { precision_assembler: 1 }, energyRequired: 100, ticksToComplete: 20, tier: 3, age: 3 },
    
    { id: 'chemical_plant', inputs: { steel_plate: 10, pipe: 10, glass: 5 }, outputs: { chemical_plant: 1 }, energyRequired: 150, ticksToComplete: 25, tier: 4, age: 4 },
    { id: 'diesel_gen', inputs: { engine_block: 2, generator: 1 }, outputs: { diesel_gen: 1 }, energyRequired: 200, ticksToComplete: 25, tier: 4, age: 4 },
    
    { id: 'electronics_fab', inputs: { composite: 10, ai_core: 1, laser: 2 }, outputs: { electronics_fab: 1 }, energyRequired: 500, ticksToComplete: 40, tier: 7, age: 7 },
    { id: 'solar_array', inputs: { solar_panel_item: 16, aluminum_sheet: 4 }, outputs: { solar_array: 1 }, energyRequired: 500, ticksToComplete: 50, tier: 7, age: 7 },
    { id: 'fusion_reactor', inputs: { superconductor: 20, concrete: 100, ai_core: 2 }, outputs: { fusion_reactor: 1 }, energyRequired: 2000, ticksToComplete: 100, tier: 7, age: 7 }
  ],

  // ============================================================================
  // Market Dynamics
  // ============================================================================
  market: {
    noveltyBonus: 2.5,       // Increased novelty
    decayRate: 0.04,
    recoveryRate: 0.02,
    minPopularity: 0.5,
    maxPopularity: 2.5
  },

  // ============================================================================
  // Research
  // ============================================================================
  research: {
    energyCost: 3,
    discoveryChance: 0.20, // Slightly easier
    proximityWeight: 0.5
  },

  // ============================================================================
  // Machines
  // ============================================================================
  machines: [
    {
      id: 'stone_furnace',
      itemId: 'stone_furnace',
      name: 'Stone Furnace',
      sizeX: 2, sizeY: 2,
      energyConsumption: 1,
      animation: { frames: 4, speed: 0.1 },
      allowedRecipes: [
        'iron_ingot', 'copper_ingot', 'bricks', 'glass', 'stone_bricks' // Basic smelting
      ]
    },
    {
      id: 'basic_assembler',
      itemId: 'basic_assembler',
      name: 'Basic Assembler',
      sizeX: 1, sizeY: 2,
      energyConsumption: 2,
      animation: { frames: 4, speed: 0.1 },
      allowedRecipes: [
        // Age 1
        'planks', 'wooden_beam', 'iron_plate', 'iron_rod', 'nails',
        'chair', 'table', 'wardrobe', 'chest', 'bucket', 'hammer', 'pickaxe', 'shovel', 'fence', 'door', 'stone_wall',
        // Age 2
        'copper_sheet', 'pipe',
        'vase', 'pot', 'mirror', 'window', 'lantern', 'kettle', 'fountain', 'aqueduct_section', 'spyglass',
        // Machine Self-build
        'basic_assembler', 'stone_furnace', 'treadwheel'
      ]
    },
    {
      id: 'foundry',
      itemId: 'foundry',
      name: 'Industrial Foundry',
      sizeX: 3, sizeY: 3,
      energyConsumption: 10,
      animation: { frames: 4, speed: 0.1 },
      allowedRecipes: [
        'steel_ingot', 'aluminum_ingot', 'silicon' // Advanced smelting
      ]
    },
    {
      id: 'chemical_plant',
      itemId: 'chemical_plant',
      name: 'Chemical Plant',
      sizeX: 3, sizeY: 2,
      energyConsumption: 8,
      animation: { frames: 4, speed: 0.1 },
      allowedRecipes: [
        'concrete', 'plastic', 'rubber', 'composite' // Refining
      ]
    },
    {
      id: 'precision_assembler',
      itemId: 'precision_assembler',
      name: 'Precision Assembler',
      sizeX: 2, sizeY: 2,
      energyConsumption: 15,
      animation: { frames: 4, speed: 0.2 },
      allowedRecipes: [
        // Age 3
        'gear', 'bricks',
        'steel_beam', 'steel_plate', 'piston', 'boiler',
        'vault_door', 'stove', 'bicycle', 'clock', 'printing_press', 'sewing_machine', 'tool_box', 'radiator',
        // Age 4
        'copper_wire',
        'engine_block', 'tire',
        'car_tire', 'lawn_mower', 'chainsaw', 'generator', 'scooter', 'radio_transmitter', 'typewriter', 'camera',
        // Age 5
        'aluminum_sheet', 'electric_motor', 'insulated_wire', 'heating_element',
        'fan', 'toaster', 'vacuum', 'fridge', 'washer', 'radio', 'drill', 'mixer',
        // Machines
        'foundry', 'steam_engine_gen', 'chemical_plant', 'diesel_gen', 'precision_assembler'
      ]
    },
    {
      id: 'electronics_fab',
      itemId: 'electronics_fab',
      name: 'Electronics Fab',
      sizeX: 3, sizeY: 3,
      energyConsumption: 50,
      animation: { frames: 4, speed: 0.1 },
      allowedRecipes: [
        // Age 6
        'circuit_board', 'cpu', 'screen',
        'computer', 'tv', 'microwave', 'calculator', 'console', 'printer', 'watch_digital',
        // Age 7
        'adv_battery', 'ai_core', 'superconductor',
        'smartphone', 'drone', 'robot', 'vr_headset', 'electric_car', 'laser', 'solar_panel_item',
        // Machines
        'electronics_fab', 'solar_array', 'fusion_reactor'
      ]
    }
  ],

  // ============================================================================
  // Generators
  // ============================================================================
  generators: [
    {
      id: 'treadwheel',
      itemId: 'treadwheel',
      name: 'Treadwheel',
      sizeX: 2, sizeY: 3,
      energyOutput: 5,
      animation: { frames: 4, speed: 0.05 }
    },
    {
      id: 'steam_engine_gen',
      itemId: 'steam_engine_gen',
      name: 'Steam Turbine',
      sizeX: 3, sizeY: 4,
      energyOutput: 100,
      animation: { frames: 4, speed: 0.08 }
    },
    {
      id: 'diesel_gen',
      itemId: 'diesel_gen',
      name: 'Diesel Generator',
      sizeX: 3, sizeY: 3,
      energyOutput: 300,
      animation: { frames: 4, speed: 0.08 }
    },
    {
      id: 'solar_array',
      itemId: 'solar_array',
      name: 'Solar Array',
      sizeX: 6, sizeY: 6,
      energyOutput: 800,
      animation: { frames: 1, speed: 0 }
    },
    {
      id: 'fusion_reactor',
      itemId: 'fusion_reactor',
      name: 'Fusion Reactor',
      sizeX: 8, sizeY: 8,
      energyOutput: 100000,
      animation: { frames: 4, speed: 0.1 }
    }
  ],

  // ============================================================================
  // Floor & Inventory
  // ============================================================================
  floorSpace: {
    expansionType: 'spiral',
    initialWidth: 16,
    initialHeight: 16,
    initialChunkSize: 4,
    costPerCell: 10
  },
  inventorySpace: {
    baseCost: 50,
    costGrowth: 1.5,
    upgradeAmount: 50
  },

  // ============================================================================
  // Exploration
  // ============================================================================
  exploration: {
    initialExploredSize: 8,
    initialGeneratedSize: 64,
    maxGeneratedSize: 256,
    baseCostPerCell: 15,
    nodeUnlockCost: 100,
    nodeSpawnChance: 0.15,
    terrainScale: 10,
    moistureScale: 8,

    terrainTypes: {
      water:     { id: 'water',     name: 'Water',     color: 0x3b82f6 },
      plains:    { id: 'plains',    name: 'Plains',    color: 0xfbbf24 },
      grassland: { id: 'grassland', name: 'Grassland', color: 0x84cc16 },
      forest:    { id: 'forest',    name: 'Forest',    color: 0x16a34a },
      jungle:    { id: 'jungle',    name: 'Jungle',    color: 0x15803d },
      hills:     { id: 'hills',     name: 'Hills',     color: 0xa3a3a3 },
      mountain:  { id: 'mountain',  name: 'Mountain',  color: 0x78716c },
      desert:    { id: 'desert',    name: 'Desert',    color: 0xd97706 },
      swamp:     { id: 'swamp',     name: 'Swamp',     color: 0x4d7c0f }
    },

    resourceAffinities: {
      plains:    { clay: 0.4, sand: 0.2 },
      grassland: { clay: 0.4 },
      forest:    { wood: 0.8 },
      jungle:    { wood: 0.6, bauxite: 0.4 },
      hills:     { stone: 0.4, iron_ore: 0.3, copper_ore: 0.3, coal: 0.2 },
      mountain:  { stone: 0.2, iron_ore: 0.3, coal: 0.3, rare_earth_ore: 0.1 },
      desert:    { sand: 0.8, oil: 0.3 },
      swamp:     { oil: 0.5, clay: 0.3 },
      water:     { } 
    }
  }
};
