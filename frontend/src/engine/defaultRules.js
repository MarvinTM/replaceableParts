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
    { id: 'rope', name: 'Rope', basePrice: 3, category: 'intermediate', weight: 1, age: 1 },
    { id: 'wooden_dowel', name: 'Wooden Dowel', basePrice: 3, category: 'intermediate', weight: 1, age: 1 },
    { id: 'stone_slab', name: 'Stone Slab', basePrice: 6, category: 'intermediate', weight: 4, age: 1 },
    { id: 'iron_wire', name: 'Iron Wire', basePrice: 4, category: 'intermediate', weight: 1, age: 1 },
    { id: 'iron_bracket', name: 'Iron Bracket', basePrice: 7, category: 'intermediate', weight: 2, age: 1 },
    { id: 'hinges', name: 'Iron Hinges', basePrice: 8, category: 'intermediate', weight: 1, age: 1 },
    { id: 'mortar', name: 'Mortar', basePrice: 3, category: 'intermediate', weight: 2, age: 1 },
    { id: 'iron_chain', name: 'Iron Chain', basePrice: 10, category: 'intermediate', weight: 3, age: 1 },
    { id: 'stone_tile', name: 'Stone Tile', basePrice: 4, category: 'intermediate', weight: 2, age: 1 },
    { id: 'wooden_shingle', name: 'Wooden Shingle', basePrice: 3, category: 'intermediate', weight: 1, age: 1 },
    { id: 'iron_axle', name: 'Iron Axle', basePrice: 12, category: 'intermediate', weight: 5, age: 1 },
    { id: 'wheel', name: 'Wooden Wheel', basePrice: 10, category: 'intermediate', weight: 4, age: 1 },
    { id: 'wooden_handle', name: 'Wooden Handle', basePrice: 3, category: 'intermediate', weight: 1, age: 1 },

    // Final Goods (Furniture, Basic Tools, Structures)
    { id: 'chair', name: 'Wooden Chair', basePrice: 15, category: 'final', weight: 5, age: 1 },
    { id: 'table', name: 'Wooden Table', basePrice: 40, category: 'final', weight: 10, age: 1 },
    { id: 'wardrobe', name: 'Wardrobe', basePrice: 60, category: 'final', weight: 15, age: 1 },
    { id: 'chest', name: 'Storage Chest', basePrice: 40, category: 'final', weight: 8, age: 1 },
    { id: 'bucket', name: 'Iron Bucket', basePrice: 18, category: 'final', weight: 3, age: 1 },
    { id: 'hammer', name: 'Hammer', basePrice: 10, category: 'final', weight: 4, age: 1 },
    { id: 'pickaxe', name: 'Pickaxe', basePrice: 15, category: 'final', weight: 5, age: 1 },
    { id: 'shovel', name: 'Shovel', basePrice: 20, category: 'final', weight: 4, age: 1 },
    { id: 'fence', name: 'Fence Section', basePrice: 4, category: 'final', weight: 5, age: 1 },
    { id: 'door', name: 'Reinforced Door', basePrice: 60, category: 'final', weight: 12, age: 1 },
    { id: 'stone_wall', name: 'Stone Wall', basePrice: 5, category: 'final', weight: 10, age: 1 },
    { id: 'bed', name: 'Wooden Bed', basePrice: 40, category: 'final', weight: 12, age: 1 },
    { id: 'bench', name: 'Wooden Bench', basePrice: 14, category: 'final', weight: 6, age: 1 },
    { id: 'ladder', name: 'Wooden Ladder', basePrice: 18, category: 'final', weight: 5, age: 1 },
    { id: 'wheelbarrow', name: 'Wheelbarrow', basePrice: 65, category: 'final', weight: 10, age: 1 },
    { id: 'cart', name: 'Hand Cart', basePrice: 125, category: 'final', weight: 20, age: 1 },
    { id: 'barrel', name: 'Wooden Barrel', basePrice: 22, category: 'final', weight: 8, age: 1 },
    { id: 'anvil', name: 'Iron Anvil', basePrice: 50, category: 'final', weight: 30, age: 1 },
    { id: 'bellows', name: 'Forge Bellows', basePrice: 28, category: 'final', weight: 6, age: 1 },
    { id: 'axe', name: 'Iron Axe', basePrice: 20, category: 'final', weight: 4, age: 1 },
    { id: 'saw', name: 'Hand Saw', basePrice: 20, category: 'final', weight: 3, age: 1 },
    { id: 'chisel', name: 'Iron Chisel', basePrice: 4, category: 'final', weight: 2, age: 1 },
    { id: 'mallet', name: 'Wooden Mallet', basePrice: 12, category: 'final', weight: 3, age: 1 },
    { id: 'shield', name: 'Iron Shield', basePrice: 40, category: 'final', weight: 10, age: 1 },
    { id: 'spear', name: 'Iron Spear', basePrice: 10, category: 'final', weight: 4, age: 1 },
    { id: 'gate', name: 'Wooden Gate', basePrice: 50, category: 'final', weight: 15, age: 1 },
    { id: 'staircase', name: 'Wooden Staircase', basePrice: 32, category: 'final', weight: 12, age: 1 },
    { id: 'roof_tile_section', name: 'Roof Tile Section', basePrice: 5, category: 'final', weight: 8, age: 1 },
    { id: 'well', name: 'Stone Well', basePrice: 70, category: 'final', weight: 25, age: 1 },
    { id: 'workbench', name: 'Workbench', basePrice: 26, category: 'final', weight: 15, age: 1 },
    { id: 'forge', name: 'Stone Forge', basePrice: 45, category: 'final', weight: 35, age: 1 },
    { id: 'crate', name: 'Wooden Crate', basePrice: 16, category: 'final', weight: 6, age: 1 },
    { id: 'bridge_section', name: 'Wooden Bridge Section', basePrice: 95, category: 'final', weight: 20, age: 1 },
    { id: 'plow', name: 'Iron Plow', basePrice: 35, category: 'final', weight: 12, age: 1 },
    { id: 'stone_pillar', name: 'Stone Pillar', basePrice: 25, category: 'final', weight: 15, age: 1 },
    { id: 'tool_rack', name: 'Tool Rack', basePrice: 12, category: 'final', weight: 5, age: 1 },
    { id: 'shield_rack', name: 'Weapon Rack', basePrice: 22, category: 'final', weight: 6, age: 1 },
    { id: 'iron_grate', name: 'Iron Grate', basePrice: 20, category: 'final', weight: 8, age: 1 },
    { id: 'coat_hanger', name: 'Coat Hanger', basePrice: 4, category: 'final', weight: 2, age: 1 },
    { id: 'shingled_roof', name: 'Shingled Roof Section', basePrice: 15, category: 'final', weight: 12, age: 1 },
    { id: 'wagon', name: 'Wooden Wagon', basePrice: 200, category: 'final', weight: 35, age: 1 },
    { id: 'water_wheel', name: 'Water Wheel', basePrice: 250, category: 'final', weight: 30, age: 1 },
    { id: 'anchor', name: 'Iron Anchor', basePrice: 45, category: 'final', weight: 25, age: 1 },

    // ========================
    // AGE 2: REFINEMENT (Copper, Clay, Glass)
    // ========================
    // Parts
    { id: 'glass', name: 'Glass', basePrice: 8, category: 'intermediate', weight: 2, age: 2 },
    { id: 'copper_ingot', name: 'Copper Ingot', basePrice: 8, category: 'intermediate', weight: 3, age: 2 },
    { id: 'copper_sheet', name: 'Copper Sheet', basePrice: 12, category: 'intermediate', weight: 3, age: 2 },
    { id: 'pipe', name: 'Copper Pipe', basePrice: 15, category: 'intermediate', weight: 3, age: 2 },
    { id: 'ceramic_tile', name: 'Ceramic Tile', basePrice: 6, category: 'intermediate', weight: 2, age: 2 },
    { id: 'glass_pane', name: 'Glass Pane', basePrice: 5, category: 'intermediate', weight: 1, age: 2 },
    { id: 'copper_tubing', name: 'Copper Tubing', basePrice: 10, category: 'intermediate', weight: 2, age: 2 },
    { id: 'brass_ingot', name: 'Brass Ingot', basePrice: 12, category: 'intermediate', weight: 3, age: 2 },
    { id: 'brass_sheet', name: 'Brass Sheet', basePrice: 14, category: 'intermediate', weight: 3, age: 2 },
    { id: 'decorative_glass', name: 'Decorative Glass', basePrice: 15, category: 'intermediate', weight: 2, age: 2 },
    { id: 'terracotta', name: 'Terracotta', basePrice: 7, category: 'intermediate', weight: 3, age: 2 },
    { id: 'porcelain', name: 'Porcelain', basePrice: 12, category: 'intermediate', weight: 2, age: 2 },
    { id: 'glass_lens', name: 'Glass Lens', basePrice: 10, category: 'intermediate', weight: 1, age: 2 },
    { id: 'copper_rod', name: 'Copper Rod', basePrice: 8, category: 'intermediate', weight: 2, age: 2 },
    { id: 'bronze_ingot', name: 'Bronze Ingot', basePrice: 11, category: 'intermediate', weight: 3, age: 2 },

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
    { id: 'chandelier', name: 'Glass Chandelier', basePrice: 70, category: 'final', weight: 8, age: 2 },
    { id: 'stained_glass', name: 'Stained Glass Panel', basePrice: 55, category: 'final', weight: 6, age: 2 },
    { id: 'telescope', name: 'Telescope', basePrice: 90, category: 'final', weight: 5, age: 2 },
    { id: 'compass', name: 'Brass Compass', basePrice: 50, category: 'final', weight: 1, age: 2 },
    { id: 'plate_set', name: 'Porcelain Plate Set', basePrice: 35, category: 'final', weight: 4, age: 2 },
    { id: 'tile_floor', name: 'Tile Floor Section', basePrice: 30, category: 'final', weight: 10, age: 2 },
    { id: 'bathtub', name: 'Copper Bathtub', basePrice: 85, category: 'final', weight: 25, age: 2 },
    { id: 'sink', name: 'Copper Sink', basePrice: 40, category: 'final', weight: 8, age: 2 },
    { id: 'decorative_urn', name: 'Decorative Urn', basePrice: 45, category: 'final', weight: 6, age: 2 },
    { id: 'chimney', name: 'Brick Chimney', basePrice: 50, category: 'final', weight: 15, age: 2 },
    { id: 'greenhouse_panel', name: 'Greenhouse Panel', basePrice: 38, category: 'final', weight: 5, age: 2 },
    { id: 'church_bell', name: 'Church Bell', basePrice: 95, category: 'final', weight: 20, age: 2 },
    { id: 'candelabra', name: 'Brass Candelabra', basePrice: 48, category: 'final', weight: 3, age: 2 },
    { id: 'pottery_wheel', name: 'Pottery Wheel', basePrice: 55, category: 'final', weight: 12, age: 2 },
    { id: 'barometer', name: 'Barometer', basePrice: 60, category: 'final', weight: 3, age: 2 },
    { id: 'hourglass', name: 'Hourglass', basePrice: 32, category: 'final', weight: 2, age: 2 },
    { id: 'ceramic_bowl', name: 'Ceramic Bowl', basePrice: 18, category: 'final', weight: 2, age: 2 },
    { id: 'copper_statue', name: 'Copper Statue', basePrice: 75, category: 'final', weight: 15, age: 2 },
    { id: 'magnifying_glass', name: 'Magnifying Glass', basePrice: 42, category: 'final', weight: 1, age: 2 },
    { id: 'sundial', name: 'Stone Sundial', basePrice: 38, category: 'final', weight: 8, age: 2 },
    { id: 'bronze_armor', name: 'Bronze Armor', basePrice: 85, category: 'final', weight: 20, age: 2 },

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
    { id: 'steel_gear', name: 'Steel Gear', basePrice: 18, category: 'intermediate', weight: 2, age: 3 },
    { id: 'steel_cable', name: 'Steel Cable', basePrice: 25, category: 'intermediate', weight: 4, age: 3 },
    { id: 'steam_valve', name: 'Steam Valve', basePrice: 35, category: 'intermediate', weight: 3, age: 3 },
    { id: 'drive_shaft', name: 'Drive Shaft', basePrice: 38, category: 'intermediate', weight: 7, age: 3 },
    { id: 'flywheel', name: 'Flywheel', basePrice: 45, category: 'intermediate', weight: 10, age: 3 },
    { id: 'steel_rivet', name: 'Steel Rivet', basePrice: 8, category: 'intermediate', weight: 1, age: 3 },
    { id: 'steel_spring', name: 'Steel Spring', basePrice: 15, category: 'intermediate', weight: 1, age: 3 },
    { id: 'ball_bearing', name: 'Ball Bearing', basePrice: 20, category: 'intermediate', weight: 1, age: 3 },
    { id: 'steel_chain', name: 'Steel Chain', basePrice: 22, category: 'intermediate', weight: 3, age: 3 },
    { id: 'pressure_gauge', name: 'Pressure Gauge', basePrice: 30, category: 'intermediate', weight: 2, age: 3 },
    { id: 'steel_pipe', name: 'Steel Pipe', basePrice: 20, category: 'intermediate', weight: 4, age: 3 },
    { id: 'coupling', name: 'Pipe Coupling', basePrice: 16, category: 'intermediate', weight: 2, age: 3 },
    { id: 'camshaft', name: 'Camshaft', basePrice: 42, category: 'intermediate', weight: 6, age: 3 },
    { id: 'crankshaft', name: 'Crankshaft', basePrice: 48, category: 'intermediate', weight: 7, age: 3 },
    { id: 'steel_rod', name: 'Steel Rod', basePrice: 18, category: 'intermediate', weight: 3, age: 3 },

    // Final Goods (Heavy Machines, Appliances)
    { id: 'vault_door', name: 'Vault Door', basePrice: 150, category: 'final', weight: 50, age: 3 },
    { id: 'stove', name: 'Wood Stove', basePrice: 100, category: 'final', weight: 40, age: 3 },
    { id: 'bicycle', name: 'Bicycle', basePrice: 120, category: 'final', weight: 15, age: 3 },
    { id: 'clock', name: 'Grandfather Clock', basePrice: 180, category: 'final', weight: 25, age: 3 },
    { id: 'printing_press', name: 'Printing Press', basePrice: 250, category: 'final', weight: 60, age: 3 },
    { id: 'sewing_machine', name: 'Sewing Machine', basePrice: 140, category: 'final', weight: 15, age: 3 },
    { id: 'tool_box', name: 'Mechanic\'s Toolbox', basePrice: 80, category: 'final', weight: 10, age: 3 },
    { id: 'radiator', name: 'Steam Radiator', basePrice: 90, category: 'final', weight: 20, age: 3 },
    { id: 'locomotive', name: 'Steam Locomotive', basePrice: 500, category: 'final', weight: 200, age: 3 },
    { id: 'industrial_furnace', name: 'Industrial Furnace', basePrice: 280, category: 'final', weight: 80, age: 3 },
    { id: 'lathe', name: 'Metal Lathe', basePrice: 220, category: 'final', weight: 50, age: 3 },
    { id: 'milling_machine', name: 'Milling Machine', basePrice: 260, category: 'final', weight: 55, age: 3 },
    { id: 'safe', name: 'Steel Safe', basePrice: 180, category: 'final', weight: 45, age: 3 },
    { id: 'crane', name: 'Industrial Crane', basePrice: 350, category: 'final', weight: 100, age: 3 },
    { id: 'elevator', name: 'Elevator System', basePrice: 400, category: 'final', weight: 90, age: 3 },
    { id: 'mechanical_loom', name: 'Mechanical Loom', basePrice: 190, category: 'final', weight: 40, age: 3 },
    { id: 'pocket_watch', name: 'Pocket Watch', basePrice: 95, category: 'final', weight: 1, age: 3 },
    { id: 'manhole_cover', name: 'Manhole Cover', basePrice: 65, category: 'final', weight: 20, age: 3 },
    { id: 'steel_bridge', name: 'Steel Bridge Section', basePrice: 320, category: 'final', weight: 120, age: 3 },
    { id: 'water_tower', name: 'Water Tower', basePrice: 280, category: 'final', weight: 100, age: 3 },
    { id: 'industrial_press', name: 'Hydraulic Press', basePrice: 240, category: 'final', weight: 70, age: 3 },
    { id: 'steam_hammer', name: 'Steam Hammer', basePrice: 270, category: 'final', weight: 85, age: 3 },
    { id: 'rail_track', name: 'Rail Track Section', basePrice: 110, category: 'final', weight: 40, age: 3 },
    { id: 'padlock', name: 'Steel Padlock', basePrice: 30, category: 'final', weight: 2, age: 3 },
    { id: 'wrench', name: 'Steel Wrench', basePrice: 28, category: 'final', weight: 2, age: 3 },
    { id: 'pipe_organ', name: 'Pipe Organ', basePrice: 450, category: 'final', weight: 150, age: 3 },
    { id: 'industrial_boiler', name: 'Industrial Boiler', basePrice: 310, category: 'final', weight: 95, age: 3 },
    { id: 'conveyor_belt', name: 'Conveyor Belt', basePrice: 180, category: 'final', weight: 50, age: 3 },
    { id: 'pressure_cooker', name: 'Pressure Cooker', basePrice: 95, category: 'final', weight: 15, age: 3 },
    { id: 'plumbing_system', name: 'Plumbing System', basePrice: 140, category: 'final', weight: 35, age: 3 },
    { id: 'rotary_engine', name: 'Rotary Engine', basePrice: 320, category: 'final', weight: 110, age: 3 },

    // ========================
    // AGE 4: COMBUSTION (Oil, Plastic, Rubber, Concrete)
    // ========================
    // Parts
    { id: 'copper_wire', name: 'Copper Wire', basePrice: 10, category: 'intermediate', weight: 1, age: 4 },
    { id: 'concrete', name: 'Concrete', basePrice: 15, category: 'intermediate', weight: 10, age: 4 },
    { id: 'plastic', name: 'Plastic', basePrice: 15, category: 'intermediate', weight: 1, age: 4 },
    { id: 'rubber', name: 'Rubber', basePrice: 18, category: 'intermediate', weight: 2, age: 4 },
    { id: 'leather', name: 'Leather', basePrice: 20, category: 'intermediate', weight: 2, age: 4 },
    { id: 'vacuum_tube', name: 'Vacuum Tube', basePrice: 25, category: 'intermediate', weight: 0.5, age: 4 },
    { id: 'engine_block', name: 'Combustion Engine', basePrice: 100, category: 'intermediate', weight: 25, age: 4 },
    { id: 'tire', name: 'Rubber Tire', basePrice: 30, category: 'intermediate', weight: 5, age: 4 },
    { id: 'gasoline', name: 'Gasoline', basePrice: 12, category: 'intermediate', weight: 1, age: 4 },
    { id: 'diesel_fuel', name: 'Diesel Fuel', basePrice: 11, category: 'intermediate', weight: 1, age: 4 },
    { id: 'lubricant', name: 'Lubricant Oil', basePrice: 10, category: 'intermediate', weight: 1, age: 4 },
    { id: 'carburetor', name: 'Carburetor', basePrice: 35, category: 'intermediate', weight: 3, age: 4 },
    { id: 'spark_plug', name: 'Spark Plug', basePrice: 12, category: 'intermediate', weight: 1, age: 4 },
    { id: 'battery', name: 'Lead-Acid Battery', basePrice: 40, category: 'intermediate', weight: 8, age: 4 },
    { id: 'light_bulb', name: 'Light Bulb', basePrice: 8, category: 'intermediate', weight: 0.5, age: 4 },
    { id: 'glass_bottle', name: 'Glass Bottle', basePrice: 6, category: 'intermediate', weight: 1, age: 4 },
    { id: 'plastic_sheet', name: 'Plastic Sheet', basePrice: 12, category: 'intermediate', weight: 2, age: 4 },
    { id: 'fiberglass', name: 'Fiberglass', basePrice: 20, category: 'intermediate', weight: 3, age: 4 },
    { id: 'vinyl', name: 'Vinyl', basePrice: 14, category: 'intermediate', weight: 2, age: 4 },
    { id: 'synthetic_fabric', name: 'Synthetic Fabric', basePrice: 16, category: 'intermediate', weight: 1, age: 4 },
    { id: 'asphalt', name: 'Asphalt', basePrice: 10, category: 'intermediate', weight: 8, age: 4 },

    // Final Goods (Vehicles, Consumer Goods)
    { id: 'car_tire', name: 'Car Wheel', basePrice: 50, category: 'final', weight: 10, age: 4 },
    { id: 'lawn_mower', name: 'Lawn Mower', basePrice: 200, category: 'final', weight: 25, age: 4 },
    { id: 'chainsaw', name: 'Chainsaw', basePrice: 150, category: 'final', weight: 10, age: 4 },
    { id: 'generator', name: 'Portable Generator', basePrice: 300, category: 'final', weight: 40, age: 4 },
    { id: 'scooter', name: 'Motor Scooter', basePrice: 400, category: 'final', weight: 50, age: 4 },
    { id: 'radio_transmitter', name: 'Radio Transmitter', basePrice: 80, category: 'final', weight: 2, age: 4 },
    { id: 'typewriter', name: 'Typewriter', basePrice: 120, category: 'final', weight: 8, age: 4 },
    { id: 'camera', name: 'Film Camera', basePrice: 150, category: 'final', weight: 2, age: 4 },
    { id: 'motorcycle', name: 'Motorcycle', basePrice: 550, category: 'final', weight: 80, age: 4 },
    { id: 'car_engine', name: 'Automobile Engine', basePrice: 450, category: 'final', weight: 120, age: 4 },
    { id: 'industrial_pump', name: 'Industrial Pump', basePrice: 280, category: 'final', weight: 45, age: 4 },
    { id: 'power_saw', name: 'Power Saw', basePrice: 180, category: 'final', weight: 12, age: 4 },
    { id: 'jackhammer', name: 'Pneumatic Jackhammer', basePrice: 220, category: 'final', weight: 28, age: 4 },
    { id: 'concrete_mixer', name: 'Concrete Mixer', basePrice: 340, category: 'final', weight: 75, age: 4 },
    { id: 'traffic_light', name: 'Traffic Signal', basePrice: 160, category: 'final', weight: 15, age: 4 },
    { id: 'street_lamp', name: 'Street Lamp', basePrice: 95, category: 'final', weight: 12, age: 4 },
    { id: 'telephone', name: 'Telephone', basePrice: 75, category: 'final', weight: 3, age: 4 },
    { id: 'vinyl_record', name: 'Vinyl Record', basePrice: 20, category: 'final', weight: 1, age: 4 },
    { id: 'plastic_container', name: 'Plastic Container', basePrice: 12, category: 'final', weight: 1, age: 4 },
    { id: 'garden_hose', name: 'Garden Hose', basePrice: 25, category: 'final', weight: 3, age: 4 },
    { id: 'fuel_tank', name: 'Fuel Storage Tank', basePrice: 110, category: 'final', weight: 30, age: 4 },
    { id: 'oil_drum', name: 'Oil Drum', basePrice: 45, category: 'final', weight: 15, age: 4 },
    { id: 'flashlight', name: 'Flashlight', basePrice: 35, category: 'final', weight: 1, age: 4 },
    { id: 'automobile', name: 'Automobile', basePrice: 1200, category: 'final', weight: 250, age: 4 },
    { id: 'road_segment', name: 'Paved Road Section', basePrice: 180, category: 'final', weight: 100, age: 4 },
    { id: 'leather_jacket', name: 'Leather Jacket', basePrice: 120, category: 'final', weight: 3, age: 4 },
    { id: 'amplifier', name: 'Tube Amplifier', basePrice: 140, category: 'final', weight: 8, age: 4 },
    { id: 'diesel_truck', name: 'Diesel Truck', basePrice: 1500, category: 'final', weight: 350, age: 4 },
    { id: 'chemistry_set', name: 'Chemistry Set', basePrice: 65, category: 'final', weight: 4, age: 4 },
    { id: 'raincoat', name: 'Raincoat', basePrice: 45, category: 'final', weight: 2, age: 4 },
    { id: 'kayak', name: 'Fiberglass Kayak', basePrice: 220, category: 'final', weight: 15, age: 4 },

    // ========================
    // AGE 5: ELECTRIC (Aluminum, Electronics v1)
    // ========================
    // Parts
    { id: 'aluminum_ingot', name: 'Aluminum Ingot', basePrice: 25, category: 'intermediate', weight: 2, age: 5 },
    { id: 'aluminum_sheet', name: 'Aluminum Sheet', basePrice: 30, category: 'intermediate', weight: 2, age: 5 },
    { id: 'electric_motor', name: 'Electric Motor', basePrice: 60, category: 'intermediate', weight: 5, age: 5 },
    { id: 'insulated_wire', name: 'Insulated Cable', basePrice: 15, category: 'intermediate', weight: 1, age: 5 },
    { id: 'heating_element', name: 'Heating Element', basePrice: 25, category: 'intermediate', weight: 1, age: 5 },
    { id: 'housing', name: 'Metal Housing', basePrice: 18, category: 'intermediate', weight: 3, age: 5 },
    { id: 'steel_wire', name: 'Steel Wire', basePrice: 8, category: 'intermediate', weight: 1, age: 5 },
    { id: 'insulation', name: 'Thermal Insulation', basePrice: 12, category: 'intermediate', weight: 2, age: 5 },
    { id: 'electric_switch', name: 'Electric Switch', basePrice: 10, category: 'intermediate', weight: 0.5, age: 5 },
    { id: 'transformer', name: 'Transformer', basePrice: 45, category: 'intermediate', weight: 8, age: 5 },
    { id: 'capacitor', name: 'Capacitor', basePrice: 12, category: 'intermediate', weight: 0.5, age: 5 },
    { id: 'resistor', name: 'Resistor', basePrice: 8, category: 'intermediate', weight: 0.2, age: 5 },
    { id: 'bulb_socket', name: 'Light Socket', basePrice: 6, category: 'intermediate', weight: 0.5, age: 5 },
    { id: 'relay', name: 'Electric Relay', basePrice: 18, category: 'intermediate', weight: 1, age: 5 },
    { id: 'thermostat', name: 'Thermostat', basePrice: 22, category: 'intermediate', weight: 1, age: 5 },
    { id: 'compressor', name: 'Compressor Unit', basePrice: 70, category: 'intermediate', weight: 12, age: 5 },
    { id: 'aluminum_rod', name: 'Aluminum Rod', basePrice: 20, category: 'intermediate', weight: 2, age: 5 },
    { id: 'electric_coil', name: 'Electric Coil', basePrice: 16, category: 'intermediate', weight: 2, age: 5 },

    // Final Goods (Appliances)
    { id: 'fan', name: 'Electric Fan', basePrice: 80, category: 'final', weight: 5, age: 5 },
    { id: 'toaster', name: 'Toaster', basePrice: 60, category: 'final', weight: 3, age: 5 },
    { id: 'vacuum', name: 'Vacuum Cleaner', basePrice: 150, category: 'final', weight: 10, age: 5 },
    { id: 'fridge', name: 'Refrigerator', basePrice: 500, category: 'final', weight: 80, age: 5 },
    { id: 'washer', name: 'Washing Machine', basePrice: 450, category: 'final', weight: 70, age: 5 },
    { id: 'radio', name: 'AM/FM Radio', basePrice: 100, category: 'final', weight: 4, age: 5 },
    { id: 'drill', name: 'Power Drill', basePrice: 120, category: 'final', weight: 4, age: 5 },
    { id: 'mixer', name: 'Industrial Mixer', basePrice: 90, category: 'final', weight: 3, age: 5 },
    { id: 'dishwasher', name: 'Dishwasher', basePrice: 420, category: 'final', weight: 65, age: 5 },
    { id: 'air_conditioner', name: 'Air Conditioner', basePrice: 550, category: 'final', weight: 75, age: 5 },
    { id: 'electric_oven', name: 'Electric Oven', basePrice: 380, category: 'final', weight: 50, age: 5 },
    { id: 'hair_dryer', name: 'Hair Dryer', basePrice: 45, category: 'final', weight: 1, age: 5 },
    { id: 'electric_heater', name: 'Electric Heater', basePrice: 110, category: 'final', weight: 8, age: 5 },
    { id: 'electric_kettle', name: 'Electric Kettle', basePrice: 55, category: 'final', weight: 2, age: 5 },
    { id: 'blender', name: 'Blender', basePrice: 75, category: 'final', weight: 2, age: 5 },
    { id: 'food_processor', name: 'Food Processor', basePrice: 130, category: 'final', weight: 4, age: 5 },
    { id: 'electric_saw', name: 'Electric Saw', basePrice: 140, category: 'final', weight: 6, age: 5 },
    { id: 'arc_welder', name: 'Arc Welder', basePrice: 320, category: 'final', weight: 25, age: 5 },
    { id: 'electric_guitar', name: 'Electric Guitar', basePrice: 250, category: 'final', weight: 4, age: 5 },
    { id: 'jukebox', name: 'Jukebox', basePrice: 480, category: 'final', weight: 50, age: 5 },
    { id: 'ceiling_fan', name: 'Ceiling Fan', basePrice: 95, category: 'final', weight: 6, age: 5 },
    { id: 'water_heater', name: 'Water Heater', basePrice: 280, category: 'final', weight: 40, age: 5 },
    { id: 'sander', name: 'Electric Sander', basePrice: 85, category: 'final', weight: 3, age: 5 },
    { id: 'elevator_motor', name: 'Elevator Motor', basePrice: 360, category: 'final', weight: 45, age: 5 },
    { id: 'motor_housing_unit', name: 'Motor Housing Unit', basePrice: 85, category: 'final', weight: 12, age: 5 },
    { id: 'insulated_pipe', name: 'Insulated Pipe', basePrice: 45, category: 'final', weight: 8, age: 5 },
    { id: 'relay_panel', name: 'Relay Control Panel', basePrice: 130, category: 'final', weight: 15, age: 5 },
    { id: 'wire_spool', name: 'Steel Wire Spool', basePrice: 38, category: 'final', weight: 6, age: 5 },
    { id: 'lamp_fixture', name: 'Lamp Fixture', basePrice: 42, category: 'final', weight: 3, age: 5 },

    // ========================
    // AGE 6: DIGITAL (Silicon, Chips)
    // ========================
    // Parts
    { id: 'silicon', name: 'Refined Silicon', basePrice: 30, category: 'intermediate', weight: 1, age: 6 },
    { id: 'circuit_board', name: 'Circuit Board', basePrice: 40, category: 'intermediate', weight: 1, age: 6 },
    { id: 'steel_bracket', name: 'Steel Bracket', basePrice: 10, category: 'intermediate', weight: 2, age: 6 },
    { id: 'cpu', name: 'Microprocessor', basePrice: 100, category: 'intermediate', weight: 0.5, age: 6 },
    { id: 'screen', name: 'LCD Screen', basePrice: 80, category: 'intermediate', weight: 3, age: 6 },
    { id: 'ram_module', name: 'RAM Module', basePrice: 50, category: 'intermediate', weight: 0.3, age: 6 },
    { id: 'hard_drive', name: 'Hard Drive', basePrice: 60, category: 'intermediate', weight: 1, age: 6 },
    { id: 'motherboard', name: 'Motherboard', basePrice: 90, category: 'intermediate', weight: 1, age: 6 },
    { id: 'graphics_card', name: 'Graphics Card', basePrice: 120, category: 'intermediate', weight: 1, age: 6 },
    { id: 'power_supply', name: 'Power Supply Unit', basePrice: 55, category: 'intermediate', weight: 2, age: 6 },
    { id: 'keyboard', name: 'Keyboard', basePrice: 35, category: 'intermediate', weight: 1, age: 6 },
    { id: 'mouse', name: 'Computer Mouse', basePrice: 20, category: 'intermediate', weight: 0.3, age: 6 },
    { id: 'usb_cable', name: 'USB Cable', basePrice: 8, category: 'intermediate', weight: 0.2, age: 6 },
    { id: 'digital_sensor', name: 'Digital Sensor', basePrice: 28, category: 'intermediate', weight: 0.5, age: 6 },
    { id: 'led', name: 'LED Component', basePrice: 5, category: 'intermediate', weight: 0.1, age: 6 },

    // Final Goods (Tech)
    { id: 'computer', name: 'Desktop Computer', basePrice: 800, category: 'final', weight: 15, age: 6 },
    { id: 'tv', name: 'Flat Screen TV', basePrice: 600, category: 'final', weight: 20, age: 6 },
    { id: 'microwave', name: 'Microwave Oven', basePrice: 200, category: 'final', weight: 15, age: 6 },
    { id: 'calculator', name: 'Calculator', basePrice: 50, category: 'final', weight: 1, age: 6 },
    { id: 'console', name: 'Game Console', basePrice: 400, category: 'final', weight: 5, age: 6 },
    { id: 'printer', name: 'Laser Printer', basePrice: 300, category: 'final', weight: 12, age: 6 },
    { id: 'watch_digital', name: 'Digital Watch', basePrice: 60, category: 'final', weight: 0.5, age: 6 },
    { id: 'laptop', name: 'Laptop Computer', basePrice: 900, category: 'final', weight: 3, age: 6 },
    { id: 'server', name: 'Server Rack', basePrice: 1200, category: 'final', weight: 40, age: 6 },
    { id: 'monitor', name: 'Computer Monitor', basePrice: 280, category: 'final', weight: 5, age: 6 },
    { id: 'scanner', name: 'Document Scanner', basePrice: 220, category: 'final', weight: 6, age: 6 },
    { id: 'modem', name: 'Cable Modem', basePrice: 90, category: 'final', weight: 1, age: 6 },
    { id: 'router', name: 'Network Router', basePrice: 110, category: 'final', weight: 2, age: 6 },
    { id: 'digital_camera', name: 'Digital Camera', basePrice: 320, category: 'final', weight: 1, age: 6 },
    { id: 'mp3_player', name: 'MP3 Player', basePrice: 85, category: 'final', weight: 0.5, age: 6 },
    { id: 'electronic_lock', name: 'Electronic Door Lock', basePrice: 130, category: 'final', weight: 2, age: 6 },
    { id: 'gps_device', name: 'GPS Navigator', basePrice: 150, category: 'final', weight: 1, age: 6 },
    { id: 'barcode_scanner', name: 'Barcode Scanner', basePrice: 95, category: 'final', weight: 1, age: 6 },
    { id: 'atm_machine', name: 'ATM Machine', basePrice: 850, category: 'final', weight: 80, age: 6 },
    { id: 'pos_terminal', name: 'POS Terminal', basePrice: 180, category: 'final', weight: 3, age: 6 },
    { id: 'led_display', name: 'LED Display Panel', basePrice: 420, category: 'final', weight: 15, age: 6 },
    { id: 'surveillance_camera', name: 'Security Camera', basePrice: 140, category: 'final', weight: 2, age: 6 },
    { id: 'tablet', name: 'Tablet Computer', basePrice: 450, category: 'final', weight: 1, age: 6 },
    { id: 'bracket_assembly', name: 'Bracket Assembly', basePrice: 65, category: 'final', weight: 5, age: 6 },
    { id: 'computer_station', name: 'Computer Workstation', basePrice: 950, category: 'final', weight: 35, age: 6 },
    { id: 'cable_organizer', name: 'Cable Management System', basePrice: 55, category: 'final', weight: 3, age: 6 },

    // ========================
    // AGE 7: FUTURE (Rare Earths, Advanced)
    // ========================
    // Parts
    { id: 'adv_battery', name: 'Lithium Battery', basePrice: 80, category: 'intermediate', weight: 2, age: 7 },
    { id: 'composite', name: 'Carbon Composite', basePrice: 100, category: 'intermediate', weight: 1, age: 7 },
    { id: 'ai_core', name: 'AI Core', basePrice: 500, category: 'intermediate', weight: 1, age: 7 },
    { id: 'liquid_nitrogen', name: 'Liquid Nitrogen', basePrice: 15, category: 'intermediate', weight: 1, age: 7 },
    { id: 'helmet', name: 'Protective Helmet', basePrice: 50, category: 'intermediate', weight: 3, age: 7 },
    { id: 'superconductor', name: 'Superconductor', basePrice: 200, category: 'intermediate', weight: 1, age: 7 },
    { id: 'quantum_processor', name: 'Quantum Processor', basePrice: 600, category: 'intermediate', weight: 0.5, age: 7 },
    { id: 'graphene_sheet', name: 'Graphene Sheet', basePrice: 150, category: 'intermediate', weight: 0.2, age: 7 },
    { id: 'nano_material', name: 'Nano-Material', basePrice: 180, category: 'intermediate', weight: 0.5, age: 7 },
    { id: 'fusion_core', name: 'Fusion Core', basePrice: 800, category: 'intermediate', weight: 5, age: 7 },
    { id: 'plasma_containment', name: 'Plasma Containment', basePrice: 350, category: 'intermediate', weight: 3, age: 7 },
    { id: 'neural_interface', name: 'Neural Interface', basePrice: 280, category: 'intermediate', weight: 0.5, age: 7 },
    { id: 'holographic_projector', name: 'Holographic Projector', basePrice: 320, category: 'intermediate', weight: 2, age: 7 },
    { id: 'smart_fabric', name: 'Smart Fabric', basePrice: 90, category: 'intermediate', weight: 1, age: 7 },
    { id: 'anti_grav_unit', name: 'Anti-Gravity Unit', basePrice: 450, category: 'intermediate', weight: 4, age: 7 },

    // Final Goods
    { id: 'smartphone', name: 'Smartphone', basePrice: 900, category: 'final', weight: 1, age: 7 },
    { id: 'drone', name: 'Quad-Drone', basePrice: 600, category: 'final', weight: 4, age: 7 },
    { id: 'robot', name: 'Service Robot', basePrice: 2500, category: 'final', weight: 50, age: 7 },
    { id: 'vr_headset', name: 'VR Headset', basePrice: 800, category: 'final', weight: 2, age: 7 },
    { id: 'electric_car', name: 'Electric Car', basePrice: 5000, category: 'final', weight: 200, age: 7 },
    { id: 'laser', name: 'Lab Laser', basePrice: 1200, category: 'final', weight: 10, age: 7 },
    { id: 'solar_panel_item', name: 'Solar Panel', basePrice: 400, category: 'final', weight: 10, age: 7 },
    { id: 'flying_car', name: 'Flying Car', basePrice: 15000, category: 'final', weight: 180, age: 7 },
    { id: 'hoverboard', name: 'Hoverboard', basePrice: 1100, category: 'final', weight: 8, age: 7 },
    { id: 'printer_3d', name: '3D Printer', basePrice: 1800, category: 'final', weight: 35, age: 7 },
    { id: 'holographic_display', name: 'Holographic Display', basePrice: 1400, category: 'final', weight: 12, age: 7 },
    { id: 'ar_glasses', name: 'AR Glasses', basePrice: 950, category: 'final', weight: 0.5, age: 7 },
    { id: 'exoskeleton', name: 'Powered Exoskeleton', basePrice: 3200, category: 'final', weight: 40, age: 7 },
    { id: 'personal_assistant_robot', name: 'Personal Assistant Robot', basePrice: 1900, category: 'final', weight: 25, age: 7 },
    { id: 'smart_home_hub', name: 'Smart Home Hub', basePrice: 420, category: 'final', weight: 2, age: 7 },
    { id: 'autonomous_vehicle', name: 'Autonomous Vehicle', basePrice: 25000, category: 'final', weight: 220, age: 7 },
    { id: 'space_suit', name: 'Space Suit', basePrice: 4500, category: 'final', weight: 15, age: 7 },
    { id: 'medical_scanner', name: 'Medical Scanner', basePrice: 2800, category: 'final', weight: 50, age: 7 },
    { id: 'quantum_computer', name: 'Quantum Computer', basePrice: 15000, category: 'final', weight: 60, age: 7 },
    { id: 'teleporter_pad', name: 'Teleportation Pad', basePrice: 70000, category: 'final', weight: 500, age: 7 },
    { id: 'energy_shield', name: 'Energy Shield Generator', basePrice: 3800, category: 'final', weight: 30, age: 7 },
    { id: 'weather_control', name: 'Weather Control Device', basePrice: 12000, category: 'final', weight: 150, age: 7 },
    { id: 'replicator', name: 'Matter Replicator', basePrice: 18000, category: 'final', weight: 100, age: 7 },
    { id: 'cryogenic_chamber', name: 'Cryogenic Chamber', basePrice: 2000, category: 'final', weight: 180, age: 7 },
    { id: 'space_helmet', name: 'Space Helmet', basePrice: 850, category: 'final', weight: 5, age: 7 },
    { id: 'graphene_armor', name: 'Graphene Armor', basePrice: 2400, category: 'final', weight: 8, age: 7 },
    { id: 'neural_implant', name: 'Neural Implant', basePrice: 1800, category: 'final', weight: 0.5, age: 7 },

    // ========================
    // EQUIPMENT (Machines & Generators)
    // ========================
    // Machines - Age 1
    { id: 'carpenters_bench', name: "Carpenter's Bench", basePrice: 60, category: 'equipment', weight: 15, age: 1 },
    { id: 'blacksmiths_anvil', name: "Blacksmith's Anvil", basePrice: 80, category: 'equipment', weight: 40, age: 1 },
    { id: 'masons_workshop', name: "Mason's Table", basePrice: 50, category: 'equipment', weight: 25, age: 1 },
    { id: 'stone_furnace', name: 'Stone Furnace', basePrice: 50, category: 'equipment', weight: 30, age: 1 },
    // Machines - Age 2
    { id: 'glassblowers_workshop', name: "Glassblower's Workshop", basePrice: 120, category: 'equipment', weight: 30, age: 2 },
    { id: 'potters_wheel_machine', name: "Potter's Wheel", basePrice: 80, category: 'equipment', weight: 25, age: 2 },
    { id: 'foundry', name: 'Ind. Foundry', basePrice: 300, category: 'equipment', weight: 50, age: 2 },
    // Machines - Age 3
    { id: 'steel_forge', name: 'Steel Forge', basePrice: 500, category: 'equipment', weight: 70, age: 3 },
    { id: 'heavy_assembly', name: 'Heavy Assembly', basePrice: 800, category: 'equipment', weight: 100, age: 3 },
    // Machines - Age 4+
    { id: 'precision_assembler', name: 'Precision Assembler', basePrice: 1500, category: 'equipment', weight: 60, age: 4 },
    { id: 'chemical_plant', name: 'Chemical Plant', basePrice: 800, category: 'equipment', weight: 60, age: 4 },
    { id: 'research_laboratory', name: 'Research Laboratory', basePrice: 2000, category: 'equipment', weight: 80, age: 4 },
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
    { id: 'planks', inputs: { wood: 2 }, outputs: { planks: 2 }, ticksToComplete: 1, tier: 1, age: 1 },
    { id: 'wooden_beam', inputs: { planks: 2 }, outputs: { wooden_beam: 1 }, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'stone_bricks', inputs: { stone: 2 }, outputs: { stone_bricks: 2 }, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'iron_ingot', inputs: { iron_ore: 2 }, outputs: { iron_ingot: 1 }, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'iron_plate', inputs: { iron_ingot: 2 }, outputs: { iron_plate: 1 }, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'iron_rod', inputs: { iron_ingot: 1 }, outputs: { iron_rod: 2 }, ticksToComplete: 1, tier: 1, age: 1 },
    { id: 'nails', inputs: { iron_rod: 1 }, outputs: { nails: 8 }, ticksToComplete: 1, tier: 1, age: 1 },
    { id: 'rope', inputs: { wood: 1 }, outputs: { rope: 3 }, ticksToComplete: 1, tier: 1, age: 1 },
    { id: 'wooden_dowel', inputs: { planks: 1 }, outputs: { wooden_dowel: 4 }, ticksToComplete: 1, tier: 1, age: 1 },
    { id: 'stone_slab', inputs: { stone: 2 }, outputs: { stone_slab: 1 }, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'iron_wire', inputs: { iron_rod: 1 }, outputs: { iron_wire: 4 }, ticksToComplete: 1, tier: 1, age: 1 },
    { id: 'iron_bracket', inputs: { iron_plate: 1 }, outputs: { iron_bracket: 2 }, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'hinges', inputs: { iron_plate: 1, iron_rod: 1 }, outputs: { hinges: 2 }, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'mortar', inputs: { stone: 1, sand: 1 }, outputs: { mortar: 3 }, ticksToComplete: 1, tier: 1, age: 1 },
    { id: 'iron_chain', inputs: { iron_wire: 2 }, outputs: { iron_chain: 1 }, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'stone_tile', inputs: { stone_bricks: 1 }, outputs: { stone_tile: 4 }, ticksToComplete: 1, tier: 1, age: 1 },
    { id: 'wooden_shingle', inputs: { planks: 1 }, outputs: { wooden_shingle: 6 }, ticksToComplete: 1, tier: 1, age: 1 },
    { id: 'iron_axle', inputs: { iron_rod: 2, iron_ingot: 1 }, outputs: { iron_axle: 1 }, ticksToComplete: 3, tier: 1, age: 1 },
    { id: 'wheel', inputs: { planks: 4, iron_rod: 2 }, outputs: { wheel: 1 }, ticksToComplete: 3, tier: 1, age: 1 },
    { id: 'wooden_handle', inputs: { planks: 1 }, outputs: { wooden_handle: 2 }, ticksToComplete: 1, tier: 1, age: 1 },

    // Final Goods Age 1
    { id: 'chair', inputs: { planks: 4, nails: 2 }, outputs: { chair: 1 }, ticksToComplete: 3, tier: 1, age: 1 },
    { id: 'table', inputs: { planks: 6, wooden_beam: 2, nails: 4 }, outputs: { table: 1 }, ticksToComplete: 4, tier: 1, age: 1 },
    { id: 'wardrobe', inputs: { planks: 10, nails: 8, iron_plate: 1 }, outputs: { wardrobe: 1 }, ticksToComplete: 6, tier: 1, age: 1 },
    { id: 'chest', inputs: { planks: 6, iron_plate: 2 }, outputs: { chest: 1 }, ticksToComplete: 4, tier: 1, age: 1 },
    { id: 'bucket', inputs: { iron_plate: 2 }, outputs: { bucket: 1 }, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'hammer', inputs: { iron_ingot: 1, planks: 1 }, outputs: { hammer: 1 }, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'pickaxe', inputs: { iron_ingot: 2, planks: 1 }, outputs: { pickaxe: 1 }, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'shovel', inputs: { iron_plate: 1, planks: 2 }, outputs: { shovel: 1 }, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'fence', inputs: { planks: 3, nails: 2 }, outputs: { fence: 2 }, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'door', inputs: { wooden_beam: 2, planks: 4, iron_plate: 2 }, outputs: { door: 1 }, ticksToComplete: 5, tier: 1, age: 1 },
    { id: 'stone_wall', inputs: { stone_bricks: 4 }, outputs: { stone_wall: 2 }, ticksToComplete: 3, tier: 1, age: 1 },
    { id: 'bed', inputs: { planks: 6, wooden_beam: 2, rope: 2 }, outputs: { bed: 1 }, ticksToComplete: 5, tier: 1, age: 1 },
    { id: 'bench', inputs: { planks: 3, nails: 2 }, outputs: { bench: 1 }, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'ladder', inputs: { wooden_beam: 2, nails: 4 }, outputs: { ladder: 1 }, ticksToComplete: 3, tier: 1, age: 1 },
    { id: 'wheelbarrow', inputs: { planks: 4, iron_plate: 1, wheel: 1 }, outputs: { wheelbarrow: 1 }, ticksToComplete: 4, tier: 1, age: 1 },
    { id: 'cart', inputs: { wooden_beam: 3, wheel: 2, iron_bracket: 2 }, outputs: { cart: 1 }, ticksToComplete: 5, tier: 1, age: 1 },
    { id: 'barrel', inputs: { planks: 4, iron_rod: 2 }, outputs: { barrel: 1 }, ticksToComplete: 3, tier: 1, age: 1 },
    { id: 'anvil', inputs: { iron_ingot: 5 }, outputs: { anvil: 1 }, ticksToComplete: 4, tier: 1, age: 1 },
    { id: 'bellows', inputs: { planks: 3, iron_plate: 1, rope: 1 }, outputs: { bellows: 1 }, ticksToComplete: 3, tier: 1, age: 1 },
    { id: 'axe', inputs: { iron_ingot: 1, wooden_handle: 1 }, outputs: { axe: 1 }, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'saw', inputs: { iron_plate: 1, wooden_handle: 1 }, outputs: { saw: 1 }, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'chisel', inputs: { iron_rod: 1, wooden_handle: 1 }, outputs: { chisel: 1 }, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'mallet', inputs: { planks: 2, wooden_handle: 1 }, outputs: { mallet: 1 }, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'shield', inputs: { wooden_beam: 2, iron_plate: 1 }, outputs: { shield: 1 }, ticksToComplete: 4, tier: 1, age: 1 },
    { id: 'spear', inputs: { iron_rod: 2, wooden_handle: 1 }, outputs: { spear: 1 }, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'gate', inputs: { wooden_beam: 3, hinges: 2, iron_plate: 1 }, outputs: { gate: 1 }, ticksToComplete: 5, tier: 1, age: 1 },
    { id: 'staircase', inputs: { wooden_beam: 3, planks: 4, nails: 6 }, outputs: { staircase: 1 }, ticksToComplete: 4, tier: 1, age: 1 },
    { id: 'roof_tile_section', inputs: { stone_tile: 6 }, outputs: { roof_tile_section: 1 }, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'well', inputs: { stone_bricks: 8, rope: 2, bucket: 1 }, outputs: { well: 1 }, ticksToComplete: 6, tier: 1, age: 1 },
    { id: 'workbench', inputs: { planks: 6, wooden_beam: 1 }, outputs: { workbench: 1 }, ticksToComplete: 3, tier: 1, age: 1 },
    { id: 'forge', inputs: { stone_bricks: 6, iron_plate: 2 }, outputs: { forge: 1 }, ticksToComplete: 5, tier: 1, age: 1 },
    { id: 'crate', inputs: { planks: 4, nails: 4 }, outputs: { crate: 1 }, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'bridge_section', inputs: { wooden_beam: 4, planks: 6, iron_bracket: 2 }, outputs: { bridge_section: 1 }, ticksToComplete: 5, tier: 1, age: 1 },
    { id: 'plow', inputs: { iron_plate: 1, wooden_beam: 1, wooden_handle: 1 }, outputs: { plow: 1 }, ticksToComplete: 4, tier: 1, age: 1 },
    { id: 'stone_pillar', inputs: { stone_slab: 2, mortar: 1 }, outputs: { stone_pillar: 1 }, ticksToComplete: 4, tier: 1, age: 1 },
    { id: 'tool_rack', inputs: { planks: 3, nails: 3 }, outputs: { tool_rack: 1 }, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'shield_rack', inputs: { planks: 4, nails: 4 }, outputs: { shield_rack: 1 }, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'iron_grate', inputs: { iron_rod: 6 }, outputs: { iron_grate: 1 }, ticksToComplete: 3, tier: 1, age: 1 },
    { id: 'coat_hanger', inputs: { wooden_dowel: 4, iron_wire: 2 }, outputs: { coat_hanger: 1 }, ticksToComplete: 1, tier: 1, age: 1 },
    { id: 'shingled_roof', inputs: { wooden_shingle: 20, nails: 10 }, outputs: { shingled_roof: 1 }, ticksToComplete: 5, tier: 1, age: 1 },
    { id: 'wagon', inputs: { planks: 6, iron_axle: 2, wheel: 4, iron_bracket: 4 }, outputs: { wagon: 1 }, ticksToComplete: 10, tier: 1, age: 1 },
    { id: 'water_wheel', inputs: { wooden_beam: 8, iron_axle: 1, iron_bracket: 6 }, outputs: { water_wheel: 1 }, ticksToComplete: 8, tier: 1, age: 1 },
    { id: 'anchor', inputs: { iron_ingot: 4, iron_chain: 2 }, outputs: { anchor: 1 }, ticksToComplete: 4, tier: 1, age: 1 },

    // --- AGE 2: REFINEMENT ---
    // Intermediates
    { id: 'glass', inputs: { sand: 2 }, outputs: { glass: 2 }, ticksToComplete: 2, tier: 2, age: 2 },
    { id: 'copper_ingot', inputs: { copper_ore: 2 }, outputs: { copper_ingot: 1 }, ticksToComplete: 2, tier: 2, age: 2 },
    { id: 'copper_sheet', inputs: { copper_ingot: 2 }, outputs: { copper_sheet: 1 }, ticksToComplete: 2, tier: 2, age: 2 },
    { id: 'pipe', inputs: { copper_sheet: 1 }, outputs: { pipe: 2 }, ticksToComplete: 2, tier: 2, age: 2 },
    { id: 'ceramic_tile', inputs: { clay: 2 }, outputs: { ceramic_tile: 4 }, ticksToComplete: 2, tier: 2, age: 2 },
    { id: 'glass_pane', inputs: { glass: 1 }, outputs: { glass_pane: 4 }, ticksToComplete: 1, tier: 2, age: 2 },
    { id: 'copper_tubing', inputs: { copper_sheet: 1 }, outputs: { copper_tubing: 3 }, ticksToComplete: 2, tier: 2, age: 2 },
    { id: 'brass_ingot', inputs: { copper_ingot: 1, iron_ingot: 1 }, outputs: { brass_ingot: 1 }, ticksToComplete: 3, tier: 2, age: 2 },
    { id: 'brass_sheet', inputs: { brass_ingot: 2 }, outputs: { brass_sheet: 1 }, ticksToComplete: 2, tier: 2, age: 2 },
    { id: 'decorative_glass', inputs: { glass: 1, copper_sheet: 1 }, outputs: { decorative_glass: 1 }, ticksToComplete: 3, tier: 2, age: 2 },
    { id: 'terracotta', inputs: { clay: 2 }, outputs: { terracotta: 2 }, ticksToComplete: 2, tier: 2, age: 2 },
    { id: 'porcelain', inputs: { clay: 2, sand: 1 }, outputs: { porcelain: 1 }, ticksToComplete: 3, tier: 2, age: 2 },
    { id: 'glass_lens', inputs: { glass: 1 }, outputs: { glass_lens: 2 }, ticksToComplete: 2, tier: 2, age: 2 },
    { id: 'copper_rod', inputs: { copper_ingot: 1 }, outputs: { copper_rod: 2 }, ticksToComplete: 1, tier: 2, age: 2 },
    { id: 'bronze_ingot', inputs: { copper_ingot: 2, iron_ingot: 1 }, outputs: { bronze_ingot: 2 }, ticksToComplete: 3, tier: 2, age: 2 },

    // Final Goods Age 2
    { id: 'vase', inputs: { clay: 3 }, outputs: { vase: 1 }, ticksToComplete: 3, tier: 2, age: 2 },
    { id: 'pot', inputs: { copper_sheet: 1 }, outputs: { pot: 1 }, ticksToComplete: 2, tier: 2, age: 2 },
    { id: 'mirror', inputs: { glass: 1, copper_sheet: 1 }, outputs: { mirror: 1 }, ticksToComplete: 3, tier: 2, age: 2 },
    { id: 'window', inputs: { glass: 2, planks: 2 }, outputs: { window: 1 }, ticksToComplete: 3, tier: 2, age: 2 },
    { id: 'lantern', inputs: { glass: 1, copper_sheet: 1, iron_rod: 1 }, outputs: { lantern: 1 }, ticksToComplete: 4, tier: 2, age: 2 },
    { id: 'kettle', inputs: { copper_sheet: 2, iron_rod: 1 }, outputs: { kettle: 1 }, ticksToComplete: 3, tier: 2, age: 2 },
    { id: 'fountain', inputs: { clay: 5, pipe: 1 }, outputs: { fountain: 1 }, ticksToComplete: 6, tier: 2, age: 2 },
    { id: 'aqueduct_section', inputs: { clay: 10, pipe: 2 }, outputs: { aqueduct_section: 1 }, ticksToComplete: 8, tier: 2, age: 2 },
    { id: 'spyglass', inputs: { glass: 2, copper_sheet: 2 }, outputs: { spyglass: 1 }, ticksToComplete: 5, tier: 2, age: 2 },
    { id: 'chandelier', inputs: { glass: 3, copper_sheet: 2, iron_chain: 1 }, outputs: { chandelier: 1 }, ticksToComplete: 6, tier: 2, age: 2 },
    { id: 'stained_glass', inputs: { decorative_glass: 2, iron_rod: 2 }, outputs: { stained_glass: 1 }, ticksToComplete: 5, tier: 2, age: 2 },
    { id: 'telescope', inputs: { glass_lens: 3, copper_tubing: 2 }, outputs: { telescope: 1 }, ticksToComplete: 6, tier: 2, age: 2 },
    { id: 'compass', inputs: { brass_sheet: 1, glass_pane: 1, copper_rod: 1 }, outputs: { compass: 1 }, ticksToComplete: 4, tier: 2, age: 2 },
    { id: 'plate_set', inputs: { porcelain: 3 }, outputs: { plate_set: 1 }, ticksToComplete: 3, tier: 2, age: 2 },
    { id: 'tile_floor', inputs: { ceramic_tile: 8 }, outputs: { tile_floor: 1 }, ticksToComplete: 3, tier: 2, age: 2 },
    { id: 'bathtub', inputs: { copper_sheet: 4, pipe: 2 }, outputs: { bathtub: 1 }, ticksToComplete: 7, tier: 2, age: 2 },
    { id: 'sink', inputs: { copper_sheet: 2, pipe: 1 }, outputs: { sink: 1 }, ticksToComplete: 4, tier: 2, age: 2 },
    { id: 'decorative_urn', inputs: { terracotta: 2 }, outputs: { decorative_urn: 1 }, ticksToComplete: 4, tier: 2, age: 2 },
    { id: 'chimney', inputs: { bricks: 6, pipe: 1 }, outputs: { chimney: 1 }, ticksToComplete: 5, tier: 2, age: 2 },
    { id: 'greenhouse_panel', inputs: { glass_pane: 4, iron_rod: 2 }, outputs: { greenhouse_panel: 1 }, ticksToComplete: 4, tier: 2, age: 2 },
    { id: 'church_bell', inputs: { brass_ingot: 3, iron_bracket: 1 }, outputs: { church_bell: 1 }, ticksToComplete: 7, tier: 2, age: 2 },
    { id: 'candelabra', inputs: { brass_sheet: 2, copper_rod: 1 }, outputs: { candelabra: 1 }, ticksToComplete: 4, tier: 2, age: 2 },
    { id: 'pottery_wheel', inputs: { wooden_beam: 2, stone: 1, copper_sheet: 1 }, outputs: { pottery_wheel: 1 }, ticksToComplete: 5, tier: 2, age: 2 },
    { id: 'barometer', inputs: { glass: 1, copper_tubing: 2 }, outputs: { barometer: 1 }, ticksToComplete: 5, tier: 2, age: 2 },
    { id: 'hourglass', inputs: { glass: 2, sand: 1 }, outputs: { hourglass: 1 }, ticksToComplete: 3, tier: 2, age: 2 },
    { id: 'ceramic_bowl', inputs: { clay: 2 }, outputs: { ceramic_bowl: 2 }, ticksToComplete: 2, tier: 2, age: 2 },
    { id: 'copper_statue', inputs: { copper_ingot: 3, copper_sheet: 2 }, outputs: { copper_statue: 1 }, ticksToComplete: 6, tier: 2, age: 2 },
    { id: 'magnifying_glass', inputs: { glass_lens: 1, brass_sheet: 1 }, outputs: { magnifying_glass: 1 }, ticksToComplete: 4, tier: 2, age: 2 },
    { id: 'sundial', inputs: { stone_slab: 1, brass_sheet: 1 }, outputs: { sundial: 1 }, ticksToComplete: 3, tier: 2, age: 2 },
    { id: 'bronze_armor', inputs: { bronze_ingot: 6, iron_chain: 4 }, outputs: { bronze_armor: 1 }, ticksToComplete: 10, tier: 2, age: 2 },

    // --- AGE 3: INDUSTRIAL ---
    // Intermediates
    { id: 'bricks', inputs: { clay: 2 }, outputs: { bricks: 3 }, ticksToComplete: 2, tier: 3, age: 3 },
    { id: 'steel_ingot', inputs: { iron_ingot: 2, coal: 2 }, outputs: { steel_ingot: 1 }, ticksToComplete: 4, tier: 3, age: 3 },
    { id: 'steel_beam', inputs: { steel_ingot: 3 }, outputs: { steel_beam: 1 }, ticksToComplete: 3, tier: 3, age: 3 },
    { id: 'steel_plate', inputs: { steel_ingot: 2 }, outputs: { steel_plate: 1 }, ticksToComplete: 3, tier: 3, age: 3 },
    { id: 'steel_rod', inputs: { steel_ingot: 1 }, outputs: { steel_rod: 2 }, ticksToComplete: 2, tier: 3, age: 3 },
    { id: 'gear', inputs: { iron_plate: 1 }, outputs: { gear: 2 }, ticksToComplete: 2, tier: 3, age: 3 },
    { id: 'steel_gear', inputs: { steel_plate: 1 }, outputs: { steel_gear: 2 }, ticksToComplete: 3, tier: 3, age: 3 },
    { id: 'steel_cable', inputs: { steel_rod: 1 }, outputs: { steel_cable: 2 }, ticksToComplete: 2, tier: 3, age: 3 },
    { id: 'steel_rivet', inputs: { steel_rod: 1 }, outputs: { steel_rivet: 8 }, ticksToComplete: 2, tier: 3, age: 3 },
    { id: 'steel_spring', inputs: { steel_rod: 1 }, outputs: { steel_spring: 2 }, ticksToComplete: 2, tier: 3, age: 3 },
    { id: 'ball_bearing', inputs: { steel_rod: 1, steel_rivet: 2 }, outputs: { ball_bearing: 2 }, ticksToComplete: 3, tier: 3, age: 3 },
    { id: 'steel_chain', inputs: { steel_rod: 2 }, outputs: { steel_chain: 1 }, ticksToComplete: 3, tier: 3, age: 3 },
    { id: 'steel_pipe', inputs: { steel_plate: 1 }, outputs: { steel_pipe: 2 }, ticksToComplete: 3, tier: 3, age: 3 },
    { id: 'coupling', inputs: { steel_pipe: 1 }, outputs: { coupling: 2 }, ticksToComplete: 2, tier: 3, age: 3 },
    { id: 'piston', inputs: { steel_ingot: 1, iron_rod: 1 }, outputs: { piston: 1 }, ticksToComplete: 3, tier: 3, age: 3 },
    { id: 'steam_valve', inputs: { brass_ingot: 1, steel_rod: 1 }, outputs: { steam_valve: 1 }, ticksToComplete: 3, tier: 3, age: 3 },
    { id: 'drive_shaft', inputs: { steel_rod: 2, steel_ingot: 1 }, outputs: { drive_shaft: 1 }, ticksToComplete: 4, tier: 3, age: 3 },
    { id: 'flywheel', inputs: { steel_plate: 4 }, outputs: { flywheel: 1 }, ticksToComplete: 5, tier: 3, age: 3 },
    { id: 'pressure_gauge', inputs: { glass_pane: 1, brass_sheet: 1, steel_spring: 1 }, outputs: { pressure_gauge: 1 }, ticksToComplete: 4, tier: 3, age: 3 },
    { id: 'boiler', inputs: { steel_plate: 4, steel_pipe: 2 }, outputs: { boiler: 1 }, ticksToComplete: 6, tier: 3, age: 3 },
    { id: 'camshaft', inputs: { drive_shaft: 1, steel_gear: 2 }, outputs: { camshaft: 1 }, ticksToComplete: 6, tier: 3, age: 3 },
    { id: 'crankshaft', inputs: { drive_shaft: 1, steel_rod: 2 }, outputs: { crankshaft: 1 }, ticksToComplete: 6, tier: 3, age: 3 },

    // Final Goods Age 3
    { id: 'vault_door', inputs: { steel_plate: 6, gear: 4 }, outputs: { vault_door: 1 }, ticksToComplete: 8, tier: 3, age: 3 },
    { id: 'stove', inputs: { iron_plate: 4, pipe: 1 }, outputs: { stove: 1 }, ticksToComplete: 6, tier: 3, age: 3 },
    { id: 'bicycle', inputs: { steel_beam: 1, gear: 2, iron_rod: 2 }, outputs: { bicycle: 1 }, ticksToComplete: 6, tier: 3, age: 3 },
    { id: 'clock', inputs: { planks: 6, gear: 8, glass: 1 }, outputs: { clock: 1 }, ticksToComplete: 10, tier: 3, age: 3 },
    { id: 'printing_press', inputs: { steel_plate: 5, gear: 10, piston: 2 }, outputs: { printing_press: 1 }, ticksToComplete: 15, tier: 3, age: 3 },
    { id: 'sewing_machine', inputs: { iron_plate: 3, gear: 4, iron_rod: 2 }, outputs: { sewing_machine: 1 }, ticksToComplete: 8, tier: 3, age: 3 },
    { id: 'tool_box', inputs: { steel_plate: 2, hammer: 1, shovel: 1 }, outputs: { tool_box: 1 }, ticksToComplete: 5, tier: 3, age: 3 },
    { id: 'radiator', inputs: { steel_pipe: 4, steel_plate: 2 }, outputs: { radiator: 1 }, ticksToComplete: 6, tier: 3, age: 3 },
    { id: 'locomotive', inputs: { boiler: 1, piston: 2, steel_beam: 4, wheel: 4 }, outputs: { locomotive: 1 }, ticksToComplete: 30, tier: 3, age: 3 },
    { id: 'industrial_furnace', inputs: { bricks: 8, steel_plate: 4, steel_pipe: 2 }, outputs: { industrial_furnace: 1 }, ticksToComplete: 12, tier: 3, age: 3 },
    { id: 'lathe', inputs: { steel_beam: 2, drive_shaft: 1, chisel: 1, flywheel: 1 }, outputs: { lathe: 1 }, ticksToComplete: 15, tier: 3, age: 3 },
    { id: 'milling_machine', inputs: { steel_beam: 2, steel_gear: 4, steel_rod: 2 }, outputs: { milling_machine: 1 }, ticksToComplete: 15, tier: 3, age: 3 },
    { id: 'safe', inputs: { steel_plate: 6, vault_door: 1 }, outputs: { safe: 1 }, ticksToComplete: 10, tier: 3, age: 3 },
    { id: 'crane', inputs: { steel_beam: 6, steel_cable: 4, gear: 4 }, outputs: { crane: 1 }, ticksToComplete: 20, tier: 3, age: 3 },
    { id: 'elevator', inputs: { steel_beam: 4, steel_cable: 6, piston: 1 }, outputs: { elevator: 1 }, ticksToComplete: 18, tier: 3, age: 3 },
    { id: 'mechanical_loom', inputs: { steel_beam: 2, gear: 6, steel_rod: 4 }, outputs: { mechanical_loom: 1 }, ticksToComplete: 12, tier: 3, age: 3 },
    { id: 'pocket_watch', inputs: { glass_lens: 1, brass_sheet: 2, steel_spring: 4, steel_gear: 4 }, outputs: { pocket_watch: 1 }, ticksToComplete: 8, tier: 3, age: 3 },
    { id: 'manhole_cover', inputs: { steel_plate: 2 }, outputs: { manhole_cover: 1 }, ticksToComplete: 4, tier: 3, age: 3 },
    { id: 'steel_bridge', inputs: { steel_beam: 4, steel_plate: 2, steel_rivet: 10 }, outputs: { steel_bridge: 1 }, ticksToComplete: 20, tier: 3, age: 3 },
    { id: 'water_tower', inputs: { steel_plate: 8, steel_pipe: 4, steel_beam: 4 }, outputs: { water_tower: 1 }, ticksToComplete: 20, tier: 3, age: 3 },
    { id: 'industrial_press', inputs: { piston: 2, steel_beam: 2, anvil: 1 }, outputs: { industrial_press: 1 }, ticksToComplete: 18, tier: 3, age: 3 },
    { id: 'steam_hammer', inputs: { piston: 1, anvil: 1, boiler: 1, steel_beam: 2 }, outputs: { steam_hammer: 1 }, ticksToComplete: 20, tier: 3, age: 3 },
    { id: 'rail_track', inputs: { steel_rod: 2, planks: 1 }, outputs: { rail_track: 2 }, ticksToComplete: 3, tier: 3, age: 3 },
    { id: 'padlock', inputs: { steel_ingot: 1, steel_spring: 1 }, outputs: { padlock: 1 }, ticksToComplete: 2, tier: 3, age: 3 },
    { id: 'wrench', inputs: { steel_ingot: 1 }, outputs: { wrench: 1 }, ticksToComplete: 2, tier: 3, age: 3 },
    { id: 'pipe_organ', inputs: { steel_pipe: 8, planks: 4, bellows: 1 }, outputs: { pipe_organ: 1 }, ticksToComplete: 25, tier: 3, age: 3 },
    { id: 'industrial_boiler', inputs: { boiler: 2, steel_plate: 4, steel_pipe: 4 }, outputs: { industrial_boiler: 1 }, ticksToComplete: 15, tier: 3, age: 3 },
    { id: 'conveyor_belt', inputs: { ball_bearing: 8, steel_chain: 4, steel_beam: 2, electric_motor: 1 }, outputs: { conveyor_belt: 1 }, ticksToComplete: 12, tier: 3, age: 3 },
    { id: 'pressure_cooker', inputs: { steel_plate: 2, pressure_gauge: 1, steam_valve: 1 }, outputs: { pressure_cooker: 1 }, ticksToComplete: 8, tier: 3, age: 3 },
    { id: 'plumbing_system', inputs: { steel_pipe: 6, coupling: 4, steam_valve: 2 }, outputs: { plumbing_system: 1 }, ticksToComplete: 10, tier: 3, age: 3 },
    { id: 'rotary_engine', inputs: { steel_ingot: 4, camshaft: 1, crankshaft: 1, ball_bearing: 4, gear: 3 }, outputs: { rotary_engine: 1 }, ticksToComplete: 20, tier: 3, age: 3 },

    // --- AGE 4: COMBUSTION ---
    // - Updated with new logic for Age 4
    // Intermediates
    { id: 'copper_wire', inputs: { copper_ingot: 1 }, outputs: { copper_wire: 4 }, ticksToComplete: 1, tier: 4, age: 4 },
    { id: 'gasoline', inputs: { oil: 2 }, outputs: { gasoline: 2 }, ticksToComplete: 3, tier: 4, age: 4 },
    { id: 'diesel_fuel', inputs: { oil: 2 }, outputs: { diesel_fuel: 2 }, ticksToComplete: 3, tier: 4, age: 4 },
    { id: 'lubricant', inputs: { oil: 1 }, outputs: { lubricant: 2 }, ticksToComplete: 2, tier: 4, age: 4 },
    { id: 'plastic', inputs: { oil: 1 }, outputs: { plastic: 2 }, ticksToComplete: 2, tier: 4, age: 4 },
    { id: 'rubber', inputs: { oil: 1 }, outputs: { rubber: 2 }, ticksToComplete: 2, tier: 4, age: 4 },
    { id: 'asphalt', inputs: { stone: 1, oil: 1 }, outputs: { asphalt: 2 }, ticksToComplete: 2, tier: 4, age: 4 },
    { id: 'concrete', inputs: { stone: 1, sand: 1 }, outputs: { concrete: 2 }, ticksToComplete: 2, tier: 4, age: 4 },
    { id: 'plastic_sheet', inputs: { plastic: 2 }, outputs: { plastic_sheet: 1 }, ticksToComplete: 2, tier: 4, age: 4 },
    { id: 'vinyl', inputs: { plastic: 2 }, outputs: { vinyl: 2 }, ticksToComplete: 2, tier: 4, age: 4 },
    { id: 'fiberglass', inputs: { plastic: 1, glass: 1 }, outputs: { fiberglass: 2 }, ticksToComplete: 3, tier: 4, age: 4 },
    { id: 'synthetic_fabric', inputs: { plastic: 1 }, outputs: { synthetic_fabric: 2 }, ticksToComplete: 2, tier: 4, age: 4 },
    { id: 'glass_bottle', inputs: { glass: 1 }, outputs: { glass_bottle: 4 }, ticksToComplete: 1, tier: 4, age: 4 },
    { id: 'leather', inputs: { synthetic_fabric: 1, rubber: 1 }, outputs: { leather: 1 }, ticksToComplete: 3, tier: 4, age: 4 },
    { id: 'vacuum_tube', inputs: { glass: 1, copper_wire: 1 }, outputs: { vacuum_tube: 2 }, ticksToComplete: 3, tier: 4, age: 4 },

    // Complex Parts
    { id: 'carburetor', inputs: { steel_plate: 1, brass_ingot: 1 }, outputs: { carburetor: 1 }, ticksToComplete: 4, tier: 4, age: 4 },
    { id: 'spark_plug', inputs: { ceramic_tile: 1, copper_wire: 1 }, outputs: { spark_plug: 4 }, ticksToComplete: 2, tier: 4, age: 4 },
    { id: 'engine_block', inputs: { steel_ingot: 4, piston: 4, gear: 2 }, outputs: { engine_block: 1 }, ticksToComplete: 10, tier: 4, age: 4 },
    { id: 'tire', inputs: { rubber: 2, steel_plate: 1 }, outputs: { tire: 1 }, ticksToComplete: 3, tier: 4, age: 4 },
    { id: 'battery', inputs: { plastic: 1, steel_plate: 1, copper_ingot: 1 }, outputs: { battery: 1 }, ticksToComplete: 5, tier: 4, age: 4 },
    { id: 'light_bulb', inputs: { glass: 1, copper_wire: 1 }, outputs: { light_bulb: 4 }, ticksToComplete: 2, tier: 4, age: 4 },

    // Final Goods Age 4
    { id: 'car_tire', inputs: { tire: 1, steel_plate: 1 }, outputs: { car_tire: 1 }, ticksToComplete: 2, tier: 4, age: 4 },
    { id: 'car_engine', inputs: { engine_block: 1, carburetor: 1, spark_plug: 4, lubricant: 1 }, outputs: { car_engine: 1 }, ticksToComplete: 15, tier: 4, age: 4 },
    { id: 'lawn_mower', inputs: { engine_block: 1, steel_plate: 2, tire: 4, gasoline: 1 }, outputs: { lawn_mower: 1 }, ticksToComplete: 12, tier: 4, age: 4 },
    { id: 'chainsaw', inputs: { engine_block: 1, gear: 2, plastic: 1, steel_chain: 1 }, outputs: { chainsaw: 1 }, ticksToComplete: 8, tier: 4, age: 4 },
    { id: 'generator', inputs: { engine_block: 1, copper_wire: 5, steel_plate: 2 }, outputs: { generator: 1 }, ticksToComplete: 10, tier: 4, age: 4 },
    { id: 'scooter', inputs: { engine_block: 1, tire: 2, steel_beam: 2 }, outputs: { scooter: 1 }, ticksToComplete: 15, tier: 4, age: 4 },
    { id: 'motorcycle', inputs: { car_engine: 1, tire: 2, steel_beam: 2 }, outputs: { motorcycle: 1 }, ticksToComplete: 20, tier: 4, age: 4 },
    { id: 'automobile', inputs: { car_engine: 1, car_tire: 4, steel_plate: 6, glass: 2, vinyl: 2 }, outputs: { automobile: 1 }, ticksToComplete: 40, tier: 4, age: 4 },
    { id: 'radio_transmitter', inputs: { plastic: 3, copper_wire: 2 }, outputs: { radio_transmitter: 1 }, ticksToComplete: 5, tier: 4, age: 4 },
    { id: 'typewriter', inputs: { steel_plate: 2, gear: 10, plastic: 1 }, outputs: { typewriter: 1 }, ticksToComplete: 8, tier: 4, age: 4 },
    { id: 'camera', inputs: { plastic: 2, glass_lens: 2, gear: 2 }, outputs: { camera: 1 }, ticksToComplete: 6, tier: 4, age: 4 },
    { id: 'industrial_pump', inputs: { steel_pipe: 4, engine_block: 1, rubber: 2 }, outputs: { industrial_pump: 1 }, ticksToComplete: 10, tier: 4, age: 4 },
    { id: 'power_saw', inputs: { engine_block: 1, saw: 1, plastic: 1 }, outputs: { power_saw: 1 }, ticksToComplete: 8, tier: 4, age: 4 },
    { id: 'jackhammer', inputs: { engine_block: 1, chisel: 2, steel_spring: 2 }, outputs: { jackhammer: 1 }, ticksToComplete: 8, tier: 4, age: 4 },
    { id: 'concrete_mixer', inputs: { engine_block: 1, steel_plate: 8, wheel: 4 }, outputs: { concrete_mixer: 1 }, ticksToComplete: 15, tier: 4, age: 4 },
    { id: 'traffic_light', inputs: { steel_pipe: 1, light_bulb: 3, glass_lens: 3 }, outputs: { traffic_light: 1 }, ticksToComplete: 6, tier: 4, age: 4 },
    { id: 'street_lamp', inputs: { steel_pipe: 2, light_bulb: 1, glass: 1 }, outputs: { street_lamp: 1 }, ticksToComplete: 5, tier: 4, age: 4 },
    { id: 'telephone', inputs: { plastic: 2, copper_wire: 2, steel_spring: 1 }, outputs: { telephone: 1 }, ticksToComplete: 5, tier: 4, age: 4 },
    { id: 'vinyl_record', inputs: { vinyl: 1 }, outputs: { vinyl_record: 2 }, ticksToComplete: 2, tier: 4, age: 4 },
    { id: 'plastic_container', inputs: { plastic: 1 }, outputs: { plastic_container: 2 }, ticksToComplete: 1, tier: 4, age: 4 },
    { id: 'garden_hose', inputs: { rubber: 1, brass_ingot: 1 }, outputs: { garden_hose: 1 }, ticksToComplete: 2, tier: 4, age: 4 },
    { id: 'fuel_tank', inputs: { steel_plate: 4, steel_pipe: 1 }, outputs: { fuel_tank: 1 }, ticksToComplete: 6, tier: 4, age: 4 },
    { id: 'oil_drum', inputs: { steel_plate: 2 }, outputs: { oil_drum: 1 }, ticksToComplete: 3, tier: 4, age: 4 },
    { id: 'flashlight', inputs: { plastic: 1, light_bulb: 1, battery: 1 }, outputs: { flashlight: 1 }, ticksToComplete: 2, tier: 4, age: 4 },
    { id: 'road_segment', inputs: { asphalt: 4, concrete: 2 }, outputs: { road_segment: 1 }, ticksToComplete: 5, tier: 4, age: 4 },
    { id: 'leather_jacket', inputs: { leather: 3, synthetic_fabric: 2 }, outputs: { leather_jacket: 1 }, ticksToComplete: 6, tier: 4, age: 4 },
    { id: 'amplifier', inputs: { vacuum_tube: 4, copper_wire: 6, steel_plate: 1 }, outputs: { amplifier: 1 }, ticksToComplete: 8, tier: 4, age: 4 },
    { id: 'diesel_truck', inputs: { car_engine: 1, car_tire: 6, steel_plate: 8, diesel_fuel: 4 }, outputs: { diesel_truck: 1 }, ticksToComplete: 50, tier: 4, age: 4 },
    { id: 'chemistry_set', inputs: { glass_bottle: 5, rubber: 1, plastic: 1 }, outputs: { chemistry_set: 1 }, ticksToComplete: 4, tier: 4, age: 4 },
    { id: 'raincoat', inputs: { plastic_sheet: 3, synthetic_fabric: 1 }, outputs: { raincoat: 1 }, ticksToComplete: 3, tier: 4, age: 4 },
    { id: 'kayak', inputs: { fiberglass: 5, plastic: 1 }, outputs: { kayak: 1 }, ticksToComplete: 8, tier: 4, age: 4 },

    // --- AGE 5: ELECTRIC ---
    // - Updated with new logic for Age 5
    // Intermediates
    { id: 'aluminum_ingot', inputs: { bauxite: 2 }, outputs: { aluminum_ingot: 1 }, ticksToComplete: 4, tier: 5, age: 5 },
    { id: 'aluminum_sheet', inputs: { aluminum_ingot: 2 }, outputs: { aluminum_sheet: 1 }, ticksToComplete: 2, tier: 5, age: 5 },
    { id: 'aluminum_rod', inputs: { aluminum_ingot: 1 }, outputs: { aluminum_rod: 2 }, ticksToComplete: 2, tier: 5, age: 5 },
    { id: 'insulated_wire', inputs: { copper_wire: 1, plastic: 1 }, outputs: { insulated_wire: 2 }, ticksToComplete: 1, tier: 5, age: 5 },
    { id: 'electric_coil', inputs: { copper_wire: 2, iron_rod: 1 }, outputs: { electric_coil: 1 }, ticksToComplete: 2, tier: 5, age: 5 },
    { id: 'electric_motor', inputs: { electric_coil: 2, steel_ingot: 1 }, outputs: { electric_motor: 1 }, ticksToComplete: 5, tier: 5, age: 5 },
    { id: 'heating_element', inputs: { iron_rod: 1, copper_wire: 2 }, outputs: { heating_element: 1 }, ticksToComplete: 2, tier: 5, age: 5 },
    { id: 'electric_switch', inputs: { plastic: 1, copper_sheet: 1 }, outputs: { electric_switch: 2 }, ticksToComplete: 1, tier: 5, age: 5 },
    { id: 'transformer', inputs: { electric_coil: 2, steel_plate: 1 }, outputs: { transformer: 1 }, ticksToComplete: 4, tier: 5, age: 5 },
    { id: 'capacitor', inputs: { aluminum_sheet: 1, plastic: 1 }, outputs: { capacitor: 4 }, ticksToComplete: 2, tier: 5, age: 5 },
    { id: 'resistor', inputs: { ceramic_tile: 1, copper_wire: 1 }, outputs: { resistor: 8 }, ticksToComplete: 1, tier: 5, age: 5 },
    { id: 'bulb_socket', inputs: { plastic: 1, brass_sheet: 1 }, outputs: { bulb_socket: 2 }, ticksToComplete: 1, tier: 5, age: 5 },
    { id: 'relay', inputs: { electric_coil: 1, electric_switch: 1 }, outputs: { relay: 1 }, ticksToComplete: 2, tier: 5, age: 5 },
    { id: 'thermostat', inputs: { brass_sheet: 1, electric_switch: 1 }, outputs: { thermostat: 1 }, ticksToComplete: 3, tier: 5, age: 5 },
    { id: 'compressor', inputs: { electric_motor: 1, aluminum_sheet: 1, pipe: 1 }, outputs: { compressor: 1 }, ticksToComplete: 6, tier: 5, age: 5 },
    { id: 'housing', inputs: { steel_plate: 1, aluminum_sheet: 1 }, outputs: { housing: 2 }, ticksToComplete: 3, tier: 5, age: 5 },
    { id: 'steel_wire', inputs: { steel_ingot: 1 }, outputs: { steel_wire: 4 }, ticksToComplete: 1, tier: 5, age: 5 },
    { id: 'insulation', inputs: { fiberglass: 1, synthetic_fabric: 1 }, outputs: { insulation: 2 }, ticksToComplete: 2, tier: 5, age: 5 },

    // Final Goods Age 5
    { id: 'fan', inputs: { electric_motor: 1, plastic: 2, aluminum_sheet: 1 }, outputs: { fan: 1 }, ticksToComplete: 5, tier: 5, age: 5 },
    { id: 'toaster', inputs: { heating_element: 2, aluminum_sheet: 1, plastic: 1, electric_switch: 1 }, outputs: { toaster: 1 }, ticksToComplete: 4, tier: 5, age: 5 },
    { id: 'vacuum', inputs: { electric_motor: 1, plastic: 3, pipe: 1 }, outputs: { vacuum: 1 }, ticksToComplete: 6, tier: 5, age: 5 },
    { id: 'fridge', inputs: { aluminum_sheet: 4, compressor: 1, plastic: 2, thermostat: 1 }, outputs: { fridge: 1 }, ticksToComplete: 10, tier: 5, age: 5 },
    { id: 'washer', inputs: { steel_plate: 3, electric_motor: 1, glass: 1, rubber: 1 }, outputs: { washer: 1 }, ticksToComplete: 10, tier: 5, age: 5 },
    { id: 'dishwasher', inputs: { steel_plate: 3, electric_motor: 1, plastic: 2, heating_element: 1 }, outputs: { dishwasher: 1 }, ticksToComplete: 10, tier: 5, age: 5 },
    { id: 'air_conditioner', inputs: { compressor: 1, fan: 1, aluminum_sheet: 2 }, outputs: { air_conditioner: 1 }, ticksToComplete: 12, tier: 5, age: 5 },
    { id: 'electric_oven', inputs: { heating_element: 4, steel_plate: 4, glass: 1, thermostat: 1 }, outputs: { electric_oven: 1 }, ticksToComplete: 10, tier: 5, age: 5 },
    { id: 'radio', inputs: { plastic: 2, insulated_wire: 3, resistor: 2, capacitor: 2 }, outputs: { radio: 1 }, ticksToComplete: 5, tier: 5, age: 5 },
    { id: 'drill', inputs: { electric_motor: 1, plastic: 2, gear: 1 }, outputs: { drill: 1 }, ticksToComplete: 5, tier: 5, age: 5 },
    { id: 'mixer', inputs: { electric_motor: 1, glass: 1, plastic: 1 }, outputs: { mixer: 1 }, ticksToComplete: 4, tier: 5, age: 5 },
    { id: 'blender', inputs: { electric_motor: 1, glass_bottle: 1, plastic: 1 }, outputs: { blender: 1 }, ticksToComplete: 4, tier: 5, age: 5 },
    { id: 'food_processor', inputs: { electric_motor: 1, plastic: 2, steel_plate: 1 }, outputs: { food_processor: 1 }, ticksToComplete: 5, tier: 5, age: 5 },
    { id: 'hair_dryer', inputs: { heating_element: 1, fan: 1, plastic: 1 }, outputs: { hair_dryer: 1 }, ticksToComplete: 3, tier: 5, age: 5 },
    { id: 'electric_heater', inputs: { heating_element: 2, steel_plate: 1, fan: 1 }, outputs: { electric_heater: 1 }, ticksToComplete: 5, tier: 5, age: 5 },
    { id: 'electric_kettle', inputs: { heating_element: 1, plastic: 1, copper_sheet: 1 }, outputs: { electric_kettle: 1 }, ticksToComplete: 3, tier: 5, age: 5 },
    { id: 'electric_saw', inputs: { electric_motor: 1, saw: 1, aluminum_sheet: 1 }, outputs: { electric_saw: 1 }, ticksToComplete: 6, tier: 5, age: 5 },
    { id: 'arc_welder', inputs: { transformer: 1, insulated_wire: 2, steel_plate: 1 }, outputs: { arc_welder: 1 }, ticksToComplete: 8, tier: 5, age: 5 },
    { id: 'electric_guitar', inputs: { wood: 2, electric_coil: 2 }, outputs: { electric_guitar: 1 }, ticksToComplete: 6, tier: 5, age: 5 },
    { id: 'jukebox', inputs: { wood: 4, glass: 2, radio: 1, vinyl_record: 1 }, outputs: { jukebox: 1 }, ticksToComplete: 10, tier: 5, age: 5 },
    { id: 'ceiling_fan', inputs: { electric_motor: 1, wood: 2, brass_ingot: 1 }, outputs: { ceiling_fan: 1 }, ticksToComplete: 6, tier: 5, age: 5 },
    { id: 'water_heater', inputs: { heating_element: 2, steel_plate: 3 }, outputs: { water_heater: 1 }, ticksToComplete: 8, tier: 5, age: 5 },
    { id: 'sander', inputs: { electric_motor: 1, plastic: 1 }, outputs: { sander: 1 }, ticksToComplete: 4, tier: 5, age: 5 },
    { id: 'elevator_motor', inputs: { electric_motor: 2, steel_gear: 4, steel_beam: 2 }, outputs: { elevator_motor: 1 }, ticksToComplete: 12, tier: 5, age: 5 },
    { id: 'motor_housing_unit', inputs: { housing: 2, electric_motor: 1, aluminum_sheet: 1 }, outputs: { motor_housing_unit: 1 }, ticksToComplete: 6, tier: 5, age: 5 },
    { id: 'insulated_pipe', inputs: { steel_pipe: 2, insulation: 1 }, outputs: { insulated_pipe: 1 }, ticksToComplete: 4, tier: 5, age: 5 },
    { id: 'relay_panel', inputs: { relay: 6, circuit_board: 1, steel_plate: 1 }, outputs: { relay_panel: 1 }, ticksToComplete: 8, tier: 5, age: 5 },
    { id: 'wire_spool', inputs: { steel_wire: 10, aluminum_rod: 1 }, outputs: { wire_spool: 1 }, ticksToComplete: 3, tier: 5, age: 5 },
    { id: 'lamp_fixture', inputs: { bulb_socket: 3, aluminum_sheet: 1, steel_bracket: 2 }, outputs: { lamp_fixture: 1 }, ticksToComplete: 4, tier: 5, age: 5 },

    // --- AGE 6: DIGITAL ---
    // - Updated with new logic for Age 6
    // Intermediates
    { id: 'silicon', inputs: { sand: 4 }, outputs: { silicon: 1 }, ticksToComplete: 5, tier: 6, age: 6 },
    { id: 'circuit_board', inputs: { plastic_sheet: 1, copper_wire: 2 }, outputs: { circuit_board: 2 }, ticksToComplete: 3, tier: 6, age: 6 },
    { id: 'cpu', inputs: { silicon: 2, circuit_board: 1 }, outputs: { cpu: 1 }, ticksToComplete: 8, tier: 6, age: 6 },
    { id: 'led', inputs: { plastic: 1, silicon: 1 }, outputs: { led: 4 }, ticksToComplete: 2, tier: 6, age: 6 },
    { id: 'screen', inputs: { glass: 2, plastic: 1, led: 4 }, outputs: { screen: 1 }, ticksToComplete: 5, tier: 6, age: 6 },
    { id: 'ram_module', inputs: { circuit_board: 1, silicon: 2 }, outputs: { ram_module: 1 }, ticksToComplete: 4, tier: 6, age: 6 },
    { id: 'hard_drive', inputs: { aluminum_sheet: 1, electric_motor: 1, circuit_board: 1 }, outputs: { hard_drive: 1 }, ticksToComplete: 5, tier: 6, age: 6 },
    { id: 'motherboard', inputs: { circuit_board: 2, cpu: 1, capacitor: 2 }, outputs: { motherboard: 1 }, ticksToComplete: 6, tier: 6, age: 6 },
    { id: 'graphics_card', inputs: { circuit_board: 1, cpu: 1, fan: 1 }, outputs: { graphics_card: 1 }, ticksToComplete: 7, tier: 6, age: 6 },
    { id: 'power_supply', inputs: { transformer: 1, capacitor: 2, steel_plate: 1, fan: 1 }, outputs: { power_supply: 1 }, ticksToComplete: 5, tier: 6, age: 6 },
    { id: 'keyboard', inputs: { plastic: 2, circuit_board: 1 }, outputs: { keyboard: 1 }, ticksToComplete: 3, tier: 6, age: 6 },
    { id: 'mouse', inputs: { plastic: 1, led: 1, circuit_board: 1 }, outputs: { mouse: 1 }, ticksToComplete: 2, tier: 6, age: 6 },
    { id: 'usb_cable', inputs: { insulated_wire: 2 }, outputs: { usb_cable: 2 }, ticksToComplete: 1, tier: 6, age: 6 },
    { id: 'digital_sensor', inputs: { silicon: 1, circuit_board: 1 }, outputs: { digital_sensor: 1 }, ticksToComplete: 3, tier: 6, age: 6 },
    { id: 'steel_bracket', inputs: { steel_plate: 1 }, outputs: { steel_bracket: 4 }, ticksToComplete: 2, tier: 6, age: 6 },

    // Final Goods Age 6
    { id: 'monitor', inputs: { screen: 1, plastic: 2, circuit_board: 1 }, outputs: { monitor: 1 }, ticksToComplete: 6, tier: 6, age: 6 },
    { id: 'computer', inputs: { motherboard: 1, power_supply: 1, hard_drive: 1, ram_module: 1, aluminum_sheet: 2 }, outputs: { computer: 1 }, ticksToComplete: 15, tier: 6, age: 6 },
    { id: 'laptop', inputs: { motherboard: 1, screen: 1, keyboard: 1, battery: 1, plastic: 2 }, outputs: { laptop: 1 }, ticksToComplete: 18, tier: 6, age: 6 },
    { id: 'tv', inputs: { screen: 1, circuit_board: 1, plastic: 4, electric_switch: 1 }, outputs: { tv: 1 }, ticksToComplete: 12, tier: 6, age: 6 },
    { id: 'microwave', inputs: { heating_element: 1, circuit_board: 1, steel_plate: 2, glass: 1 }, outputs: { microwave: 1 }, ticksToComplete: 8, tier: 6, age: 6 },
    { id: 'calculator', inputs: { circuit_board: 1, screen: 1, plastic: 1 }, outputs: { calculator: 1 }, ticksToComplete: 4, tier: 6, age: 6 },
    { id: 'console', inputs: { motherboard: 1, graphics_card: 1, plastic: 3 }, outputs: { console: 1 }, ticksToComplete: 12, tier: 6, age: 6 },
    { id: 'printer', inputs: { electric_motor: 2, circuit_board: 1, plastic: 3 }, outputs: { printer: 1 }, ticksToComplete: 8, tier: 6, age: 6 },
    { id: 'watch_digital', inputs: { circuit_board: 1, plastic: 1, battery: 1 }, outputs: { watch_digital: 1 }, ticksToComplete: 3, tier: 6, age: 6 },
    { id: 'server', inputs: { motherboard: 2, hard_drive: 4, power_supply: 2, steel_plate: 4 }, outputs: { server: 1 }, ticksToComplete: 20, tier: 6, age: 6 },
    { id: 'scanner', inputs: { light_bulb: 2, digital_sensor: 1, electric_motor: 1, plastic: 2 }, outputs: { scanner: 1 }, ticksToComplete: 8, tier: 6, age: 6 },
    { id: 'modem', inputs: { circuit_board: 2, plastic: 1 }, outputs: { modem: 1 }, ticksToComplete: 5, tier: 6, age: 6 },
    { id: 'router', inputs: { circuit_board: 2, plastic: 1, radio_transmitter: 1 }, outputs: { router: 1 }, ticksToComplete: 5, tier: 6, age: 6 },
    { id: 'digital_camera', inputs: { digital_sensor: 1, screen: 1, glass_lens: 1, battery: 1 }, outputs: { digital_camera: 1 }, ticksToComplete: 8, tier: 6, age: 6 },
    { id: 'mp3_player', inputs: { circuit_board: 1, screen: 1, battery: 1, plastic: 1 }, outputs: { mp3_player: 1 }, ticksToComplete: 5, tier: 6, age: 6 },
    { id: 'electronic_lock', inputs: { circuit_board: 1, electric_motor: 1, steel_plate: 1 }, outputs: { electronic_lock: 1 }, ticksToComplete: 6, tier: 6, age: 6 },
    { id: 'gps_device', inputs: { screen: 1, circuit_board: 1, battery: 1, radio_transmitter: 1 }, outputs: { gps_device: 1 }, ticksToComplete: 8, tier: 6, age: 6 },
    { id: 'barcode_scanner', inputs: { led: 1, digital_sensor: 1, plastic: 1 }, outputs: { barcode_scanner: 1 }, ticksToComplete: 5, tier: 6, age: 6 },
    { id: 'atm_machine', inputs: { computer: 1, safe: 1, screen: 1, steel_plate: 4 }, outputs: { atm_machine: 1 }, ticksToComplete: 25, tier: 6, age: 6 },
    { id: 'pos_terminal', inputs: { screen: 1, circuit_board: 1, keyboard: 1 }, outputs: { pos_terminal: 1 }, ticksToComplete: 8, tier: 6, age: 6 },
    { id: 'led_display', inputs: { led: 8, circuit_board: 2, aluminum_sheet: 2 }, outputs: { led_display: 1 }, ticksToComplete: 10, tier: 6, age: 6 },
    { id: 'surveillance_camera', inputs: { digital_camera: 1, electric_motor: 1 }, outputs: { surveillance_camera: 1 }, ticksToComplete: 10, tier: 6, age: 6 },
    { id: 'tablet', inputs: { screen: 1, motherboard: 1, battery: 1, aluminum_sheet: 1 }, outputs: { tablet: 1 }, ticksToComplete: 12, tier: 6, age: 6 },
    { id: 'bracket_assembly', inputs: { steel_bracket: 6, steel_plate: 1 }, outputs: { bracket_assembly: 1 }, ticksToComplete: 5, tier: 6, age: 6 },
    { id: 'computer_station', inputs: { computer: 1, monitor: 2, mouse: 1, keyboard: 1 }, outputs: { computer_station: 1 }, ticksToComplete: 20, tier: 6, age: 6 },
    { id: 'cable_organizer', inputs: { usb_cable: 4, plastic: 2 }, outputs: { cable_organizer: 1 }, ticksToComplete: 4, tier: 6, age: 6 },

    // --- AGE 7: FUTURE ---
    // - Updated with new logic for Age 7
    // Intermediates
    { id: 'adv_battery', inputs: { bauxite: 1, rare_earth_ore: 1, plastic: 1 }, outputs: { adv_battery: 1 }, ticksToComplete: 6, tier: 7, age: 7 },
    { id: 'composite', inputs: { plastic: 2, coal: 2 }, outputs: { composite: 1 }, ticksToComplete: 6, tier: 7, age: 7 },
    { id: 'graphene_sheet', inputs: { coal: 4, electric_coil: 2 }, outputs: { graphene_sheet: 1 }, ticksToComplete: 8, tier: 7, age: 7 },
    { id: 'nano_material', inputs: { composite: 1, silicon: 1 }, outputs: { nano_material: 1 }, ticksToComplete: 10, tier: 7, age: 7 },
    { id: 'superconductor', inputs: { rare_earth_ore: 2, copper_wire: 4 }, outputs: { superconductor: 1 }, ticksToComplete: 10, tier: 7, age: 7 },
    { id: 'quantum_processor', inputs: { superconductor: 2, silicon: 2, laser: 1 }, outputs: { quantum_processor: 1 }, ticksToComplete: 20, tier: 7, age: 7 },
    { id: 'ai_core', inputs: { quantum_processor: 1, motherboard: 2, rare_earth_ore: 2 }, outputs: { ai_core: 1 }, ticksToComplete: 30, tier: 7, age: 7 },
    { id: 'plasma_containment', inputs: { superconductor: 4, aluminum_sheet: 2 }, outputs: { plasma_containment: 1 }, ticksToComplete: 15, tier: 7, age: 7 },
    { id: 'fusion_core', inputs: { plasma_containment: 1, rare_earth_ore: 4 }, outputs: { fusion_core: 1 }, ticksToComplete: 40, tier: 7, age: 7 },
    { id: 'neural_interface', inputs: { digital_sensor: 2, ai_core: 1, nano_material: 1 }, outputs: { neural_interface: 1 }, ticksToComplete: 20, tier: 7, age: 7 },
    { id: 'holographic_projector', inputs: { laser: 2, glass_lens: 2, circuit_board: 2 }, outputs: { holographic_projector: 1 }, ticksToComplete: 12, tier: 7, age: 7 },
    { id: 'smart_fabric', inputs: { synthetic_fabric: 2, nano_material: 1, circuit_board: 1 }, outputs: { smart_fabric: 1 }, ticksToComplete: 8, tier: 7, age: 7 },
    { id: 'anti_grav_unit', inputs: { superconductor: 4, fusion_core: 1 }, outputs: { anti_grav_unit: 1 }, ticksToComplete: 50, tier: 7, age: 7 },
    { id: 'liquid_nitrogen', inputs: { coal: 2, rare_earth_ore: 1 }, outputs: { liquid_nitrogen: 2 }, ticksToComplete: 5, tier: 7, age: 7 },
    { id: 'helmet', inputs: { composite: 1, aluminum_sheet: 1, plastic: 1 }, outputs: { helmet: 1 }, ticksToComplete: 5, tier: 7, age: 7 },

    // Final Goods Age 7
    { id: 'smartphone', inputs: { cpu: 1, screen: 1, adv_battery: 1, camera: 1 }, outputs: { smartphone: 1 }, ticksToComplete: 10, tier: 7, age: 7 },
    { id: 'drone', inputs: { electric_motor: 4, adv_battery: 1, circuit_board: 1, composite: 1 }, outputs: { drone: 1 }, ticksToComplete: 10, tier: 7, age: 7 },
    { id: 'robot', inputs: { ai_core: 1, electric_motor: 6, composite: 4, adv_battery: 2 }, outputs: { robot: 1 }, ticksToComplete: 30, tier: 7, age: 7 },
    { id: 'vr_headset', inputs: { screen: 2, cpu: 1, plastic: 2, digital_sensor: 2 }, outputs: { vr_headset: 1 }, ticksToComplete: 12, tier: 7, age: 7 },
    { id: 'electric_car', inputs: { composite: 6, adv_battery: 4, electric_motor: 2, screen: 1 }, outputs: { electric_car: 1 }, ticksToComplete: 50, tier: 7, age: 7 },
    { id: 'laser', inputs: { rare_earth_ore: 1, glass: 2, circuit_board: 2 , cpu:1, power_supply:1}, outputs: { laser: 1 }, ticksToComplete: 15, tier: 7, age: 7 },
    { id: 'solar_panel_item', inputs: { silicon: 4, glass: 2, aluminum_sheet: 1 }, outputs: { solar_panel_item: 1 }, ticksToComplete: 8, tier: 7, age: 7 },
    { id: 'flying_car', inputs: { anti_grav_unit: 2, composite: 6, fusion_core: 1 }, outputs: { flying_car: 1 }, ticksToComplete: 100, tier: 7, age: 7 },
    { id: 'hoverboard', inputs: { anti_grav_unit: 1, composite: 2 }, outputs: { hoverboard: 1 }, ticksToComplete: 30, tier: 7, age: 7 },
    { id: 'printer_3d', inputs: { electric_motor: 3, aluminum_rod: 4, computer: 1 }, outputs: { printer_3d: 1 }, ticksToComplete: 20, tier: 7, age: 7 },
    { id: 'holographic_display', inputs: { holographic_projector: 4, nano_material: 2 }, outputs: { holographic_display: 1 }, ticksToComplete: 25, tier: 7, age: 7 },
    { id: 'ar_glasses', inputs: { holographic_projector: 1, cpu: 1, glass_lens: 2 }, outputs: { ar_glasses: 1 }, ticksToComplete: 15, tier: 7, age: 7 },
    { id: 'exoskeleton', inputs: { electric_motor: 8, composite: 4, ai_core: 1, adv_battery: 2 }, outputs: { exoskeleton: 1 }, ticksToComplete: 40, tier: 7, age: 7 },
    { id: 'personal_assistant_robot', inputs: { robot: 1, ai_core: 1, smart_fabric: 2 }, outputs: { personal_assistant_robot: 1 }, ticksToComplete: 50, tier: 7, age: 7 },
    { id: 'smart_home_hub', inputs: { ai_core: 1, radio_transmitter: 1, screen: 1 }, outputs: { smart_home_hub: 1 }, ticksToComplete: 20, tier: 7, age: 7 },
    { id: 'autonomous_vehicle', inputs: { electric_car: 1, ai_core: 2, digital_sensor: 6 }, outputs: { autonomous_vehicle: 1 }, ticksToComplete: 80, tier: 7, age: 7 },
    { id: 'space_suit', inputs: { smart_fabric: 6, composite: 2 }, outputs: { space_suit: 1 }, ticksToComplete: 30, tier: 7, age: 7 },
    { id: 'medical_scanner', inputs: { laser: 2, ai_core: 1, bed: 1 }, outputs: { medical_scanner: 1 }, ticksToComplete: 40, tier: 7, age: 7 },
    { id: 'quantum_computer', inputs: { quantum_processor: 4, plasma_containment: 1, server: 1 }, outputs: { quantum_computer: 1 }, ticksToComplete: 100, tier: 7, age: 7 },
    { id: 'teleporter_pad', inputs: { quantum_computer: 1, fusion_core: 2, nano_material: 10 }, outputs: { teleporter_pad: 1 }, ticksToComplete: 200, tier: 7, age: 7 },
    { id: 'energy_shield', inputs: { plasma_containment: 2, fusion_core: 1 }, outputs: { energy_shield: 1 }, ticksToComplete: 80, tier: 7, age: 7 },
    { id: 'weather_control', inputs: { quantum_computer: 1, digital_sensor: 20, anti_grav_unit: 4 }, outputs: { weather_control: 1 }, ticksToComplete: 150, tier: 7, age: 7 },
    { id: 'replicator', inputs: { quantum_computer: 1, teleporter_pad: 1, nano_material: 20 }, outputs: { replicator: 1 }, ticksToComplete: 300, tier: 7, age: 7 },
    { id: 'cryogenic_chamber', inputs: { liquid_nitrogen: 6, composite: 4, digital_sensor: 2 }, outputs: { cryogenic_chamber: 1 }, ticksToComplete: 60, tier: 7, age: 7 },
    { id: 'space_helmet', inputs: { helmet: 1, composite: 2, glass: 1 }, outputs: { space_helmet: 1 }, ticksToComplete: 15, tier: 7, age: 7 },
    { id: 'graphene_armor', inputs: { graphene_sheet: 8, composite: 4, nano_material: 2 }, outputs: { graphene_armor: 1 }, ticksToComplete: 40, tier: 7, age: 7 },
    { id: 'neural_implant', inputs: { neural_interface: 1, ai_core: 1, adv_battery: 1 }, outputs: { neural_implant: 1 }, ticksToComplete: 35, tier: 7, age: 7 },

    // --- MACHINES & GENERATORS ---
    // Age 1 machines
    { id: 'carpenters_bench', inputs: { planks: 6, wooden_beam: 2, nails: 10 }, outputs: { carpenters_bench: 1 }, ticksToComplete: 3, tier: 1, age: 1 },
    { id: 'blacksmiths_anvil', inputs: { iron_plate: 4, iron_rod: 4 }, outputs: { blacksmiths_anvil: 1 }, ticksToComplete: 5, tier: 1, age: 1 },
    { id: 'masons_workshop', inputs: { stone: 8, wooden_beam: 2 }, outputs: { masons_workshop: 1 }, ticksToComplete: 3, tier: 1, age: 1 },
    { id: 'stone_furnace', inputs: { stone: 8 }, outputs: { stone_furnace: 1 }, ticksToComplete: 2, tier: 1, age: 1 },
    { id: 'treadwheel', inputs: { wood: 10 }, outputs: { treadwheel: 1 }, ticksToComplete: 5, tier: 1, age: 1 },
    // Age 2 machines
    { id: 'glassblowers_workshop', inputs: { iron_plate: 4, bricks: 8, copper_tubing: 2 }, outputs: { glassblowers_workshop: 1 }, ticksToComplete: 6, tier: 2, age: 2 },
    { id: 'potters_wheel_machine', inputs: { wooden_beam: 4, iron_rod: 2, stone: 4 }, outputs: { potters_wheel_machine: 1 }, ticksToComplete: 4, tier: 2, age: 2 },
    { id: 'foundry', inputs: { bricks: 10, steel_beam: 4 }, outputs: { foundry: 1 }, ticksToComplete: 10, tier: 3, age: 3 },
    // Age 3 machines
    { id: 'steel_forge', inputs: { steel_plate: 10, bricks: 12, iron_chain: 4 }, outputs: { steel_forge: 1 }, ticksToComplete: 12, tier: 3, age: 3 },
    { id: 'heavy_assembly', inputs: { steel_beam: 8, steel_plate: 8, gear: 6, crane: 1 }, outputs: { heavy_assembly: 1 }, ticksToComplete: 20, tier: 3, age: 3 },
    { id: 'steam_engine_gen', inputs: { steel_plate: 10, boiler: 1, piston: 2 }, outputs: { steam_engine_gen: 1 }, ticksToComplete: 20, tier: 3, age: 3 },
    // Age 4 machines
    { id: 'precision_assembler', inputs: { steel_plate: 10, gear: 10, electric_motor: 2, ball_bearing: 4 }, outputs: { precision_assembler: 1 }, ticksToComplete: 25, tier: 4, age: 4 },
    
    { id: 'chemical_plant', inputs: { steel_plate: 10, pipe: 10, glass: 5 }, outputs: { chemical_plant: 1 }, ticksToComplete: 25, tier: 4, age: 4 },
    { id: 'research_laboratory', inputs: { steel_plate: 10, pipe: 8, glass: 6, vacuum_tube: 4, gear: 6, copper_wire: 8 }, outputs: { research_laboratory: 1 }, ticksToComplete: 30, tier: 4, age: 4 },
    { id: 'diesel_gen', inputs: { engine_block: 2, generator: 1 }, outputs: { diesel_gen: 1 }, ticksToComplete: 25, tier: 4, age: 4 },
    
    { id: 'electronics_fab', inputs: { composite: 10, electric_motor: 5, heating_element: 10, resistor: 10 }, outputs: { electronics_fab: 1 }, ticksToComplete: 40, tier: 7, age: 7 },
    { id: 'solar_array', inputs: { solar_panel_item: 16, aluminum_sheet: 4 }, outputs: { solar_array: 1 }, ticksToComplete: 50, tier: 7, age: 7 },
    { id: 'fusion_reactor', inputs: { fusion_core: 1, superconductor: 20, concrete: 100 }, outputs: { fusion_reactor: 1 }, ticksToComplete: 100, tier: 7, age: 7 }
  ],

  // ============================================================================
  // Market Dynamics
  // ============================================================================
  market: {
    noveltyBonus: 2.5,
    // Decay rates - accelerating with quantity
    decayRateBase: 0.04,      // For first 10 units
    decayRateMedium: 0.06,    // For 11-25 units
    decayRateHigh: 0.10,      // For 26+ units
    // Recovery
    recoveryRate: 0.01,        // Reduced from 0.02 - slower recovery
    damageHealingRate: 0.01,    // How fast damage heals per tick
    damagePenaltyFactor: 50,   // Divides recovery: effectiveRecovery = base / (1 + damage/factor)
    // Price history tracking
    priceHistorySampleInterval: 10,  // Sample prices every 10 ticks
    priceHistoryMaxSamples: 50,      // Keep last 50 samples (500 ticks of history)
    // Diversification Bonus (rewards selling variety)
    diversificationWindow: 100,      // Track sales in last 100 ticks
    diversificationBonuses: {
      3: 1.10,   // 3+ unique items → +10% all prices
      5: 1.15,   // 5+ unique items → +15% all prices
      7: 1.20    // 7+ unique items → +20% all prices
    },
    // Age Obsolescence (older products lose value as you advance)
    // When you discover Age N+1 recipes, Age N products become obsolete
    obsolescenceEnabled: true,
    obsolescenceMaxDebuff: 0.5,  // Max 50% price reduction when next age fully discovered
    // Bounds
    minPopularity: 0.25,
    maxPopularity: 2.5
  },

  // ============================================================================
  // Research
  // ============================================================================
  research: {
    // Existing
    energyCost: 3,
    discoveryChance: 0.20,
    proximityWeight: 0.5,

    // Research Points system
    creditsToRPRatio: 10,           // 10 credits = 1 RP
    ageMultipliers: { 1: 1.0, 2: 1.5, 3: 2.0, 4: 3.0, 5: 5.0, 6: 8.0, 7: 12.0 },
    passiveDiscoveryChance: 0.002,  // 1/500 per tick
    ageWeighting: { floor: 0.30, ceiling: 0.85 },
    experimentCosts: { 1: 100, 2: 150, 3: 250, 4: 400, 5: 700, 6: 1200, 7: 2000 },
    prototypeMultiplier: 5          // 5x recipe quantity for prototypes
  },

  // ============================================================================
  // Machines
  // ============================================================================
  machines: [
    {
      id: 'stone_furnace',
      itemId: 'stone_furnace',
      name: 'Stone Furnace',
      sizeX: 3, sizeY: 3,
      energyConsumption: 1,
      animation: { frames: 4, speed: 0.05 },
      disableAutoScale: true,
      allowedRecipes: [
        'iron_ingot', 'copper_ingot', 'bricks', 'glass', 'stone_bricks', 'aluminum_ingot', 'silicon', // Added advanced smelting
        // Age 1 stone/ceramic processing
        'stone_slab', 'stone_tile', 'mortar',
        // Age 2 ceramics and glass
        'ceramic_tile', 'terracotta', 'porcelain', 'glass_pane', 'glass_lens', 'decorative_glass'
      ]
    },
    // ============================================
    // AGE 1 MACHINES
    // ============================================
    {
      id: 'carpenters_bench',
      itemId: 'carpenters_bench',
      name: "Carpenter's Bench",
      sizeX: 1, sizeY: 2,
      energyConsumption: 1,
      animation: { frames: 4, speed: 0.1 },
      disableAutoScale: true,
      spriteScale:1.25,
      allowedRecipes: [
        // Intermediates
        'planks', 'wooden_beam', 'wooden_dowel', 'wooden_shingle', 'wooden_handle', 'rope',
        // Furniture
        'chair', 'table', 'wardrobe', 'chest', 'bed', 'bench', 'workbench', 'crate', 'barrel',
        // Structures
        'fence', 'door', 'ladder', 'staircase', 'shingled_roof', 'roof_tile_section',
        // Vehicles & Transport
        'wheelbarrow', 'cart', 'wagon',
        // Other
        'coat_hanger', 'plow'
      ]
    },
    {
      id: 'blacksmiths_anvil',
      itemId: 'blacksmiths_anvil',
      name: "Blacksmith's Anvil",
      sizeX: 2, sizeY: 2,
      energyConsumption: 2,
      animation: { frames: 4, speed: 0.02 },
      disableAutoScale: true,
      spriteScale:1.25,
      allowedRecipes: [
        // Intermediates
        'iron_plate', 'iron_rod', 'nails', 'iron_wire', 'iron_bracket', 'hinges',
        'iron_chain', 'iron_axle', 'wheel', 'copper_sheet',
        // Tools
        'hammer', 'pickaxe', 'shovel', 'axe', 'saw', 'chisel', 'mallet', 'bucket', 'tool_rack',
        // Weapons & Military
        'shield', 'spear', 'shield_rack', 'bronze_armor',
        // Metal items
        'forge','iron_grate', 'anchor', 'bellows', 'water_wheel', 'anvil'
      ]
    },
    {
      id: 'masons_workshop',
      itemId: 'masons_workshop',
      name: "Mason's Workshop",
      sizeX: 2, sizeY: 3,
      energyConsumption: 1,
      animation: { frames: 4, speed: 0.1 },
      disableAutoScale: true,
      allowedRecipes: [
        // Stone construction
        'stone_wall', 'stone_pillar', 'well', 'bridge_section', 'gate',
        // Self-build
        'treadwheel', 'stone_furnace','blacksmiths_anvil',
        // Copper/Brass Intermediates
        'copper_sheet', 'pipe', 'copper_tubing', 'copper_rod', 'brass_sheet',
        // Scientific Instruments
        'compass', 'barometer', 'spyglass', 'telescope', 'magnifying_glass', 'sundial', 'hourglass',
        // Decorative Metalwork
        'kettle', 'candelabra', 'copper_statue', 'decorative_urn', 'church_bell',
        // Plumbing
        'fountain', 'aqueduct_section', 'bathtub', 'sink', 'chimney',
        // Precision Mechanical
        'clock', 'pocket_watch', 'padlock', 'pressure_gauge', 'wrench',
        // Bootstrap components for Age 3 machines
        'gear', 'boiler'
      ]
    },
    // ============================================
    // AGE 2 MACHINES
    // ============================================
    {
      id: 'glassblowers_workshop',
      itemId: 'glassblowers_workshop',
      name: "Glassblower's Workshop",
      sizeX: 2, sizeY: 2,
      energyConsumption: 3,
      animation: { frames: 4, speed: 0.02 },
      disableAutoScale: true,
      spriteScale:0.8,
      allowedRecipes: [
        // Glass items
        'window', 'mirror', 'lantern', 'chandelier', 'stained_glass', 'greenhouse_panel'
      ]
    },
    {
      id: 'potters_wheel_machine',
      itemId: 'potters_wheel_machine',
      name: "Potter's Wheel",
      sizeX: 2, sizeY: 2,
      energyConsumption: 1,
      animation: { frames: 4, speed: 0.02 },
      spriteScale:1.1,
      disableAutoScale: true,
      allowedRecipes: [
        // Ceramics
        'vase', 'pot', 'ceramic_bowl', 'tile_floor', 'plate_set',
        // Self-build
        'pottery_wheel'
      ]
    },
    // ============================================
    // AGE 3 MACHINES
    // ============================================
    {
      id: 'steel_forge',
      itemId: 'steel_forge',
      name: 'Steel Forge',
      sizeX: 2, sizeY: 2,
      energyConsumption: 8,
      animation: { frames: 4, speed: 0.1 },
      allowedRecipes: [
        // Steel Intermediates
        'steel_plate', 'steel_beam', 'steel_rod', 'steel_gear', 'steel_cable',
        'steel_rivet', 'steel_spring', 'ball_bearing', 'steel_chain', 'steel_pipe',
        // Steel Products
        'tool_box', 'safe', 'vault_door', 'manhole_cover',
        // Bootstrap for Heavy Assembly
        'crane'
      ]
    },
    {
      id: 'heavy_assembly',
      itemId: 'heavy_assembly',
      name: 'Heavy Assembly Plant',
      sizeX: 3, sizeY: 2,
      energyConsumption: 10,
      animation: { frames: 4, speed: 0.1 },
      allowedRecipes: [
        // Mechanical Intermediates
        'gear', 'crankshaft', 'piston', 'coupling',
        // Steam Components
        'steam_valve', 'drive_shaft', 'flywheel', 'boiler', 'camshaft',
        // Bootstrap for Steel Forge
        'steel_plate',
        // Steam-era Machines
        'sewing_machine', 'printing_press', 'mechanical_loom', 'rotary_engine', 'steam_hammer',
        // Home
        'stove', 'pressure_cooker', 'radiator', 'bicycle',
        // Large Construction
        'crane', 'elevator', 'steel_bridge', 'water_tower', 'rail_track',
        // Heavy Vehicles
        'locomotive',
        // Industrial Machines
        'industrial_furnace', 'industrial_boiler', 'lathe', 'milling_machine',
        'industrial_press', 'conveyor_belt',
        // Large Items
        'pipe_organ', 'plumbing_system',
        // Bootstrap for Precision Assembler
        'electric_coil', 'electric_motor'
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
        'steel_ingot', 'aluminum_ingot', 'silicon', 'brass_ingot', 'bronze_ingot' // Consolidating all ingot/hot processing
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
        // Age 4 Chemical
        'gasoline', 'diesel_fuel', 'lubricant', 'plastic', 'rubber', 'asphalt', 'concrete',
        'plastic_sheet', 'vinyl', 'fiberglass', 'synthetic_fabric', 'glass_bottle', 'leather',
        // Age 5
        'insulation',
        // Age 7 advanced chem
        'composite', 'nano_material', 'liquid_nitrogen'
      ]
    },
    // ============================================
    // AGE 4+ MACHINES
    // ============================================
    {
      id: 'research_laboratory',
      itemId: 'research_laboratory',
      name: 'Research Laboratory',
      sizeX: 4, sizeY: 4,
      energyConsumption: 50,
      animation: { frames: 4, speed: 0.05 },
      disableAutoScale: true,
      // Special machine: does not process recipes, provides passive discovery bonus
      allowedRecipes: [],
      isResearchFacility: true,
      passiveDiscoveryBonus: 0.001 // +0.1% per facility
    },
    {
      id: 'precision_assembler',
      itemId: 'precision_assembler',
      name: 'Precision Assembler',
      sizeX: 2, sizeY: 2,
      energyConsumption: 15,
      animation: { frames: 4, speed: 0.2 },
      allowedRecipes: [
        // Age 4 - Electrical Components
        'copper_wire', 'battery', 'light_bulb', 'vacuum_tube',
        // Age 4 - Engine Components
        'carburetor', 'spark_plug', 'engine_block', 'tire', 'car_tire', 'car_engine',
        // Age 4 - Vehicles
        'lawn_mower', 'chainsaw', 'generator', 'scooter', 'motorcycle',
        'automobile', 'diesel_truck', 'kayak',
        // Age 4 - Industrial
        'industrial_pump', 'power_saw', 'jackhammer', 'concrete_mixer',
        // Age 4 - Consumer & Infrastructure
        'traffic_light', 'street_lamp', 'telephone', 'vinyl_record',
        'plastic_container', 'garden_hose', 'fuel_tank', 'oil_drum', 'flashlight',
        'road_segment', 'radio_transmitter', 'typewriter', 'camera',
        'leather_jacket', 'amplifier', 'chemistry_set', 'raincoat',
        // Age 4 - Research Equipment
        'research_laboratory',

        // Age 5 - Electrical Intermediates
        'aluminum_sheet', 'aluminum_rod', 'insulated_wire', 'electric_coil', 'electric_motor',
        'heating_element', 'electric_switch', 'transformer', 'capacitor', 'resistor',
        'bulb_socket', 'relay', 'thermostat', 'compressor', 'housing', 'steel_wire',
        // Age 5 - Appliances
        'fan', 'toaster', 'vacuum', 'fridge', 'washer', 'dishwasher', 'air_conditioner',
        'electric_oven', 'radio', 'drill', 'mixer', 'blender', 'food_processor', 'hair_dryer',
        'electric_heater', 'electric_kettle', 'electric_saw', 'arc_welder', 'electric_guitar',
        'jukebox', 'ceiling_fan', 'water_heater', 'sander', 'elevator_motor',
        'motor_housing_unit', 'insulated_pipe', 'relay_panel', 'wire_spool', 'lamp_fixture',

        // Age 6
        'steel_bracket', 'bracket_assembly'
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
        // Age 6 (Digital) - Intermediates
        'circuit_board', 'cpu', 'led', 'screen', 'ram_module', 'hard_drive', 'motherboard', 
        'graphics_card', 'power_supply', 'keyboard', 'mouse', 'usb_cable', 'digital_sensor',
        // Age 6 - Final Goods
        'monitor', 'computer', 'laptop', 'tv', 'microwave', 'calculator', 'console', 'printer', 
        'watch_digital', 'server', 'scanner', 'modem', 'router', 'digital_camera', 'mp3_player', 
        'electronic_lock', 'gps_device', 'barcode_scanner', 'atm_machine', 'pos_terminal', 
        'led_display', 'surveillance_camera', 'tablet', 'computer_station', 'cable_organizer',

        // Age 7 (Future) - Intermediates
        'adv_battery', 'graphene_sheet', 'superconductor', 'quantum_processor', 'ai_core',
        'plasma_containment', 'fusion_core', 'neural_interface', 'holographic_projector',
        'smart_fabric', 'anti_grav_unit', 'helmet',
        // Age 7 - Final Goods
        'smartphone', 'drone', 'robot', 'vr_headset', 'electric_car', 'laser', 'solar_panel_item', 
        'flying_car', 'hoverboard', 'printer_3d', 'holographic_display', 'ar_glasses', 'exoskeleton', 
        'personal_assistant_robot', 'smart_home_hub', 'autonomous_vehicle', 'space_suit', 
        'medical_scanner', 'quantum_computer', 'teleporter_pad', 'energy_shield', 'weather_control', 'replicator',
        'cryogenic_chamber', 'space_helmet', 'graphene_armor', 'neural_implant',

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
  // Machine Build Recipes (Slot-based manual building)
  // Each slot represents a component part of the machine
  // ============================================================================
  machineRecipes: {
    stone_furnace: {
      slots: [
        { label: 'Furnace Base', material: 'stone_bricks', quantity: 1 },
        { label: 'Furnace Walls', material: 'stone_bricks', quantity: 3 },
        { label: 'Front Access', material: 'stone_bricks', quantity: 2 },
        { label: 'Chimney', material: 'stone_bricks', quantity: 2 }
      ]
    },
    carpenters_bench: {
      slots: [
        { label: 'Work Surface', material: 'planks', quantity: 2 },
        { label: 'Frame Panels', material: 'planks', quantity: 4 },
        { label: 'Structural Supports', material: 'wooden_beam', quantity: 2 },
        { label: 'Assembly Nails', material: 'nails', quantity: 12 }
      ]
    },
    blacksmiths_anvil: {
      slots: [
        { label: 'Solid Iron Block', material: 'iron_plate', quantity: 4 },
        { label: 'Iron Supports', material: 'iron_rod', quantity: 4 }
      ]
    },
    masons_workshop: {
      slots: [
        { label: 'Work Stones', material: 'stone_bricks', quantity: 4 },
        { label: 'Base Stones', material: 'stone_bricks', quantity: 4 },
        { label: 'Structural Beams', material: 'wooden_beam', quantity: 2 }
      ]
    },
    glassblowers_workshop: {
      slots: [
        { label: 'Furnace Plating', material: 'iron_plate', quantity: 4 },
        { label: 'Kiln Bricks', material: 'bricks', quantity: 12 },
        { label: 'Air System', material: 'copper_tubing', quantity: 2 }
      ]
    },
    potters_wheel_machine: {
      slots: [
        { label: 'Wooden Frame', material: 'wooden_beam', quantity: 4 },
        { label: 'Iron Axle', material: 'iron_rod', quantity: 2 },
        { label: 'Stone Wheel', material: 'stone_bricks', quantity: 4 }
      ]
    },
    foundry: {
      slots: [
        { label: 'Furnace Bricks', material: 'bricks', quantity: 10 },
        { label: 'Structural Frame', material: 'steel_beam', quantity: 4 }
      ]
    },
    steel_forge: {
      slots: [
        { label: 'Heavy Plating', material: 'steel_plate', quantity: 10 },
        { label: 'Refractory Bricks', material: 'bricks', quantity: 12 },
        { label: 'Heavy Chains', material: 'iron_chain', quantity: 4 }
      ]
    },
    heavy_assembly: {
      slots: [
        { label: 'Heavy Frame', material: 'steel_beam', quantity: 8 },
        { label: 'Floor Plating', material: 'steel_plate', quantity: 8 },
        { label: 'Gearbox Assembly', material: 'gear', quantity: 6 },
        { label: 'Assembly Crane', material: 'crane', quantity: 1 }
      ]
    },
    precision_assembler: {
      slots: [
        { label: 'Precision Frame', material: 'steel_plate', quantity: 10 },
        { label: 'Gear Train', material: 'gear', quantity: 10 },
        { label: 'Drive Motors', material: 'electric_motor', quantity: 2 },
        { label: 'Precision Bearings', material: 'ball_bearing', quantity: 4 }
      ]
    },
    chemical_plant: {
      slots: [
        { label: 'Vessel Plating', material: 'steel_plate', quantity: 10 },
        { label: 'Piping System', material: 'pipe', quantity: 10 },
        { label: 'Observation Glass', material: 'glass', quantity: 5 }
      ]
    },
    research_laboratory: {
      slots: [
        { label: 'Laboratory Frame', material: 'steel_plate', quantity: 10 },
        { label: 'Workbench Assembly', material: 'pipe', quantity: 8 },
        { label: 'Observation Windows', material: 'glass', quantity: 6 },
        { label: 'Analysis Equipment', material: 'vacuum_tube', quantity: 4 },
        { label: 'Precision Instruments', material: 'gear', quantity: 6 },
        { label: 'Electrical Wiring', material: 'copper_wire', quantity: 8 }
      ]
    },
    electronics_fab: {
      slots: [
        { label: 'Cleanroom Frame', material: 'composite', quantity: 10 },
        { label: 'Automation Motors', material: 'electric_motor', quantity: 5 },
        { label: 'Heating Units', material: 'heating_element', quantity: 10 },
        { label: 'Control Circuitry', material: 'resistor', quantity: 10 }
      ]
    }
  },

  // ============================================================================
  // Generator Build Recipes (Slot-based manual building)
  // Each slot represents a component part of the generator
  // ============================================================================
  generatorRecipes: {
    treadwheel: {
      slots: [
        { label: 'Wheel Planks', material: 'planks', quantity: 4 },
        { label: 'Frame Posts', material: 'wooden_beam', quantity: 4 },
        { label: 'Platform Deck', material: 'planks', quantity: 2 }
      ]
    },
    steam_engine_gen: {
      slots: [
        { label: 'Heavy Frame', material: 'steel_plate', quantity: 10 },
        { label: 'Pressure Boiler', material: 'boiler', quantity: 1 },
        { label: 'Power Pistons', material: 'piston', quantity: 2 }
      ]
    },
    diesel_gen: {
      slots: [
        { label: 'Diesel Engines', material: 'engine_block', quantity: 2 },
        { label: 'Electric Generator', material: 'generator', quantity: 1 }
      ]
    },
    solar_array: {
      slots: [
        { label: 'Solar Panels', material: 'solar_panel_item', quantity: 16 },
        { label: 'Mounting Frame', material: 'aluminum_sheet', quantity: 4 }
      ]
    },
    fusion_reactor: {
      slots: [
        { label: 'Fusion Core', material: 'fusion_core', quantity: 1 },
        { label: 'Superconductor Coils', material: 'superconductor', quantity: 10 },
        { label: 'Field Magnets', material: 'superconductor', quantity: 10 },
        { label: 'Reactor Foundation', material: 'concrete', quantity: 10 },
        { label: 'Radiation Shielding', material: 'concrete', quantity: 10 },
        { label: 'Containment Vessel', material: 'concrete', quantity: 10 },
        { label: 'Outer Wall', material: 'concrete', quantity: 10 },
        { label: 'Base Structure', material: 'concrete', quantity: 10 },
        { label: 'Cap Structure', material: 'concrete', quantity: 10 },
        { label: 'Support Ring', material: 'concrete', quantity: 10 },
        { label: 'Stabilizer Ring', material: 'concrete', quantity: 10 },
        { label: 'Reinforcement Ring', material: 'concrete', quantity: 10 },
        { label: 'Cooling Structure', material: 'concrete', quantity: 10 }
      ]
    }
  },

  // ============================================================================
  // Floor & Inventory (Preserved)
  // ============================================================================
  floorSpace: {
    expansionType: 'spiral',
    initialWidth: 16,
    initialHeight: 16,
    initialChunkSize: 4,
    costPerCell: 1
  },
  inventorySpace: {
    baseCost: 50,
    costGrowth: 1.5,
    upgradeAmount: 50
  },

  // ============================================================================
  // Exploration (Preserved)
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