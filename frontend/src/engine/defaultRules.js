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
    { id: 'wood', name: 'Wood', basePrice: 2, category: 'raw', weight: 1, age: 1, description: 'Timber cut for early structures, tools, and fuel.' },
    { id: 'stone', name: 'Stone', basePrice: 2, category: 'raw', weight: 1, age: 1, description: 'Quarried rock for sturdy foundations, walls, and paving.' },
    { id: 'iron_ore', name: 'Iron Ore', basePrice: 3, category: 'raw', weight: 1, age: 1, description: 'Ore that must be smelted to unlock sturdy iron parts.' },
    { id: 'copper_ore', name: 'Copper Ore', basePrice: 3, category: 'raw', weight: 1, age: 2, description: 'Ore refined into copper for plumbing and instruments.' },
    { id: 'sand', name: 'Sand', basePrice: 1, category: 'raw', weight: 1, age: 1, description: 'Fine grains used for glassmaking, mortar, and molds.' },
    { id: 'clay', name: 'Clay', basePrice: 2, category: 'raw', weight: 1, age: 2, description: 'Malleable earth used for ceramics and brickwork.' },
    { id: 'coal', name: 'Coal', basePrice: 2, category: 'raw', weight: 1, age: 3, description: 'Dense fossil fuel burned for high heat and steam.' },
    { id: 'oil', name: 'Crude Oil', basePrice: 5, category: 'raw', weight: 2, age: 4, description: 'Crude petroleum that must be refined into fuels.' },
    { id: 'bauxite', name: 'Bauxite', basePrice: 4, category: 'raw', weight: 2, age: 5, description: 'Ore refined into aluminum.' },
    { id: 'rare_earth_ore', name: 'Rare Earth Ore', basePrice: 10, category: 'raw', weight: 2, age: 7, description: 'Ore containing elements for advanced electronics.' },

    // ========================
    // AGE 1: PRIMITIVE (Wood, Stone, Iron)
    // ========================
    // Parts
    { id: 'planks', name: 'Planks', basePrice: 4, category: 'intermediate', weight: 2, age: 1, description: 'Sawn boards for framing, furniture, and basic construction.' },
    { id: 'wooden_beam', name: 'Wooden Beam', basePrice: 6, category: 'intermediate', weight: 3, age: 1, description: 'Load-bearing timber used in bridges, roofs, and frames.' },
    { id: 'stone_bricks', name: 'Stone Bricks', basePrice: 5, category: 'intermediate', weight: 3, age: 1, description: 'Uniform masonry blocks for durable walls and furnaces.' },
    { id: 'iron_ingot', name: 'Iron Ingot', basePrice: 8, category: 'intermediate', weight: 3, age: 1, description: 'Refined iron bar ready for forging and machining.' },
    { id: 'iron_plate', name: 'Iron Plate', basePrice: 10, category: 'intermediate', weight: 4, age: 1, description: 'Flat stock for armor, panels, and sturdy brackets.' },
    { id: 'iron_rod', name: 'Iron Rod', basePrice: 9, category: 'intermediate', weight: 2, age: 1, description: 'Straight bar stock for tools, fasteners, and shapes.' },
    { id: 'nails', name: 'Nails', basePrice: 5, category: 'intermediate', weight: 1, age: 1, description: 'Small metal fasteners that bind wood securely.' },
    { id: 'rope', name: 'Rope', basePrice: 3, category: 'intermediate', weight: 1, age: 1, description: 'Twisted fiber line for hauling, tying, and lifting.' },
    { id: 'wooden_dowel', name: 'Wooden Dowel', basePrice: 3, category: 'intermediate', weight: 1, age: 1, description: 'Round peg that aligns joints and strengthens joinery.' },
    { id: 'stone_slab', name: 'Stone Slab', basePrice: 6, category: 'intermediate', weight: 4, age: 1, description: 'Flat stone for floors, counters, and cutting surfaces.' },
    { id: 'iron_wire', name: 'Iron Wire', basePrice: 4, category: 'intermediate', weight: 1, age: 1, description: 'Thin iron line for bindings, hooks, and reinforcement.' },
    { id: 'iron_bracket', name: 'Iron Bracket', basePrice: 7, category: 'intermediate', weight: 2, age: 1, description: 'Angle support for corners, braces, and joints.' },
    { id: 'hinges', name: 'Iron Hinges', basePrice: 8, category: 'intermediate', weight: 1, age: 1, description: 'Pivot hardware that lets doors and lids swing.' },
    { id: 'mortar', name: 'Mortar', basePrice: 3, category: 'intermediate', weight: 2, age: 1, description: 'Binding mix that locks bricks and stones together.' },
    { id: 'iron_chain', name: 'Iron Chain', basePrice: 10, category: 'intermediate', weight: 3, age: 1, description: 'Linked metal for lifting, towing, and restraints.' },
    { id: 'stone_tile', name: 'Stone Tile', basePrice: 4, category: 'intermediate', weight: 2, age: 1, description: 'Uniform tiles for neat paving and durable floors.' },
    { id: 'wooden_shingle', name: 'Wooden Shingle', basePrice: 3, category: 'intermediate', weight: 1, age: 1, description: 'Thin wooden tiles that shed rain on roofs.' },
    { id: 'iron_axle', name: 'Iron Axle', basePrice: 12, category: 'intermediate', weight: 5, age: 1, description: 'Rigid shaft that carries wheels and rotating parts.' },
    { id: 'wheel', name: 'Wooden Wheel', basePrice: 10, category: 'intermediate', weight: 4, age: 1, description: 'Simple wooden wheel for carts, wagons, and mechanisms.' },
    { id: 'wooden_handle', name: 'Wooden Handle', basePrice: 3, category: 'intermediate', weight: 1, age: 1, description: 'Grip stock for tools, improving control and comfort.' },

    // Final Goods (Furniture, Basic Tools, Structures) - Original prices, balanced by low early-game costs
    { id: 'chair', name: 'Wooden Chair', basePrice: 25, category: 'final', weight: 5, age: 1, description: 'Basic seating for homes or workshops.' },
    { id: 'table', name: 'Wooden Table', basePrice: 80, category: 'final', weight: 10, age: 1, description: 'Work surface for meals or crafting.' },
    { id: 'wardrobe', name: 'Wardrobe', basePrice: 120, category: 'final', weight: 15, age: 1, description: 'Tall cabinet for storing clothing.' },
    { id: 'chest', name: 'Storage Chest', basePrice: 100, category: 'final', weight: 8, age: 1, description: 'Lockable storage for valuables and tools.' },
    { id: 'bucket', name: 'Iron Bucket', basePrice: 60, category: 'final', weight: 3, age: 1, description: 'Rugged container for hauling water or materials.' },
    { id: 'hammer', name: 'Hammer', basePrice: 20, category: 'final', weight: 4, age: 1, description: 'All-purpose tool for driving and shaping.' },
    { id: 'pickaxe', name: 'Pickaxe', basePrice: 35, category: 'final', weight: 5, age: 1, description: 'Tool for breaking rock and mining ore.' },
    { id: 'shovel', name: 'Shovel', basePrice: 40, category: 'final', weight: 4, age: 1, description: 'Digging tool for earth, sand, and ore.' },
    { id: 'fence', name: 'Fence Section', basePrice: 10, category: 'final', weight: 5, age: 1, description: 'Barrier piece for pens, borders, and safety.' },
    { id: 'door', name: 'Reinforced Door', basePrice: 120, category: 'final', weight: 12, age: 1, description: 'Reinforced door that secures entrances.' },
    { id: 'stone_wall', name: 'Stone Wall', basePrice: 10, category: 'final', weight: 10, age: 1, description: 'Thick wall segment for sturdy enclosures.' },
    { id: 'bed', name: 'Wooden Bed', basePrice: 90, category: 'final', weight: 12, age: 1, description: 'Basic sleeping frame for early housing.' },
    { id: 'bench', name: 'Wooden Bench', basePrice: 20, category: 'final', weight: 6, age: 1, description: 'Simple seat for workshops or homes.' },
    { id: 'ladder', name: 'Wooden Ladder', basePrice: 25, category: 'final', weight: 5, age: 1, description: 'Portable steps for reaching elevated areas.' },
    { id: 'wheelbarrow', name: 'Wheelbarrow', basePrice: 100, category: 'final', weight: 10, age: 1, description: 'One-wheel carrier for soil and supplies.' },
    { id: 'cart', name: 'Hand Cart', basePrice: 200, category: 'final', weight: 20, age: 1, description: 'Two-wheeled hauler for moving supplies by hand.' },
    { id: 'barrel', name: 'Wooden Barrel', basePrice: 40, category: 'final', weight: 8, age: 1, description: 'Sturdy cask for storing liquids and bulk goods.' },
    { id: 'anvil', name: 'Iron Anvil', basePrice: 80, category: 'final', weight: 30, age: 1, description: 'Solid iron block that serves as a forging surface.' },
    { id: 'bellows', name: 'Forge Bellows', basePrice: 50, category: 'final', weight: 6, age: 1, description: 'Air pump that feeds a hotter forge flame.' },
    { id: 'axe', name: 'Iron Axe', basePrice: 15, category: 'final', weight: 4, age: 1, description: 'Edged tool for chopping timber and shaping wood.' },
    { id: 'saw', name: 'Hand Saw', basePrice: 25, category: 'final', weight: 3, age: 1, description: 'Cutting tool for boards and precise joinery.' },
    { id: 'chisel', name: 'Iron Chisel', basePrice: 10, category: 'final', weight: 2, age: 1, description: 'Sharp tool for carving wood or stone.' },
    { id: 'mallet', name: 'Wooden Mallet', basePrice: 15, category: 'final', weight: 3, age: 1, description: 'Wooden hammer for joinery without marring.' },
    { id: 'shield', name: 'Iron Shield', basePrice: 60, category: 'final', weight: 10, age: 1, description: 'Defensive board to block blows.' },
    { id: 'spear', name: 'Iron Spear', basePrice: 15, category: 'final', weight: 4, age: 1, description: 'Long reach weapon for hunting or defense.' },
    { id: 'gate', name: 'Wooden Gate', basePrice: 120, category: 'final', weight: 15, age: 1, description: 'Hinged entry piece to control access.' },
    { id: 'staircase', name: 'Wooden Staircase', basePrice: 90, category: 'final', weight: 12, age: 1, description: 'Wooden stairs for moving between levels.' },
    { id: 'roof_tile_section', name: 'Roof Tile Section', basePrice: 10, category: 'final', weight: 8, age: 1, description: 'Finished roof panel that sheds water.' },
    { id: 'well', name: 'Stone Well', basePrice: 120, category: 'final', weight: 25, age: 1, description: 'Hand-drawn water source for settlements.' },
    { id: 'workbench', name: 'Workbench', basePrice: 60, category: 'final', weight: 15, age: 1, description: 'Sturdy bench for assembling and repairing items.' },
    { id: 'forge', name: 'Stone Forge', basePrice: 100, category: 'final', weight: 35, age: 1, description: 'Stone hearth for heating metal to working temperature.' },
    { id: 'crate', name: 'Wooden Crate', basePrice: 25, category: 'final', weight: 6, age: 1, description: 'Stackable box for shipping and storage.' },
    { id: 'bridge_section', name: 'Wooden Bridge Section', basePrice: 150, category: 'final', weight: 20, age: 1, description: 'Prefab span piece for crossing gaps.' },
    { id: 'plow', name: 'Iron Plow', basePrice: 45, category: 'final', weight: 12, age: 1, description: 'Field tool that turns soil for farming.' },
    { id: 'stone_pillar', name: 'Stone Pillar', basePrice: 30, category: 'final', weight: 15, age: 1, description: 'Structural column for heavy stone builds.' },
    { id: 'tool_rack', name: 'Tool Rack', basePrice: 20, category: 'final', weight: 5, age: 1, description: 'Wall rack that keeps tools organized.' },
    { id: 'shield_rack', name: 'Weapon Rack', basePrice: 25, category: 'final', weight: 6, age: 1, description: 'Display stand for storing weapons and shields.' },
    { id: 'iron_grate', name: 'Iron Grate', basePrice: 40, category: 'final', weight: 8, age: 1, description: 'Slotted iron panel for vents or protective grilles.' },
    { id: 'coat_hanger', name: 'Coat Hanger', basePrice: 10, category: 'final', weight: 2, age: 1, description: 'Simple stand for hanging garments and gear.' },
    { id: 'shingled_roof', name: 'Shingled Roof Section', basePrice: 30, category: 'final', weight: 12, age: 1, description: 'Prebuilt shingle section for quick roofing.' },
    { id: 'wagon', name: 'Wooden Wagon', basePrice: 450, category: 'final', weight: 35, age: 1, description: 'Four-wheeled hauler for heavier loads.' },
    { id: 'water_wheel', name: 'Water Wheel', basePrice: 280, category: 'final', weight: 30, age: 1, description: 'Turning wheel that converts water flow to power.' },
    { id: 'anchor', name: 'Iron Anchor', basePrice: 60, category: 'final', weight: 25, age: 1, description: 'Heavy iron hook that keeps boats from drifting.' },

    // ========================
    // AGE 2: REFINEMENT (Copper, Clay, Glass)
    // ========================
    // Parts
    { id: 'glass', name: 'Glass', basePrice: 8, category: 'intermediate', weight: 2, age: 2, description: 'Clear solid formed from sand for windows and lenses.' },
    { id: 'copper_ingot', name: 'Copper Ingot', basePrice: 8, category: 'intermediate', weight: 3, age: 2, description: 'Refined copper for wiring, cookware, and tubing.' },
    { id: 'copper_sheet', name: 'Copper Sheet', basePrice: 12, category: 'intermediate', weight: 3, age: 2, description: 'Thin copper plate for roofs and craftwork.' },
    { id: 'pipe', name: 'Copper Pipe', basePrice: 15, category: 'intermediate', weight: 3, age: 2, description: 'Standard metal pipe for moving fluids or gases.' },
    { id: 'ceramic_tile', name: 'Ceramic Tile', basePrice: 6, category: 'intermediate', weight: 2, age: 2, description: 'Glazed ceramic squares for floors and walls.' },
    { id: 'glass_pane', name: 'Glass Pane', basePrice: 5, category: 'intermediate', weight: 1, age: 2, description: 'Flat sheet for windows and protective covers.' },
    { id: 'copper_tubing', name: 'Copper Tubing', basePrice: 10, category: 'intermediate', weight: 2, age: 2, description: 'Hollow copper line for pipes and heat transfer.' },
    { id: 'brass_ingot', name: 'Brass Ingot', basePrice: 12, category: 'intermediate', weight: 3, age: 2, description: 'Copper-zinc alloy bar for instruments and fittings.' },
    { id: 'brass_sheet', name: 'Brass Sheet', basePrice: 14, category: 'intermediate', weight: 3, age: 2, description: 'Flat brass stock for decor and fine parts.' },
    { id: 'decorative_glass', name: 'Decorative Glass', basePrice: 15, category: 'intermediate', weight: 2, age: 2, description: 'Colored or textured glass for display pieces.' },
    { id: 'terracotta', name: 'Terracotta', basePrice: 7, category: 'intermediate', weight: 3, age: 2, description: 'Baked clay material for tiles and pots.' },
    { id: 'porcelain', name: 'Porcelain', basePrice: 12, category: 'intermediate', weight: 2, age: 2, description: 'Fine, hard ceramic for elegant tableware.' },
    { id: 'glass_lens', name: 'Glass Lens', basePrice: 10, category: 'intermediate', weight: 1, age: 2, description: 'Shaped lens that focuses light and magnifies detail.' },
    { id: 'copper_rod', name: 'Copper Rod', basePrice: 8, category: 'intermediate', weight: 2, age: 2, description: 'Straight copper stock for pins, coils, and fittings.' },
    { id: 'bronze_ingot', name: 'Bronze Ingot', basePrice: 11, category: 'intermediate', weight: 3, age: 2, description: 'Tough alloy bar suited to tools and armor.' },

    // Final Goods (Decor, Plumbing, Optics base)
    { id: 'vase', name: 'Ceramic Vase', basePrice: 35, category: 'final', weight: 5, age: 2, description: 'Ceramic vessel for flowers or storage.' },
    { id: 'pot', name: 'Cooking Pot', basePrice: 90, category: 'final', weight: 4, age: 2, description: 'Sturdy cooking pot for stews and boiling.' },
    { id: 'mirror', name: 'Wall Mirror', basePrice: 70, category: 'final', weight: 6, age: 2, description: 'Polished glass that reflects images clearly.' },
    { id: 'window', name: 'Glass Window', basePrice: 45, category: 'final', weight: 8, age: 2, description: 'Framed glass opening that lets in light.' },
    { id: 'lantern', name: 'Oil Lantern', basePrice: 85, category: 'final', weight: 5, age: 2, description: 'Portable light with protected flame.' },
    { id: 'kettle', name: 'Copper Kettle', basePrice: 125, category: 'final', weight: 3, age: 2, description: 'Lidded pot for boiling water or brewing.' },
    { id: 'fountain', name: 'Ceramic Fountain', basePrice: 100, category: 'final', weight: 20, age: 2, description: 'Water feature that circulates for decoration.' },
    { id: 'aqueduct_section', name: 'Aqueduct Section', basePrice: 240, category: 'final', weight: 50, age: 2, description: 'Channel segment that carries water over distance.' },
    { id: 'spyglass', name: 'Spyglass', basePrice: 160, category: 'final', weight: 2, age: 2, description: 'Collapsible telescope for distant viewing.' },
    { id: 'chandelier', name: 'Glass Chandelier', basePrice: 190, category: 'final', weight: 8, age: 2, description: 'Hanging light fixture that brightens large rooms.' },
    { id: 'stained_glass', name: 'Stained Glass Panel', basePrice: 200, category: 'final', weight: 6, age: 2, description: 'Colored window panel that casts patterned light.' },
    { id: 'telescope', name: 'Telescope', basePrice: 50, category: 'final', weight: 5, age: 2, description: 'Long-range instrument for sky or sea observation.' },
    { id: 'compass', name: 'Brass Compass', basePrice: 130, category: 'final', weight: 1, age: 2, description: 'Magnetic guide for navigation and mapping.' },
    { id: 'plate_set', name: 'Porcelain Plate Set', basePrice: 125, category: 'final', weight: 4, age: 2, description: 'Matched porcelain plates for dining.' },
    { id: 'tile_floor', name: 'Tile Floor Section', basePrice: 45, category: 'final', weight: 10, age: 2, description: 'Finished floor section made from laid tiles.' },
    { id: 'bathtub', name: 'Copper Bathtub', basePrice: 380, category: 'final', weight: 25, age: 2, description: 'Deep basin for washing and heated baths.' },
    { id: 'sink', name: 'Copper Sink', basePrice: 160, category: 'final', weight: 8, age: 2, description: 'Basin fixture for washing and water use.' },
    { id: 'decorative_urn', name: 'Decorative Urn', basePrice: 40, category: 'final', weight: 6, age: 2, description: 'Ornamental vessel for display or storage.' },
    { id: 'chimney', name: 'Brick Chimney', basePrice: 85, category: 'final', weight: 15, age: 2, description: 'Flue structure that vents smoke safely.' },
    { id: 'greenhouse_panel', name: 'Greenhouse Panel', basePrice: 38, category: 'final', weight: 5, age: 2, description: 'Glass panel that traps heat for plants.' },
    { id: 'church_bell', name: 'Church Bell', basePrice: 240, category: 'final', weight: 20, age: 2, description: 'Large bell used for signals and gatherings.' },
    { id: 'candelabra', name: 'Brass Candelabra', basePrice: 320, category: 'final', weight: 3, age: 2, description: 'Multi-arm candle holder for lighting halls.' },
    { id: 'pottery_wheel', name: 'Pottery Wheel', basePrice: 130, category: 'final', weight: 12, age: 2, description: 'Rotating wheel used by potters to shape clay.' },
    { id: 'barometer', name: 'Barometer', basePrice: 45, category: 'final', weight: 3, age: 2, description: 'Instrument that reads air pressure for weather tracking.' },
    { id: 'hourglass', name: 'Hourglass', basePrice: 35, category: 'final', weight: 2, age: 2, description: 'Simple timer that measures time with sand.' },
    { id: 'ceramic_bowl', name: 'Ceramic Bowl', basePrice: 28, category: 'final', weight: 2, age: 2, description: 'Hand-formed bowl for cooking or serving.' },
    { id: 'copper_statue', name: 'Copper Statue', basePrice: 240, category: 'final', weight: 15, age: 2, description: 'Decorative statue cast in copper.' },
    { id: 'magnifying_glass', name: 'Magnifying Glass', basePrice: 120, category: 'final', weight: 1, age: 2, description: 'Hand lens for inspecting fine details.' },
    { id: 'sundial', name: 'Stone Sundial', basePrice: 160, category: 'final', weight: 8, age: 2, description: 'Stone timepiece that uses the sun\'s shadow.' },
    { id: 'bronze_armor', name: 'Bronze Armor', basePrice: 380, category: 'final', weight: 20, age: 2, description: 'Sturdy metal armor offering improved protection.' },

    // ========================
    // AGE 3: INDUSTRIAL (Steel, Steam)
    // ========================
    // Parts (Steel is Iron + Coal refined)
    { id: 'gear', name: 'Iron Gear', basePrice: 12, category: 'intermediate', weight: 2, age: 3, description: 'Toothed wheel that changes speed and torque.' },
    { id: 'bricks', name: 'Fired Bricks', basePrice: 6, category: 'intermediate', weight: 2, age: 3, description: 'Kiln-fired blocks for strong industrial masonry.' },
    { id: 'steel_ingot', name: 'Steel Ingot', basePrice: 20, category: 'intermediate', weight: 4, age: 3, description: 'Refined steel bar ready for shaping and machining.' },
    { id: 'steel_beam', name: 'Steel Beam', basePrice: 30, category: 'intermediate', weight: 6, age: 3, description: 'Structural beam for bridges and tall frames.' },
    { id: 'steel_plate', name: 'Steel Plate', basePrice: 28, category: 'intermediate', weight: 5, age: 3, description: 'Flat steel sheet for armor and machinery skins.' },
    { id: 'piston', name: 'Steel Piston', basePrice: 40, category: 'intermediate', weight: 5, age: 3, description: 'Sliding component that converts pressure into motion.' },
    { id: 'boiler', name: 'Pressure Boiler', basePrice: 60, category: 'intermediate', weight: 15, age: 3, description: 'Sealed vessel that builds steam pressure for engines.' },
    { id: 'steel_gear', name: 'Steel Gear', basePrice: 18, category: 'intermediate', weight: 2, age: 3, description: 'Hardened gear for heavy-duty transmissions.' },
    { id: 'steel_cable', name: 'Steel Cable', basePrice: 25, category: 'intermediate', weight: 4, age: 3, description: 'Braided steel line for lifting and tension.' },
    { id: 'steam_valve', name: 'Steam Valve', basePrice: 35, category: 'intermediate', weight: 3, age: 3, description: 'Control valve that regulates steam flow.' },
    { id: 'drive_shaft', name: 'Drive Shaft', basePrice: 38, category: 'intermediate', weight: 7, age: 3, description: 'Power rod that transfers rotation between machines.' },
    { id: 'flywheel', name: 'Flywheel', basePrice: 45, category: 'intermediate', weight: 10, age: 3, description: 'Heavy wheel that smooths power delivery and momentum.' },
    { id: 'steel_rivet', name: 'Steel Rivet', basePrice: 8, category: 'intermediate', weight: 1, age: 3, description: 'Permanent fastener for joining metal plates.' },
    { id: 'steel_spring', name: 'Steel Spring', basePrice: 15, category: 'intermediate', weight: 1, age: 3, description: 'Elastic coil that stores and releases energy.' },
    { id: 'ball_bearing', name: 'Ball Bearing', basePrice: 20, category: 'intermediate', weight: 1, age: 3, description: 'Precision balls reduce friction in rotating shafts and wheels.' },
    { id: 'steel_chain', name: 'Steel Chain', basePrice: 22, category: 'intermediate', weight: 3, age: 3, description: 'Hardened links for hoists and industrial pulls.' },
    { id: 'pressure_gauge', name: 'Pressure Gauge', basePrice: 30, category: 'intermediate', weight: 2, age: 3, description: 'Dial that reads pressure in boilers and pipes.' },
    { id: 'steel_pipe', name: 'Steel Pipe', basePrice: 20, category: 'intermediate', weight: 4, age: 3, description: 'Durable conduit for steam, water, or gases.' },
    { id: 'coupling', name: 'Pipe Coupling', basePrice: 16, category: 'intermediate', weight: 2, age: 3, description: 'Fitting that joins pipe sections without leaks.' },
    { id: 'camshaft', name: 'Camshaft', basePrice: 42, category: 'intermediate', weight: 6, age: 3, description: 'Lobed shaft that times valves and motion in engines.' },
    { id: 'crankshaft', name: 'Crankshaft', basePrice: 48, category: 'intermediate', weight: 7, age: 3, description: 'Offset shaft that turns piston motion into rotation.' },
    { id: 'steel_rod', name: 'Steel Rod', basePrice: 18, category: 'intermediate', weight: 3, age: 3, description: 'Cylindrical stock for shafts and braces.' },

    // Final Goods (Heavy Machines, Appliances)
    { id: 'vault_door', name: 'Vault Door', basePrice: 3000, category: 'final', weight: 50, age: 3, description: 'Massive door for securing banks and strongrooms.' },
    { id: 'stove', name: 'Wood Stove', basePrice: 600, category: 'final', weight: 40, age: 3, description: 'Solid heater and cooker fueled by wood.' },
    { id: 'bicycle', name: 'Bicycle', basePrice: 850, category: 'final', weight: 15, age: 3, description: 'Two-wheeled vehicle for efficient human travel.' },
    { id: 'clock', name: 'Grandfather Clock', basePrice: 800, category: 'final', weight: 25, age: 3, description: 'Tall timekeeper with a pendulum for reliable household timing.' },
    { id: 'printing_press', name: 'Printing Press', basePrice: 3600, category: 'final', weight: 60, age: 3, description: 'Mechanical press for mass-producing printed pages.' },
    { id: 'sewing_machine', name: 'Sewing Machine', basePrice: 750, category: 'final', weight: 15, age: 3, description: 'Powered machine that stitches cloth rapidly.' },
    { id: 'tool_box', name: 'Mechanic Toolbox', basePrice: 1155, category: 'final', weight: 10, age: 3, description: 'Organized case for carrying repair tools.' }, 
    { id: 'radiator', name: 'Steam Radiator', basePrice: 1800, category: 'final', weight: 20, age: 3, description: 'Heat exchanger that warms rooms with steam.' },
    { id: 'locomotive', name: 'Steam Locomotive', basePrice: 6500, category: 'final', weight: 200, age: 3, description: 'Steam-driven engine for hauling rail cars.' },
    { id: 'industrial_furnace', name: 'Industrial Furnace', basePrice: 2500, category: 'final', weight: 80, age: 3, description: 'High-capacity furnace for smelting and heat treatment.' },
    { id: 'lathe', name: 'Metal Lathe', basePrice: 3700, category: 'final', weight: 50, age: 3, description: 'Spinning machine that turns rods into precise parts.' },
    { id: 'milling_machine', name: 'Milling Machine', basePrice: 2500, category: 'final', weight: 55, age: 3, description: 'Cutting machine that removes metal with precision.' },
    { id: 'safe', name: 'Steel Safe', basePrice: 5750, category: 'final', weight: 45, age: 3, description: 'Thick steel box built to resist theft and fire.' },
    { id: 'crane', name: 'Industrial Crane', basePrice: 4600, category: 'final', weight: 100, age: 3, description: 'Tower machine for lifting heavy loads at a distance.' },
    { id: 'elevator', name: 'Elevator System', basePrice: 3300, category: 'final', weight: 90, age: 3, description: 'Lift system for moving people or cargo between levels.' },
    { id: 'mechanical_loom', name: 'Mechanical Loom', basePrice: 2300, category: 'final', weight: 40, age: 3, description: 'Automated loom that weaves fabric quickly.' },
    { id: 'pocket_watch', name: 'Pocket Watch', basePrice: 1800, category: 'final', weight: 1, age: 3, description: 'Portable timepiece with spring movement and cover.' },
    { id: 'manhole_cover', name: 'Manhole Cover', basePrice: 850, category: 'final', weight: 20, age: 3, description: 'Heavy lid that protects underground access points.' },
    { id: 'steel_bridge', name: 'Steel Bridge Section', basePrice: 3800, category: 'final', weight: 120, age: 3, description: 'Reinforced span that carries heavy traffic.' },
    { id: 'water_tower', name: 'Water Tower', basePrice: 7250, category: 'final', weight: 100, age: 3, description: 'Elevated tank that maintains water pressure.' },
    { id: 'industrial_press', name: 'Hydraulic Press', basePrice: 2300, category: 'final', weight: 70, age: 3, description: 'Press that shapes metal using immense force.' },
    { id: 'steam_hammer', name: 'Steam Hammer', basePrice: 4300, category: 'final', weight: 85, age: 3, description: 'Forging hammer driven by steam for heavy work.' },
    { id: 'rail_track', name: 'Rail Track Section', basePrice: 80, category: 'final', weight: 40, age: 3, description: 'Steel rail segment for building train lines.' },
    { id: 'padlock', name: 'Steel Padlock', basePrice: 200, category: 'final', weight: 2, age: 3, description: 'Lockable shackle for securing doors and crates.' },
    { id: 'wrench', name: 'Steel Wrench', basePrice: 175, category: 'final', weight: 2, age: 3, description: 'Adjustable tool for tightening bolts and fittings.' },
    { id: 'pipe_organ', name: 'Pipe Organ', basePrice: 2300, category: 'final', weight: 150, age: 3, description: 'Air-powered instrument with banks of tuned pipes.' },
    { id: 'industrial_boiler', name: 'Industrial Boiler', basePrice: 7250, category: 'final', weight: 95, age: 3, description: 'Large steam boiler for factories and heat networks.' },
    { id: 'conveyor_belt', name: 'Conveyor Belt', basePrice: 3200, category: 'final', weight: 50, age: 3, description: 'Moving belt that carries parts between workstations.' },
    { id: 'pressure_cooker', name: 'Pressure Cooker', basePrice: 1500, category: 'final', weight: 15, age: 3, description: 'Sealed pot that cooks faster under pressure.' },
    { id: 'plumbing_system', name: 'Plumbing System', basePrice: 2400, category: 'final', weight: 35, age: 3, description: 'Network of pipes and valves for building water supply.' },
    { id: 'rotary_engine', name: 'Rotary Engine', basePrice: 3000, category: 'final', weight: 110, age: 3, description: 'Rotating steam engine built for compact power.' },

    // ========================
    // AGE 4: COMBUSTION (Oil, Plastic, Rubber, Concrete)
    // ========================
    // Parts
    { id: 'copper_wire', name: 'Copper Wire', basePrice: 10, category: 'intermediate', weight: 1, age: 4, description: 'Conductive wire for circuits and small motors.' },
    { id: 'concrete', name: 'Concrete', basePrice: 15, category: 'intermediate', weight: 10, age: 4, description: 'Cement blend that cures into tough building material.' },
    { id: 'plastic', name: 'Plastic', basePrice: 15, category: 'intermediate', weight: 1, age: 4, description: 'Moldable polymer used for countless parts.' },
    { id: 'rubber', name: 'Rubber', basePrice: 18, category: 'intermediate', weight: 2, age: 4, description: 'Elastic material used for seals and tires.' },
    { id: 'leather', name: 'Leather', basePrice: 20, category: 'intermediate', weight: 2, age: 4, description: 'Tanned hide used for clothing and straps.' },
    { id: 'vacuum_tube', name: 'Vacuum Tube', basePrice: 25, category: 'intermediate', weight: 0.5, age: 4, description: 'Electronic tube for amplification and switching.' },
    { id: 'engine_block', name: 'Combustion Engine', basePrice: 100, category: 'intermediate', weight: 25, age: 4, description: 'Core casting that holds cylinders and crankshaft.' },
    { id: 'tire', name: 'Rubber Tire', basePrice: 30, category: 'intermediate', weight: 5, age: 4, description: 'Rubber tire carcass ready for wheels.' },
    { id: 'gasoline', name: 'Gasoline', basePrice: 12, category: 'intermediate', weight: 1, age: 4, description: 'Refined fuel for spark-ignition engines.' },
    { id: 'diesel_fuel', name: 'Diesel Fuel', basePrice: 11, category: 'intermediate', weight: 1, age: 4, description: 'Heavy fuel distilled for diesel engines.' },
    { id: 'lubricant', name: 'Lubricant Oil', basePrice: 10, category: 'intermediate', weight: 1, age: 4, description: 'Viscous oil that reduces wear in machines.' },
    { id: 'carburetor', name: 'Carburetor', basePrice: 35, category: 'intermediate', weight: 3, age: 4, description: 'Fuel mixer that feeds gasoline into engines.' },
    { id: 'spark_plug', name: 'Spark Plug', basePrice: 12, category: 'intermediate', weight: 1, age: 4, description: 'Ignition part that sparks fuel in engines.' },
    { id: 'battery', name: 'Lead-Acid Battery', basePrice: 40, category: 'intermediate', weight: 8, age: 4, description: 'Rechargeable lead cell that stores electrical energy.' },
    { id: 'light_bulb', name: 'Light Bulb', basePrice: 8, category: 'intermediate', weight: 0.5, age: 4, description: 'Glass bulb that emits light when powered.' },
    { id: 'glass_bottle', name: 'Glass Bottle', basePrice: 6, category: 'intermediate', weight: 1, age: 4, description: 'Molded container for storing liquids.' },
    { id: 'plastic_sheet', name: 'Plastic Sheet', basePrice: 12, category: 'intermediate', weight: 2, age: 4, description: 'Flat plastic stock for covers and panels.' },
    { id: 'fiberglass', name: 'Fiberglass', basePrice: 20, category: 'intermediate', weight: 3, age: 4, description: 'Glass-fiber composite for light, strong parts.' },
    { id: 'vinyl', name: 'Vinyl', basePrice: 14, category: 'intermediate', weight: 2, age: 4, description: 'Plastic record material for audio grooves.' },
    { id: 'synthetic_fabric', name: 'Synthetic Fabric', basePrice: 16, category: 'intermediate', weight: 1, age: 4, description: 'Man-made cloth for durable garments.' },
    { id: 'asphalt', name: 'Asphalt', basePrice: 10, category: 'intermediate', weight: 8, age: 4, description: 'Hot bitumen mix used to pave durable roads.' },

    // Final Goods (Vehicles, Consumer Goods)
    { id: 'car_tire', name: 'Car Wheel', basePrice: 1800, category: 'final', weight: 10, age: 4, description: 'Complete wheel with rim and tire for cars.' },
    { id: 'lawn_mower', name: 'Lawn Mower', basePrice: 10000, category: 'final', weight: 25, age: 4, description: 'Powered mower for trimming grass efficiently.' },
    { id: 'chainsaw', name: 'Chainsaw', basePrice: 5000, category: 'final', weight: 10, age: 4, description: 'Motorized saw for cutting timber quickly.' },
    { id: 'generator', name: 'Portable Generator', basePrice: 6250, category: 'final', weight: 40, age: 4, description: 'Portable unit that produces power off-grid.' },
    { id: 'scooter', name: 'Motor Scooter', basePrice: 9000, category: 'final', weight: 50, age: 4, description: 'Compact motor scooter for city travel.' },
    { id: 'radio_transmitter', name: 'Radio Transmitter', basePrice: 100, category: 'final', weight: 2, age: 4, description: 'Device that broadcasts radio signals over distance.' },
    { id: 'typewriter', name: 'Typewriter', basePrice: 3400, category: 'final', weight: 8, age: 4, description: 'Mechanical keyboard for typing documents.' },
    { id: 'camera', name: 'Film Camera', basePrice: 325, category: 'final', weight: 2, age: 4, description: 'Mechanical camera that captures images on film.' },
    { id: 'motorcycle', name: 'Motorcycle', basePrice: 10500, category: 'final', weight: 80, age: 4, description: 'Two-wheeled motor vehicle for fast travel.' },
    { id: 'car_engine', name: 'Automobile Engine', basePrice: 5500, category: 'final', weight: 120, age: 4, description: 'Combustion engine built to drive automobiles.' },
    { id: 'industrial_pump', name: 'Industrial Pump', basePrice: 6250, category: 'final', weight: 45, age: 4, description: 'Motor-driven pump for moving fluids at scale.' },
    { id: 'power_saw', name: 'Power Saw', basePrice: 4600, category: 'final', weight: 12, age: 4, description: 'Powered saw for fast cutting of boards and metal.' },
    { id: 'jackhammer', name: 'Pneumatic Jackhammer', basePrice: 4700, category: 'final', weight: 28, age: 4, description: 'Pneumatic hammer for breaking concrete and stone.' },
    { id: 'concrete_mixer', name: 'Concrete Mixer', basePrice: 13500, category: 'final', weight: 75, age: 4, description: 'Rotating drum that blends cement, sand, and water.' },
    { id: 'traffic_light', name: 'Traffic Signal', basePrice: 475, category: 'final', weight: 15, age: 4, description: 'Signal system that controls street traffic.' },
    { id: 'street_lamp', name: 'Street Lamp', basePrice: 850, category: 'final', weight: 12, age: 4, description: 'Outdoor light for roads and factory yards.' },
    { id: 'telephone', name: 'Telephone', basePrice: 175, category: 'final', weight: 3, age: 4, description: 'Wired device for voice communication.' },
    { id: 'vinyl_record', name: 'Vinyl Record', basePrice: 10, category: 'final', weight: 1, age: 4, description: 'Pressed disc that plays recorded music.' },
    { id: 'plastic_container', name: 'Plastic Container', basePrice: 10, category: 'final', weight: 1, age: 4, description: 'Rigid vessel for storage and transport.' },
    { id: 'garden_hose', name: 'Garden Hose', basePrice: 225, category: 'final', weight: 3, age: 4, description: 'Flexible hose for moving water around sites.' },
    { id: 'fuel_tank', name: 'Fuel Storage Tank', basePrice: 4100, category: 'final', weight: 30, age: 4, description: 'Sealed container for storing liquid fuel.' },
    { id: 'oil_drum', name: 'Oil Drum', basePrice: 1700, category: 'final', weight: 15, age: 4, description: 'Large barrel for storing and transporting oil.' },
    { id: 'flashlight', name: 'Flashlight', basePrice: 1000, category: 'final', weight: 1, age: 4, description: 'Handheld light for dark work areas.' },
    { id: 'automobile', name: 'Automobile', basePrice: 19000, category: 'final', weight: 250, age: 4, description: 'Gas-powered car for personal transport.' },
    { id: 'road_segment', name: 'Paved Road Section', basePrice: 325, category: 'final', weight: 100, age: 4, description: 'Paved section for connecting transport routes.' },
    { id: 'leather_jacket', name: 'Leather Jacket', basePrice: 125, category: 'final', weight: 3, age: 4, description: 'Tough outerwear made for wind and abrasion.' },
    { id: 'amplifier', name: 'Tube Amplifier', basePrice: 1200, category: 'final', weight: 8, age: 4, description: 'Audio device that boosts weak signals for speakers.' },
    { id: 'diesel_truck', name: 'Diesel Truck', basePrice: 24500, category: 'final', weight: 350, age: 4, description: 'Heavy truck built for hauling freight.' },
    { id: 'chemistry_set', name: 'Chemistry Set', basePrice: 100, category: 'final', weight: 4, age: 4, description: 'Portable kit for mixing and testing compounds.' },
    { id: 'raincoat', name: 'Raincoat', basePrice: 150, category: 'final', weight: 2, age: 4, description: 'Waterproof coat for harsh weather.' },
    { id: 'kayak', name: 'Fiberglass Kayak', basePrice: 200, category: 'final', weight: 15, age: 4, description: 'Lightweight boat for single-person travel.' },

    // ========================
    // AGE 5: ELECTRIC (Aluminum, Electronics v1)
    // ========================
    // Parts
    { id: 'aluminum_ingot', name: 'Aluminum Ingot', basePrice: 25, category: 'intermediate', weight: 2, age: 5, description: 'Lightweight metal bar for machining and casting.' },
    { id: 'aluminum_sheet', name: 'Aluminum Sheet', basePrice: 30, category: 'intermediate', weight: 2, age: 5, description: 'Thin aluminum plate for panels and casings.' },
    { id: 'electric_motor', name: 'Electric Motor', basePrice: 60, category: 'intermediate', weight: 5, age: 5, description: 'Rotating motor that turns electrical power into motion.' },
    { id: 'insulated_wire', name: 'Insulated Cable', basePrice: 15, category: 'intermediate', weight: 1, age: 5, description: 'Coated cable that prevents shorts and shocks.' },
    { id: 'heating_element', name: 'Heating Element', basePrice: 25, category: 'intermediate', weight: 1, age: 5, description: 'Resistive coil that produces heat when powered.' },
    { id: 'housing', name: 'Metal Housing', basePrice: 18, category: 'intermediate', weight: 3, age: 5, description: 'Protective metal shell for electronics or motors.' },
    { id: 'steel_wire', name: 'Steel Wire', basePrice: 8, category: 'intermediate', weight: 1, age: 5, description: 'High-strength wire for cables and springs.' },
    { id: 'insulation', name: 'Thermal Insulation', basePrice: 12, category: 'intermediate', weight: 2, age: 5, description: 'Thermal layer that slows heat transfer.' },
    { id: 'electric_switch', name: 'Electric Switch', basePrice: 10, category: 'intermediate', weight: 0.5, age: 5, description: 'On-off control for electrical circuits.' },
    { id: 'transformer', name: 'Transformer', basePrice: 45, category: 'intermediate', weight: 8, age: 5, description: 'Device that steps voltage up or down.' },
    { id: 'capacitor', name: 'Capacitor', basePrice: 12, category: 'intermediate', weight: 0.5, age: 5, description: 'Component that stores and releases electric charge.' },
    { id: 'resistor', name: 'Resistor', basePrice: 8, category: 'intermediate', weight: 0.2, age: 5, description: 'Component that limits current in circuits.' },
    { id: 'bulb_socket', name: 'Light Socket', basePrice: 6, category: 'intermediate', weight: 0.5, age: 5, description: 'Electrical base that holds and powers a bulb.' },
    { id: 'relay', name: 'Electric Relay', basePrice: 18, category: 'intermediate', weight: 1, age: 5, description: 'Electromechanical switch controlled by a coil.' },
    { id: 'thermostat', name: 'Thermostat', basePrice: 22, category: 'intermediate', weight: 1, age: 5, description: 'Controller that maintains a target temperature.' },
    { id: 'compressor', name: 'Compressor Unit', basePrice: 70, category: 'intermediate', weight: 12, age: 5, description: 'Machine that pressurizes air for tools and systems.' },
    { id: 'aluminum_rod', name: 'Aluminum Rod', basePrice: 20, category: 'intermediate', weight: 2, age: 5, description: 'Light aluminum rod for frames and fittings.' },
    { id: 'electric_coil', name: 'Electric Coil', basePrice: 16, category: 'intermediate', weight: 2, age: 5, description: 'Wound conductor that creates magnetic fields.' },

    // Final Goods (Appliances)
    { id: 'fan', name: 'Electric Fan', basePrice: 1900, category: 'final', weight: 5, age: 5, description: 'Portable electric fan for airflow.' },
    { id: 'toaster', name: 'Toaster', basePrice: 1400, category: 'final', weight: 3, age: 5, description: 'Small appliance for browning bread.' },
    { id: 'vacuum', name: 'Vacuum Cleaner', basePrice: 1700, category: 'final', weight: 10, age: 5, description: 'Cleaner that uses suction to remove dust.' },
    { id: 'fridge', name: 'Refrigerator', basePrice: 6500, category: 'final', weight: 80, age: 5, description: 'Refrigerated cabinet that keeps food cold.' },
    { id: 'washer', name: 'Washing Machine', basePrice: 7250, category: 'final', weight: 70, age: 5, description: 'Washing machine for cleaning clothes.' },
    { id: 'radio', name: 'AM/FM Radio', basePrice: 550, category: 'final', weight: 4, age: 5, description: 'Household receiver for broadcast stations.' },
    { id: 'drill', name: 'Power Drill', basePrice: 1700, category: 'final', weight: 4, age: 5, description: 'Powered drill for making holes and driving bits.' },
    { id: 'mixer', name: 'Industrial Mixer', basePrice: 1500, category: 'final', weight: 3, age: 5, description: 'Industrial mixer for blending large batches.' },
    { id: 'dishwasher', name: 'Dishwasher', basePrice: 7500, category: 'final', weight: 65, age: 5, description: 'Appliance that cleans dishes automatically.' },
    { id: 'air_conditioner', name: 'Air Conditioner', basePrice: 5500, category: 'final', weight: 75, age: 5, description: 'Unit that cools and dehumidifies indoor air.' },
    { id: 'electric_oven', name: 'Electric Oven', basePrice: 10000, category: 'final', weight: 50, age: 5, description: 'Electric range for controlled baking and roasting.' },
    { id: 'hair_dryer', name: 'Hair Dryer', basePrice: 2200, category: 'final', weight: 1, age: 5, description: 'Handheld blower for drying hair quickly.' },
    { id: 'electric_heater', name: 'Electric Heater', basePrice: 4300, category: 'final', weight: 8, age: 5, description: 'Resistive heater for warming spaces.' },
    { id: 'electric_kettle', name: 'Electric Kettle', basePrice: 750, category: 'final', weight: 2, age: 5, description: 'Plug-in kettle for boiling water quickly.' },
    { id: 'blender', name: 'Blender', basePrice: 1400, category: 'final', weight: 2, age: 5, description: 'Countertop tool for mixing and pureeing food.' },
    { id: 'food_processor', name: 'Food Processor', basePrice: 3200, category: 'final', weight: 4, age: 5, description: 'Appliance that chops and slices ingredients.' },
    { id: 'electric_saw', name: 'Electric Saw', basePrice: 2400, category: 'final', weight: 6, age: 5, description: 'Corded saw for faster cutting tasks.' },
    { id: 'arc_welder', name: 'Arc Welder', basePrice: 4100, category: 'final', weight: 25, age: 5, description: 'Electric welder that fuses metal with an arc.' },
    { id: 'electric_guitar', name: 'Electric Guitar', basePrice: 650, category: 'final', weight: 4, age: 5, description: 'Amplified string instrument for modern music.' },
    { id: 'jukebox', name: 'Jukebox', basePrice: 1400, category: 'final', weight: 50, age: 5, description: 'Coin-operated music player for public spaces.' },
    { id: 'ceiling_fan', name: 'Ceiling Fan', basePrice: 2000, category: 'final', weight: 6, age: 5, description: 'Overhead fan that circulates air in rooms.' },
    { id: 'water_heater', name: 'Water Heater', basePrice: 6000, category: 'final', weight: 40, age: 5, description: 'Tank that heats water for buildings.' },
    { id: 'sander', name: 'Electric Sander', basePrice: 1300, category: 'final', weight: 3, age: 5, description: 'Power tool for smoothing wood and metal.' },
    { id: 'elevator_motor', name: 'Elevator Motor', basePrice: 12000, category: 'final', weight: 45, age: 5, description: 'Drive motor that lifts elevator cars.' },
    { id: 'motor_housing_unit', name: 'Motor Housing Unit', basePrice: 4200, category: 'final', weight: 12, age: 5, description: 'Enclosure that supports a motor and bearings.' },
    { id: 'insulated_pipe', name: 'Insulated Pipe', basePrice: 1600, category: 'final', weight: 8, age: 5, description: 'Pipe wrapped to retain heat or cold.' },
    { id: 'relay_panel', name: 'Relay Control Panel', basePrice: 5500, category: 'final', weight: 15, age: 5, description: 'Wired panel that routes and protects circuits.' },
    { id: 'wire_spool', name: 'Steel Wire Spool', basePrice: 2000, category: 'final', weight: 6, age: 5, description: 'Coiled supply of steel wire for fabrication.' },
    { id: 'lamp_fixture', name: 'Lamp Fixture', basePrice: 3200, category: 'final', weight: 3, age: 5, description: 'Mounted base for holding bulbs and shades.' },

    // ========================
    // AGE 6: DIGITAL (Silicon, Chips)
    // ========================
    // Parts
    { id: 'silicon', name: 'Refined Silicon', basePrice: 30, category: 'intermediate', weight: 1, age: 6, description: 'Purified silicon for chips and solar cells.' },
    { id: 'circuit_board', name: 'Circuit Board', basePrice: 40, category: 'intermediate', weight: 1, age: 6, description: 'Printed board that connects electronic components.' },
    { id: 'steel_bracket', name: 'Steel Bracket', basePrice: 10, category: 'intermediate', weight: 2, age: 6, description: 'Reinforced bracket for structural mounts.' },
    { id: 'cpu', name: 'Microprocessor', basePrice: 100, category: 'intermediate', weight: 0.5, age: 6, description: 'Central processor that executes program instructions.' },
    { id: 'screen', name: 'LCD Screen', basePrice: 80, category: 'intermediate', weight: 3, age: 6, description: 'Flat LCD panel for embedded displays.' },
    { id: 'ram_module', name: 'RAM Module', basePrice: 50, category: 'intermediate', weight: 0.3, age: 6, description: 'Memory stick for fast temporary data.' },
    { id: 'hard_drive', name: 'Hard Drive', basePrice: 60, category: 'intermediate', weight: 1, age: 6, description: 'Magnetic storage unit for large data.' },
    { id: 'motherboard', name: 'Motherboard', basePrice: 90, category: 'intermediate', weight: 1, age: 6, description: 'Main board that connects CPU, memory, and ports.' },
    { id: 'graphics_card', name: 'Graphics Card', basePrice: 120, category: 'intermediate', weight: 1, age: 6, description: 'Processing board for rendering graphics output.' },
    { id: 'power_supply', name: 'Power Supply Unit', basePrice: 55, category: 'intermediate', weight: 2, age: 6, description: 'Unit that converts AC to stable DC power.' },
    { id: 'keyboard', name: 'Keyboard', basePrice: 35, category: 'intermediate', weight: 1, age: 6, description: 'Input device with keys for typing.' },
    { id: 'mouse', name: 'Computer Mouse', basePrice: 20, category: 'intermediate', weight: 0.3, age: 6, description: 'Pointing device for on-screen control.' },
    { id: 'usb_cable', name: 'USB Cable', basePrice: 8, category: 'intermediate', weight: 0.2, age: 6, description: 'Data and power cable for USB devices.' },
    { id: 'digital_sensor', name: 'Digital Sensor', basePrice: 28, category: 'intermediate', weight: 0.5, age: 6, description: 'Solid-state sensor for measuring light or motion.' },
    { id: 'led', name: 'LED Component', basePrice: 5, category: 'intermediate', weight: 0.1, age: 6, description: 'Efficient light-emitting diode component.' },

    // Final Goods (Tech)
    { id: 'computer', name: 'Desktop Computer', basePrice: 27500, category: 'final', weight: 15, age: 6, description: 'Desktop system for general computing tasks.' },
    { id: 'tv', name: 'Flat Screen TV', basePrice: 3100, category: 'final', weight: 20, age: 6, description: 'Large flat display for video and media.' },
    { id: 'microwave', name: 'Microwave Oven', basePrice: 7750, category: 'final', weight: 15, age: 6, description: 'Appliance that heats food with microwaves.' },
    { id: 'calculator', name: 'Calculator', basePrice: 1900, category: 'final', weight: 1, age: 6, description: 'Handheld device for quick numeric work.' },
    { id: 'console', name: 'Game Console', basePrice: 11000, category: 'final', weight: 5, age: 6, description: 'Home console for playing electronic games.' },
    { id: 'printer', name: 'Laser Printer', basePrice: 6250, category: 'final', weight: 12, age: 6, description: 'Device that produces documents on paper.' },
    { id: 'watch_digital', name: 'Digital Watch', basePrice: 4100, category: 'final', weight: 0.5, age: 6, description: 'Wristwatch that shows time electronically.' },
    { id: 'laptop', name: 'Laptop Computer', basePrice: 10500, category: 'final', weight: 3, age: 6, description: 'Portable computer with built-in screen.' },
    { id: 'server', name: 'Server Rack', basePrice: 68000, category: 'final', weight: 40, age: 6, description: 'Rack unit that hosts network services.' },
    { id: 'monitor', name: 'Computer Monitor', basePrice: 2000, category: 'final', weight: 5, age: 6, description: 'Display screen for computers.' },
    { id: 'scanner', name: 'Document Scanner', basePrice: 4300, category: 'final', weight: 6, age: 6, description: 'Imaging device that digitizes documents.' },
    { id: 'modem', name: 'Cable Modem', basePrice: 450, category: 'final', weight: 1, age: 6, description: 'Device that links networks to service lines.' },
    { id: 'router', name: 'Network Router', basePrice: 1100, category: 'final', weight: 2, age: 6, description: 'Network device that directs data traffic.' },
    { id: 'digital_camera', name: 'Digital Camera', basePrice: 7500, category: 'final', weight: 1, age: 6, description: 'Electronic camera that stores images digitally.' },
    { id: 'mp3_player', name: 'MP3 Player', basePrice: 6500, category: 'final', weight: 0.5, age: 6, description: 'Portable player for digital music files.' },
    { id: 'electronic_lock', name: 'Electronic Door Lock', basePrice: 6500, category: 'final', weight: 2, age: 6, description: 'Keypad-based lock for controlled entry.' },
    { id: 'gps_device', name: 'GPS Navigator', basePrice: 7000, category: 'final', weight: 1, age: 6, description: 'Navigator that uses satellites for positioning.' },
    { id: 'barcode_scanner', name: 'Barcode Scanner', basePrice: 1500, category: 'final', weight: 1, age: 6, description: 'Optical reader that decodes barcodes quickly.' },
    { id: 'atm_machine', name: 'ATM Machine', basePrice: 90000, category: 'final', weight: 80, age: 6, description: 'Self-service terminal for cash withdrawals and banking.' },
    { id: 'pos_terminal', name: 'POS Terminal', basePrice: 2600, category: 'final', weight: 3, age: 6, description: 'Checkout terminal for sales and receipts.' },
    { id: 'led_display', name: 'LED Display Panel', basePrice: 4900, category: 'final', weight: 15, age: 6, description: 'Panel of LEDs for bright visual output.' },
    { id: 'surveillance_camera', name: 'Security Camera', basePrice: 10500, category: 'final', weight: 2, age: 6, description: 'Fixed camera for monitoring security.' },
    { id: 'tablet', name: 'Tablet Computer', basePrice: 11000, category: 'final', weight: 1, age: 6, description: 'Touchscreen computer for portable use.' },
    { id: 'bracket_assembly', name: 'Bracket Assembly', basePrice: 8500, category: 'final', weight: 5, age: 6, description: 'Prebuilt bracket set for mounting equipment.' },
    { id: 'computer_station', name: 'Computer Workstation', basePrice: 34500, category: 'final', weight: 35, age: 6, description: 'Workstation setup for office or control rooms.' },
    { id: 'cable_organizer', name: 'Cable Management System', basePrice: 600, category: 'final', weight: 3, age: 6, description: 'System that routes and tidies cable runs.' },

    // ========================
    // AGE 7: FUTURE (Rare Earths, Advanced)
    // ========================
    // Parts
    { id: 'adv_battery', name: 'Lithium Battery', basePrice: 80, category: 'intermediate', weight: 2, age: 7, description: 'High-density cell for long-lasting portable power.' },
    { id: 'composite', name: 'Carbon Composite', basePrice: 100, category: 'intermediate', weight: 1, age: 7, description: 'Layered carbon composite for light, rigid structures.' },
    { id: 'ai_core', name: 'AI Core', basePrice: 500, category: 'intermediate', weight: 1, age: 7, description: 'Specialized processor for advanced decision systems.' },
    { id: 'liquid_nitrogen', name: 'Liquid Nitrogen', basePrice: 15, category: 'intermediate', weight: 1, age: 7, description: 'Cryogenic fluid used for rapid cooling.' },
    { id: 'helmet', name: 'Protective Helmet', basePrice: 50, category: 'intermediate', weight: 3, age: 7, description: 'Impact-rated headgear for hazardous work.' },
    { id: 'superconductor', name: 'Superconductor', basePrice: 200, category: 'intermediate', weight: 1, age: 7, description: 'Material that carries current with near-zero loss.' },
    { id: 'quantum_processor', name: 'Quantum Processor', basePrice: 600, category: 'intermediate', weight: 0.5, age: 7, description: 'Qubit processor for quantum calculations.' },
    { id: 'graphene_sheet', name: 'Graphene Sheet', basePrice: 150, category: 'intermediate', weight: 0.2, age: 7, description: 'Ultra-thin sheet with high strength and conductivity.' },
    { id: 'nano_material', name: 'Nano-Material', basePrice: 180, category: 'intermediate', weight: 0.5, age: 7, description: 'Engineered material built from nano-scale structures.' },
    { id: 'fusion_core', name: 'Fusion Core', basePrice: 800, category: 'intermediate', weight: 5, age: 7, description: 'Compact core that contains fusion reactions.' },
    { id: 'plasma_containment', name: 'Plasma Containment', basePrice: 350, category: 'intermediate', weight: 3, age: 7, description: 'Field unit that stabilizes hot plasma.' },
    { id: 'neural_interface', name: 'Neural Interface', basePrice: 280, category: 'intermediate', weight: 0.5, age: 7, description: 'Control module that reads and writes neural signals.' },
    { id: 'holographic_projector', name: 'Holographic Projector', basePrice: 320, category: 'intermediate', weight: 2, age: 7, description: 'Emitter that creates 3D hologram visuals.' },
    { id: 'smart_fabric', name: 'Smart Fabric', basePrice: 90, category: 'intermediate', weight: 1, age: 7, description: 'Textile with embedded sensors and conductivity.' },
    { id: 'anti_grav_unit', name: 'Anti-Gravity Unit', basePrice: 450, category: 'intermediate', weight: 4, age: 7, description: 'Module that counters gravity for lift and stabilization.' },

    // Final Goods
    { id: 'smartphone', name: 'Smartphone', basePrice: 13500, category: 'final', weight: 1, age: 7, description: 'Pocket computer for communication and apps.' },
    { id: 'drone', name: 'Quad-Drone', basePrice: 28500, category: 'final', weight: 4, age: 7, description: 'Remote-controlled quadcopter for scouting and delivery.' },
    { id: 'robot', name: 'Service Robot', basePrice: 110000, category: 'final', weight: 50, age: 7, description: 'Autonomous service robot for labor and assistance.' },
    { id: 'vr_headset', name: 'VR Headset', basePrice: 19000, category: 'final', weight: 2, age: 7, description: 'Head-mounted display for immersive virtual reality.' },
    { id: 'electric_car', name: 'Electric Car', basePrice: 33500, category: 'final', weight: 200, age: 7, description: 'Battery-powered car with quiet electric drive.' },
    { id: 'laser', name: 'Lab Laser', basePrice: 36000, category: 'final', weight: 10, age: 7, description: 'Coherent light source for cutting or research.' },
    { id: 'solar_panel_item', name: 'Solar Panel', basePrice: 12500, category: 'final', weight: 10, age: 7, description: 'Single panel that converts sunlight to electricity.' },
    { id: 'flying_car', name: 'Flying Car', basePrice: 81000, category: 'final', weight: 180, age: 7, description: 'Hybrid vehicle capable of road and air travel.' },
    { id: 'hoverboard', name: 'Hoverboard', basePrice: 30500, category: 'final', weight: 8, age: 7, description: 'Personal board that levitates for smooth travel.' },
    { id: 'printer_3d', name: '3D Printer', basePrice: 76000, category: 'final', weight: 35, age: 7, description: 'Machine that builds objects layer by layer.' },
    { id: 'holographic_display', name: 'Holographic Display', basePrice: 305000, category: 'final', weight: 12, age: 7, description: 'Display that projects images in mid-air.' },
    { id: 'ar_glasses', name: 'AR Glasses', basePrice: 80000, category: 'final', weight: 0.5, age: 7, description: 'Wearable display that overlays digital information.' },
    { id: 'exoskeleton', name: 'Powered Exoskeleton', basePrice: 120000, category: 'final', weight: 40, age: 7, description: 'Powered frame that boosts wearer strength.' },
    { id: 'personal_assistant_robot', name: 'Personal Assistant Robot', basePrice: 185000, category: 'final', weight: 25, age: 7, description: 'Helper robot built for domestic tasks.' },
    { id: 'smart_home_hub', name: 'Smart Home Hub', basePrice: 69000, category: 'final', weight: 2, age: 7, description: 'Central controller for connected home devices.' },
    { id: 'autonomous_vehicle', name: 'Autonomous Vehicle', basePrice: 180000, category: 'final', weight: 220, age: 7, description: 'Self-driving vehicle guided by sensors and AI.' },
    { id: 'space_suit', name: 'Space Suit', basePrice: 34500, category: 'final', weight: 15, age: 7, description: 'Pressurized suit for working in space.' },
    { id: 'medical_scanner', name: 'Medical Scanner', basePrice: 140000, category: 'final', weight: 50, age: 7, description: 'Advanced imaging device for diagnostics.' },
    { id: 'quantum_computer', name: 'Quantum Computer', basePrice: 335000, category: 'final', weight: 60, age: 7, description: 'Computer that solves certain problems via qubits.' },
    { id: 'teleporter_pad', name: 'Teleportation Pad', basePrice: 410000, category: 'final', weight: 500, age: 7, description: 'Platform that enables short-range teleportation.' },
    { id: 'energy_shield', name: 'Energy Shield Generator', basePrice: 46000, category: 'final', weight: 30, age: 7, description: 'Generator that projects a protective energy barrier.' },
    { id: 'weather_control', name: 'Weather Control Device', basePrice: 500000, category: 'final', weight: 150, age: 7, description: 'System that manipulates local climate conditions.' },
    { id: 'replicator', name: 'Matter Replicator', basePrice: 830000, category: 'final', weight: 100, age: 7, description: 'Device that assembles matter from base inputs.' },
    { id: 'cryogenic_chamber', name: 'Cryogenic Chamber', basePrice: 17500, category: 'final', weight: 180, age: 7, description: 'Sealed chamber for ultra-low-temperature storage.' },
    { id: 'space_helmet', name: 'Space Helmet', basePrice: 7500, category: 'final', weight: 5, age: 7, description: 'Sealed helmet for vacuum and life support.' },
    { id: 'graphene_armor', name: 'Graphene Armor', basePrice: 55000, category: 'final', weight: 8, age: 7, description: 'Lightweight armor that resists impact and heat.' },
    { id: 'neural_implant', name: 'Neural Implant', basePrice: 140000, category: 'final', weight: 0.5, age: 7, description: 'Implant that interfaces with the nervous system.' },

    // ========================
    // EQUIPMENT (Machines & Generators)
    // ========================
    // Machines - Age 1
    { id: 'carpenters_bench', name: "Carpenter's Bench", basePrice: 60, category: 'equipment', weight: 15, age: 1, description: 'Workshop station for basic woodworking recipes.' },
    { id: 'blacksmiths_anvil', name: "Blacksmith's Anvil", basePrice: 80, category: 'equipment', weight: 40, age: 1, description: 'Heavy anvil for forging metal parts.' },
    { id: 'masons_workshop', name: "Mason's Table", basePrice: 50, category: 'equipment', weight: 25, age: 1, description: 'Stoneworking table for masonry recipes.' },
    { id: 'stone_furnace', name: 'Stone Furnace', basePrice: 50, category: 'equipment', weight: 30, age: 1, description: 'Hot furnace for smelting ores and firing stone.' },
    // Machines - Age 2
    { id: 'glassblowers_workshop', name: "Glassblower's Workshop", basePrice: 120, category: 'equipment', weight: 30, age: 2, description: 'Glassworking station for molten glass recipes.' },
    { id: 'potters_wheel_machine', name: "Potter's Wheel", basePrice: 80, category: 'equipment', weight: 25, age: 2, description: 'Rotating wheel for shaping ceramics.' },
    { id: 'foundry', name: 'Industrial Foundry', basePrice: 300, category: 'equipment', weight: 50, age: 2, description: 'Industrial furnace for casting large metal parts.' },
    // Machines - Age 3
    { id: 'steel_forge', name: 'Steel Forge', basePrice: 500, category: 'equipment', weight: 70, age: 3, description: 'High-temperature forge for advanced steelwork.' },
    { id: 'heavy_assembly', name: 'Heavy Assembly', basePrice: 800, category: 'equipment', weight: 100, age: 3, description: 'Large assembly line for bulky components.' },
    // Machines - Age 4+
    { id: 'precision_assembler', name: 'Precision Assembler', basePrice: 1500, category: 'equipment', weight: 60, age: 4, description: 'Automated station for accurate assembly work.' },
    { id: 'chemical_plant', name: 'Chemical Plant', basePrice: 800, category: 'equipment', weight: 60, age: 4, description: 'Industrial facility for producing refined chemicals.' },
    { id: 'research_laboratory', name: 'Research Laboratory', basePrice: 2000, category: 'equipment', weight: 80, age: 4, description: 'Lab space for experiments and new prototypes.' },
    { id: 'electronics_fab', name: 'Electronics Fab', basePrice: 1500, category: 'equipment', weight: 100, age: 6, description: 'Clean facility for producing chips and boards.' },
    
    // Generators
    { id: 'thermal_generator', name: 'Thermal Generator', basePrice: 50, category: 'equipment', weight: 20, age: 1, description: 'Simple generator that burns wood for power.' },
    { id: 'windmill', name: 'Windmill', basePrice: 150, category: 'equipment', weight: 40, age: 2, description: 'Wind-driven generator that provides steady power.' },
    { id: 'coal_power_plant', name: 'Coal Power Plant', basePrice: 500, category: 'equipment', weight: 80, age: 3, description: 'Large furnace that turns coal into steady grid power.' },
    { id: 'diesel_gen', name: 'Diesel Power Plant', basePrice: 1000, category: 'equipment', weight: 60, age: 4, description: 'Generator that burns diesel for reliable power.' },
    { id: 'nuclear_fission_reactor', name: 'Nuclear Fission Reactor', basePrice: 5000, category: 'equipment', weight: 150, age: 6, description: 'Reactor that splits atoms for massive power output.' },
    { id: 'solar_array', name: 'Solar Array', basePrice: 2000, category: 'equipment', weight: 50, age: 7, description: 'Large panel field that converts sunlight to power.' },
  ],

  // ============================================================================
  // Recipes
  // ============================================================================
  recipes: [
    // --- AGE 1: WOOD/STONE/IRON ---
    // Intermediates
    { id: 'planks', inputs: { wood: 2 }, outputs: { planks: 2 }, ticksToComplete: 1, age: 1 },
    { id: 'wooden_beam', inputs: { planks: 2 }, outputs: { wooden_beam: 1 }, ticksToComplete: 2, age: 1 },
    { id: 'stone_bricks', inputs: { stone: 2 }, outputs: { stone_bricks: 2 }, ticksToComplete: 2, age: 1 },
    { id: 'iron_ingot', inputs: { iron_ore: 2 }, outputs: { iron_ingot: 1 }, ticksToComplete: 2, age: 1 },
    { id: 'iron_plate', inputs: { iron_ingot: 2 }, outputs: { iron_plate: 1 }, ticksToComplete: 2, age: 1 },
    { id: 'iron_rod', inputs: { iron_ingot: 1 }, outputs: { iron_rod: 2 }, ticksToComplete: 1, age: 1 },
    { id: 'nails', inputs: { iron_rod: 1 }, outputs: { nails: 8 }, ticksToComplete: 1, age: 1 },
    { id: 'rope', inputs: { wood: 1 }, outputs: { rope: 3 }, ticksToComplete: 1, age: 1 },
    { id: 'wooden_dowel', inputs: { planks: 1 }, outputs: { wooden_dowel: 4 }, ticksToComplete: 1, age: 1 },
    { id: 'stone_slab', inputs: { stone: 2 }, outputs: { stone_slab: 1 }, ticksToComplete: 2, age: 1 },
    { id: 'iron_wire', inputs: { iron_rod: 1 }, outputs: { iron_wire: 4 }, ticksToComplete: 1, age: 1 },
    { id: 'iron_bracket', inputs: { iron_plate: 1 }, outputs: { iron_bracket: 2 }, ticksToComplete: 2, age: 1 },
    { id: 'hinges', inputs: { iron_plate: 1, iron_rod: 1 }, outputs: { hinges: 2 }, ticksToComplete: 2, age: 1 },
    { id: 'mortar', inputs: { stone: 1, sand: 1 }, outputs: { mortar: 3 }, ticksToComplete: 1, age: 1 },
    { id: 'iron_chain', inputs: { iron_wire: 2 }, outputs: { iron_chain: 1 }, ticksToComplete: 2, age: 1 },
    { id: 'stone_tile', inputs: { stone_bricks: 1 }, outputs: { stone_tile: 4 }, ticksToComplete: 1, age: 1 },
    { id: 'wooden_shingle', inputs: { planks: 1 }, outputs: { wooden_shingle: 6 }, ticksToComplete: 1, age: 1 },
    { id: 'iron_axle', inputs: { iron_rod: 2, iron_ingot: 1 }, outputs: { iron_axle: 1 }, ticksToComplete: 3, age: 1 },
    { id: 'wheel', inputs: { planks: 4, iron_rod: 2 }, outputs: { wheel: 1 }, ticksToComplete: 3, age: 1 },
    { id: 'wooden_handle', inputs: { planks: 1 }, outputs: { wooden_handle: 2 }, ticksToComplete: 1, age: 1 },

    // Final Goods Age 1
    { id: 'chair', inputs: { planks: 4, nails: 2 }, outputs: { chair: 1 }, ticksToComplete: 3, age: 1 },
    { id: 'table', inputs: { planks: 6, wooden_beam: 2, nails: 4 }, outputs: { table: 1 }, ticksToComplete: 4, age: 1 },
    { id: 'wardrobe', inputs: { planks: 10, nails: 8, iron_plate: 1 }, outputs: { wardrobe: 1 }, ticksToComplete: 6, age: 1 },
    { id: 'chest', inputs: { planks: 6, iron_plate: 2 }, outputs: { chest: 1 }, ticksToComplete: 4, age: 1 },
    { id: 'bucket', inputs: { iron_plate: 2 }, outputs: { bucket: 1 }, ticksToComplete: 2, age: 1 },
    { id: 'hammer', inputs: { iron_ingot: 1, planks: 1 }, outputs: { hammer: 1 }, ticksToComplete: 2, age: 1 },
    { id: 'pickaxe', inputs: { iron_ingot: 2, planks: 1 }, outputs: { pickaxe: 1 }, ticksToComplete: 2, age: 1 },
    { id: 'shovel', inputs: { iron_plate: 1, planks: 2 }, outputs: { shovel: 1 }, ticksToComplete: 2, age: 1 },
    { id: 'fence', inputs: { planks: 3, nails: 2 }, outputs: { fence: 2 }, ticksToComplete: 2, age: 1 },
    { id: 'door', inputs: { wooden_beam: 2, planks: 4, iron_plate: 2 }, outputs: { door: 1 }, ticksToComplete: 5, age: 1 },
    { id: 'stone_wall', inputs: { stone_bricks: 4 }, outputs: { stone_wall: 2 }, ticksToComplete: 3, age: 1 },
    { id: 'bed', inputs: { planks: 6, wooden_beam: 2, rope: 2 }, outputs: { bed: 1 }, ticksToComplete: 5, age: 1 },
    { id: 'bench', inputs: { planks: 3, nails: 2 }, outputs: { bench: 1 }, ticksToComplete: 2, age: 1 },
    { id: 'ladder', inputs: { wooden_beam: 2, nails: 4 }, outputs: { ladder: 1 }, ticksToComplete: 3, age: 1 },
    { id: 'wheelbarrow', inputs: { planks: 4, iron_plate: 1, wheel: 1 }, outputs: { wheelbarrow: 1 }, ticksToComplete: 4, age: 1 },
    { id: 'cart', inputs: { wooden_beam: 3, wheel: 2, iron_bracket: 2 }, outputs: { cart: 1 }, ticksToComplete: 5, age: 1 },
    { id: 'barrel', inputs: { planks: 4, iron_rod: 2 }, outputs: { barrel: 1 }, ticksToComplete: 3, age: 1 },
    { id: 'anvil', inputs: { iron_ingot: 5 }, outputs: { anvil: 1 }, ticksToComplete: 4, age: 1 },
    { id: 'bellows', inputs: { planks: 3, iron_plate: 1, rope: 1 }, outputs: { bellows: 1 }, ticksToComplete: 3, age: 1 },
    { id: 'axe', inputs: { iron_ingot: 1, wooden_handle: 1 }, outputs: { axe: 1 }, ticksToComplete: 2, age: 1 },
    { id: 'saw', inputs: { iron_plate: 1, wooden_handle: 1 }, outputs: { saw: 1 }, ticksToComplete: 2, age: 1 },
    { id: 'chisel', inputs: { iron_rod: 1, wooden_handle: 1 }, outputs: { chisel: 1 }, ticksToComplete: 2, age: 1 },
    { id: 'mallet', inputs: { planks: 2, wooden_handle: 1 }, outputs: { mallet: 1 }, ticksToComplete: 2, age: 1 },
    { id: 'shield', inputs: { wooden_beam: 2, iron_plate: 1 }, outputs: { shield: 1 }, ticksToComplete: 4, age: 1 },
    { id: 'spear', inputs: { iron_rod: 2, wooden_handle: 1 }, outputs: { spear: 1 }, ticksToComplete: 2, age: 1 },
    { id: 'gate', inputs: { wooden_beam: 3, hinges: 2, iron_plate: 1 }, outputs: { gate: 1 }, ticksToComplete: 5, age: 1 },
    { id: 'staircase', inputs: { wooden_beam: 3, planks: 4, nails: 6 }, outputs: { staircase: 1 }, ticksToComplete: 4, age: 1 },
    { id: 'roof_tile_section', inputs: { stone_tile: 6 }, outputs: { roof_tile_section: 1 }, ticksToComplete: 2, age: 1 },
    { id: 'well', inputs: { stone_bricks: 8, rope: 2, bucket: 1 }, outputs: { well: 1 }, ticksToComplete: 6, age: 1 },
    { id: 'workbench', inputs: { planks: 6, wooden_beam: 1 }, outputs: { workbench: 1 }, ticksToComplete: 3, age: 1 },
    { id: 'forge', inputs: { stone_bricks: 6, iron_plate: 2 }, outputs: { forge: 1 }, ticksToComplete: 5, age: 1 },
    { id: 'crate', inputs: { planks: 4, nails: 4 }, outputs: { crate: 1 }, ticksToComplete: 2, age: 1 },
    { id: 'bridge_section', inputs: { wooden_beam: 4, planks: 6, iron_bracket: 2 }, outputs: { bridge_section: 1 }, ticksToComplete: 5, age: 1 },
    { id: 'plow', inputs: { iron_plate: 1, wooden_beam: 1, wooden_handle: 1 }, outputs: { plow: 1 }, ticksToComplete: 4, age: 1 },
    { id: 'stone_pillar', inputs: { stone_slab: 2, mortar: 1 }, outputs: { stone_pillar: 1 }, ticksToComplete: 4, age: 1 },
    { id: 'tool_rack', inputs: { planks: 3, nails: 3 }, outputs: { tool_rack: 1 }, ticksToComplete: 2, age: 1 },
    { id: 'shield_rack', inputs: { planks: 4, nails: 4 }, outputs: { shield_rack: 1 }, ticksToComplete: 2, age: 1 },
    { id: 'iron_grate', inputs: { iron_rod: 6 }, outputs: { iron_grate: 1 }, ticksToComplete: 3, age: 1 },
    { id: 'coat_hanger', inputs: { wooden_dowel: 4, iron_wire: 2 }, outputs: { coat_hanger: 1 }, ticksToComplete: 1, age: 1 },
    { id: 'shingled_roof', inputs: { wooden_shingle: 20, nails: 10 }, outputs: { shingled_roof: 1 }, ticksToComplete: 5, age: 1 },
    { id: 'wagon', inputs: { planks: 6, iron_axle: 2, wheel: 4, iron_bracket: 4 }, outputs: { wagon: 1 }, ticksToComplete: 10, age: 1 },
    { id: 'water_wheel', inputs: { wooden_beam: 8, iron_axle: 1, iron_bracket: 6 }, outputs: { water_wheel: 1 }, ticksToComplete: 8, age: 1 },
    { id: 'anchor', inputs: { iron_ingot: 4, iron_chain: 2 }, outputs: { anchor: 1 }, ticksToComplete: 4, age: 1 },

    // --- AGE 2: REFINEMENT ---
    // Intermediates
    { id: 'glass', inputs: { sand: 2 }, outputs: { glass: 2 }, ticksToComplete: 2, age: 2 },
    { id: 'copper_ingot', inputs: { copper_ore: 2 }, outputs: { copper_ingot: 1 }, ticksToComplete: 2, age: 2 },
    { id: 'copper_sheet', inputs: { copper_ingot: 2 }, outputs: { copper_sheet: 1 }, ticksToComplete: 2, age: 2 },
    { id: 'pipe', inputs: { copper_sheet: 1 }, outputs: { pipe: 2 }, ticksToComplete: 2, age: 2 },
    { id: 'ceramic_tile', inputs: { clay: 2 }, outputs: { ceramic_tile: 4 }, ticksToComplete: 2, age: 2 },
    { id: 'glass_pane', inputs: { glass: 1 }, outputs: { glass_pane: 4 }, ticksToComplete: 1, age: 2 },
    { id: 'copper_tubing', inputs: { copper_sheet: 1 }, outputs: { copper_tubing: 3 }, ticksToComplete: 2, age: 2 },
    { id: 'brass_ingot', inputs: { copper_ingot: 1, iron_ingot: 1 }, outputs: { brass_ingot: 1 }, ticksToComplete: 3, age: 2 },
    { id: 'brass_sheet', inputs: { brass_ingot: 2 }, outputs: { brass_sheet: 1 }, ticksToComplete: 2, age: 2 },
    { id: 'decorative_glass', inputs: { glass: 1, copper_sheet: 1 }, outputs: { decorative_glass: 1 }, ticksToComplete: 3, age: 2 },
    { id: 'terracotta', inputs: { clay: 2 }, outputs: { terracotta: 2 }, ticksToComplete: 2, age: 2 },
    { id: 'porcelain', inputs: { clay: 2, sand: 1 }, outputs: { porcelain: 1 }, ticksToComplete: 3, age: 2 },
    { id: 'glass_lens', inputs: { glass: 1 }, outputs: { glass_lens: 2 }, ticksToComplete: 2, age: 2 },
    { id: 'copper_rod', inputs: { copper_ingot: 1 }, outputs: { copper_rod: 2 }, ticksToComplete: 1, age: 2 },
    { id: 'bronze_ingot', inputs: { copper_ingot: 2, iron_ingot: 1 }, outputs: { bronze_ingot: 2 }, ticksToComplete: 3, age: 2 },

    // Final Goods Age 2
    { id: 'vase', inputs: { clay: 3 }, outputs: { vase: 1 }, ticksToComplete: 3, age: 2 },
    { id: 'pot', inputs: { copper_sheet: 2 }, outputs: { pot: 1 }, ticksToComplete: 2, age: 2 },
    { id: 'mirror', inputs: { glass: 1, copper_sheet: 1 }, outputs: { mirror: 1 }, ticksToComplete: 3, age: 2 },
    { id: 'window', inputs: { glass: 2, planks: 2 }, outputs: { window: 1 }, ticksToComplete: 3, age: 2 },
    { id: 'lantern', inputs: { glass: 1, copper_sheet: 1, iron_rod: 1 }, outputs: { lantern: 1 }, ticksToComplete: 4, age: 2 },
    { id: 'kettle', inputs: { copper_sheet: 2, iron_rod: 1 }, outputs: { kettle: 1 }, ticksToComplete: 3, age: 2 },
    { id: 'fountain', inputs: { clay: 5, pipe: 1 }, outputs: { fountain: 1 }, ticksToComplete: 6, age: 2 },
    { id: 'aqueduct_section', inputs: { clay: 10, pipe: 2 }, outputs: { aqueduct_section: 1 }, ticksToComplete: 8, age: 2 },
    { id: 'spyglass', inputs: { glass: 2, copper_sheet: 2 }, outputs: { spyglass: 1 }, ticksToComplete: 5, age: 2 },
    { id: 'chandelier', inputs: { glass: 3, copper_sheet: 2, iron_chain: 1 }, outputs: { chandelier: 1 }, ticksToComplete: 6, age: 2 },
    { id: 'stained_glass', inputs: { decorative_glass: 2, iron_rod: 2 }, outputs: { stained_glass: 1 }, ticksToComplete: 5, age: 2 },
    { id: 'telescope', inputs: { glass_lens: 3, copper_tubing: 2 }, outputs: { telescope: 1 }, ticksToComplete: 6, age: 2 },
    { id: 'compass', inputs: { brass_sheet: 1, glass_pane: 1, copper_rod: 1 }, outputs: { compass: 1 }, ticksToComplete: 4, age: 2 },
    { id: 'plate_set', inputs: { porcelain: 3 }, outputs: { plate_set: 1 }, ticksToComplete: 3, age: 2 },
    { id: 'tile_floor', inputs: { ceramic_tile: 8 }, outputs: { tile_floor: 1 }, ticksToComplete: 3, age: 2 },
    { id: 'bathtub', inputs: { copper_sheet: 4, pipe: 2 }, outputs: { bathtub: 1 }, ticksToComplete: 7, age: 2 },
    { id: 'sink', inputs: { copper_sheet: 2, pipe: 1 }, outputs: { sink: 1 }, ticksToComplete: 4, age: 2 },
    { id: 'decorative_urn', inputs: { terracotta: 3 }, outputs: { decorative_urn: 1 }, ticksToComplete: 4, age: 2 },
    { id: 'chimney', inputs: { bricks: 6, pipe: 1 }, outputs: { chimney: 1 }, ticksToComplete: 5, age: 2 },
    { id: 'greenhouse_panel', inputs: { glass_pane: 4, iron_rod: 2 }, outputs: { greenhouse_panel: 1 }, ticksToComplete: 4, age: 2 },
    { id: 'church_bell', inputs: { brass_ingot: 3, iron_bracket: 1 }, outputs: { church_bell: 1 }, ticksToComplete: 7, age: 2 },
    { id: 'candelabra', inputs: { brass_sheet: 2, copper_rod: 1 }, outputs: { candelabra: 1 }, ticksToComplete: 4, age: 2 },
    { id: 'pottery_wheel', inputs: { wooden_beam: 2, stone: 1, copper_sheet: 1 }, outputs: { pottery_wheel: 1 }, ticksToComplete: 5, age: 2 },
    { id: 'barometer', inputs: { glass: 1, copper_tubing: 2 }, outputs: { barometer: 1 }, ticksToComplete: 5, age: 2 },
    { id: 'hourglass', inputs: { glass: 2, sand: 1 }, outputs: { hourglass: 1 }, ticksToComplete: 3, age: 2 },
    { id: 'ceramic_bowl', inputs: { clay: 3 }, outputs: { ceramic_bowl: 2 }, ticksToComplete: 2, age: 2 },
    { id: 'copper_statue', inputs: { copper_ingot: 3, copper_sheet: 2 }, outputs: { copper_statue: 1 }, ticksToComplete: 6, age: 2 },
    { id: 'magnifying_glass', inputs: { glass_lens: 1, brass_sheet: 1 }, outputs: { magnifying_glass: 1 }, ticksToComplete: 4, age: 2 },
    { id: 'sundial', inputs: { stone_slab: 1, brass_sheet: 1 }, outputs: { sundial: 1 }, ticksToComplete: 3, age: 2 },
    { id: 'bronze_armor', inputs: { bronze_ingot: 6, iron_chain: 4 }, outputs: { bronze_armor: 1 }, ticksToComplete: 10, age: 2 },

    // --- AGE 3: INDUSTRIAL ---
    // Intermediates
    { id: 'bricks', inputs: { clay: 2 }, outputs: { bricks: 3 }, ticksToComplete: 2, age: 3 },
    { id: 'steel_ingot', inputs: { iron_ingot: 2, coal: 2 }, outputs: { steel_ingot: 1 }, ticksToComplete: 4, age: 3 },
    { id: 'steel_beam', inputs: { steel_ingot: 3 }, outputs: { steel_beam: 1 }, ticksToComplete: 3, age: 3 },
    { id: 'steel_plate', inputs: { steel_ingot: 2 }, outputs: { steel_plate: 1 }, ticksToComplete: 3, age: 3 },
    { id: 'steel_rod', inputs: { steel_ingot: 1 }, outputs: { steel_rod: 2 }, ticksToComplete: 2, age: 3 },
    { id: 'gear', inputs: { iron_plate: 1 }, outputs: { gear: 2 }, ticksToComplete: 2, age: 3 },
    { id: 'steel_gear', inputs: { steel_plate: 1 }, outputs: { steel_gear: 2 }, ticksToComplete: 3, age: 3 },
    { id: 'steel_cable', inputs: { steel_rod: 1 }, outputs: { steel_cable: 2 }, ticksToComplete: 2, age: 3 },
    { id: 'steel_rivet', inputs: { steel_rod: 1 }, outputs: { steel_rivet: 8 }, ticksToComplete: 2, age: 3 },
    { id: 'steel_spring', inputs: { steel_rod: 1 }, outputs: { steel_spring: 2 }, ticksToComplete: 2, age: 3 },
    { id: 'ball_bearing', inputs: { steel_rod: 1, steel_rivet: 2 }, outputs: { ball_bearing: 2 }, ticksToComplete: 3, age: 3 },
    { id: 'steel_chain', inputs: { steel_rod: 2 }, outputs: { steel_chain: 1 }, ticksToComplete: 3, age: 3 },
    { id: 'steel_pipe', inputs: { steel_plate: 1 }, outputs: { steel_pipe: 2 }, ticksToComplete: 3, age: 3 },
    { id: 'coupling', inputs: { steel_pipe: 1 }, outputs: { coupling: 2 }, ticksToComplete: 2, age: 3 },
    { id: 'piston', inputs: { steel_ingot: 1, iron_rod: 1 }, outputs: { piston: 1 }, ticksToComplete: 3, age: 3 },
    { id: 'steam_valve', inputs: { brass_ingot: 1, steel_rod: 1 }, outputs: { steam_valve: 1 }, ticksToComplete: 3, age: 3 },
    { id: 'drive_shaft', inputs: { steel_rod: 2, steel_ingot: 1 }, outputs: { drive_shaft: 1 }, ticksToComplete: 4, age: 3 },
    { id: 'flywheel', inputs: { steel_plate: 4 }, outputs: { flywheel: 1 }, ticksToComplete: 5, age: 3 },
    { id: 'pressure_gauge', inputs: { glass_pane: 1, brass_sheet: 1, steel_spring: 1 }, outputs: { pressure_gauge: 1 }, ticksToComplete: 4, age: 3 },
    { id: 'boiler', inputs: { steel_plate: 4, steel_pipe: 2 }, outputs: { boiler: 1 }, ticksToComplete: 6, age: 3 },
    { id: 'camshaft', inputs: { drive_shaft: 1, steel_gear: 2 }, outputs: { camshaft: 1 }, ticksToComplete: 6, age: 3 },
    { id: 'crankshaft', inputs: { drive_shaft: 1, steel_rod: 2 }, outputs: { crankshaft: 1 }, ticksToComplete: 6, age: 3 },

    // Final Goods Age 3
    { id: 'vault_door', inputs: { steel_plate: 6, gear: 4 }, outputs: { vault_door: 1 }, ticksToComplete: 8, age: 3 },
    { id: 'stove', inputs: { iron_plate: 4, pipe: 1 }, outputs: { stove: 1 }, ticksToComplete: 6, age: 3 },
    { id: 'bicycle', inputs: { steel_beam: 1, gear: 2, iron_rod: 2 }, outputs: { bicycle: 1 }, ticksToComplete: 6, age: 3 },
    { id: 'clock', inputs: { planks: 6, gear: 8, glass: 1 }, outputs: { clock: 1 }, ticksToComplete: 10, age: 3 },
    { id: 'printing_press', inputs: { steel_plate: 5, gear: 10, piston: 2 }, outputs: { printing_press: 1 }, ticksToComplete: 15, age: 3 },
    { id: 'sewing_machine', inputs: { iron_plate: 3, gear: 4, iron_rod: 2 }, outputs: { sewing_machine: 1 }, ticksToComplete: 8, age: 3 },
    { id: 'tool_box', inputs: { steel_plate: 2, hammer: 1, shovel: 1 }, outputs: { tool_box: 1 }, ticksToComplete: 5, age: 3 },
    { id: 'radiator', inputs: { steel_pipe: 4, steel_plate: 2 }, outputs: { radiator: 1 }, ticksToComplete: 6, age: 3 },
    { id: 'locomotive', inputs: { boiler: 1, piston: 2, steel_beam: 4, wheel: 4 }, outputs: { locomotive: 1 }, ticksToComplete: 30, age: 3 },
    { id: 'industrial_furnace', inputs: { bricks: 8, steel_plate: 4, steel_pipe: 2 }, outputs: { industrial_furnace: 1 }, ticksToComplete: 12, age: 3 },
    { id: 'lathe', inputs: { steel_beam: 2, drive_shaft: 1, chisel: 1, flywheel: 1 }, outputs: { lathe: 1 }, ticksToComplete: 15, age: 3 },
    { id: 'milling_machine', inputs: { steel_beam: 2, steel_gear: 4, steel_rod: 2 }, outputs: { milling_machine: 1 }, ticksToComplete: 15, age: 3 },
    { id: 'safe', inputs: { steel_plate: 6, vault_door: 1 }, outputs: { safe: 1 }, ticksToComplete: 10, age: 3 },
    { id: 'crane', inputs: { steel_beam: 6, steel_cable: 4, gear: 4 }, outputs: { crane: 1 }, ticksToComplete: 20, age: 3 },
    { id: 'elevator', inputs: { steel_beam: 4, steel_cable: 6, piston: 1 }, outputs: { elevator: 1 }, ticksToComplete: 18, age: 3 },
    { id: 'mechanical_loom', inputs: { steel_beam: 2, gear: 6, steel_rod: 4 }, outputs: { mechanical_loom: 1 }, ticksToComplete: 12, age: 3 },
    { id: 'pocket_watch', inputs: { glass_lens: 1, brass_sheet: 2, steel_spring: 4, steel_gear: 4 }, outputs: { pocket_watch: 1 }, ticksToComplete: 8, age: 3 },
    { id: 'manhole_cover', inputs: { steel_plate: 2 }, outputs: { manhole_cover: 1 }, ticksToComplete: 4, age: 3 },
    { id: 'steel_bridge', inputs: { steel_beam: 4, steel_plate: 2, steel_rivet: 10 }, outputs: { steel_bridge: 1 }, ticksToComplete: 20, age: 3 },
    { id: 'water_tower', inputs: { steel_plate: 8, steel_pipe: 4, steel_beam: 4 }, outputs: { water_tower: 1 }, ticksToComplete: 20, age: 3 },
    { id: 'industrial_press', inputs: { piston: 2, steel_beam: 2, anvil: 1 }, outputs: { industrial_press: 1 }, ticksToComplete: 18, age: 3 },
    { id: 'steam_hammer', inputs: { piston: 1, anvil: 1, boiler: 1, steel_beam: 2 }, outputs: { steam_hammer: 1 }, ticksToComplete: 20, age: 3 },
    { id: 'rail_track', inputs: { steel_rod: 2, planks: 1 }, outputs: { rail_track: 2 }, ticksToComplete: 3, age: 3 },
    { id: 'padlock', inputs: { steel_ingot: 1, steel_spring: 1 }, outputs: { padlock: 1 }, ticksToComplete: 2, age: 3 },
    { id: 'wrench', inputs: { steel_ingot: 1 }, outputs: { wrench: 1 }, ticksToComplete: 2, age: 3 },
    { id: 'pipe_organ', inputs: { steel_pipe: 8, planks: 4, bellows: 1 }, outputs: { pipe_organ: 1 }, ticksToComplete: 25, age: 3 },
    { id: 'industrial_boiler', inputs: { boiler: 2, steel_plate: 4, steel_pipe: 4 }, outputs: { industrial_boiler: 1 }, ticksToComplete: 15, age: 3 },
    { id: 'conveyor_belt', inputs: { ball_bearing: 8, steel_chain: 4, steel_beam: 2, electric_motor: 1 }, outputs: { conveyor_belt: 1 }, ticksToComplete: 12, age: 3 },
    { id: 'pressure_cooker', inputs: { steel_plate: 2, pressure_gauge: 1, steam_valve: 1 }, outputs: { pressure_cooker: 1 }, ticksToComplete: 8, age: 3 },
    { id: 'plumbing_system', inputs: { steel_pipe: 6, coupling: 4, steam_valve: 2 }, outputs: { plumbing_system: 1 }, ticksToComplete: 10, age: 3 },
    { id: 'rotary_engine', inputs: { steel_ingot: 4, camshaft: 1, crankshaft: 1, ball_bearing: 4, gear: 3 }, outputs: { rotary_engine: 1 }, ticksToComplete: 20, age: 3 },

    // --- AGE 4: COMBUSTION ---
    // - Updated with new logic for Age 4
    // Intermediates
    { id: 'copper_wire', inputs: { copper_ingot: 1 }, outputs: { copper_wire: 4 }, ticksToComplete: 1, age: 4 },
    { id: 'gasoline', inputs: { oil: 2 }, outputs: { gasoline: 2 }, ticksToComplete: 3, age: 4 },
    { id: 'diesel_fuel', inputs: { oil: 2 }, outputs: { diesel_fuel: 2 }, ticksToComplete: 3, age: 4 },
    { id: 'lubricant', inputs: { oil: 1 }, outputs: { lubricant: 2 }, ticksToComplete: 2, age: 4 },
    { id: 'plastic', inputs: { oil: 1 }, outputs: { plastic: 2 }, ticksToComplete: 2, age: 4 },
    { id: 'rubber', inputs: { oil: 1 }, outputs: { rubber: 2 }, ticksToComplete: 2, age: 4 },
    { id: 'asphalt', inputs: { stone: 1, oil: 1 }, outputs: { asphalt: 2 }, ticksToComplete: 2, age: 4 },
    { id: 'concrete', inputs: { stone: 1, sand: 1 }, outputs: { concrete: 2 }, ticksToComplete: 2, age: 4 },
    { id: 'plastic_sheet', inputs: { plastic: 2 }, outputs: { plastic_sheet: 1 }, ticksToComplete: 2, age: 4 },
    { id: 'vinyl', inputs: { plastic: 2 }, outputs: { vinyl: 2 }, ticksToComplete: 2, age: 4 },
    { id: 'fiberglass', inputs: { plastic: 1, glass: 1 }, outputs: { fiberglass: 2 }, ticksToComplete: 3, age: 4 },
    { id: 'synthetic_fabric', inputs: { plastic: 1 }, outputs: { synthetic_fabric: 2 }, ticksToComplete: 2, age: 4 },
    { id: 'glass_bottle', inputs: { glass: 1 }, outputs: { glass_bottle: 4 }, ticksToComplete: 1, age: 4 },
    { id: 'leather', inputs: { synthetic_fabric: 1, rubber: 1 }, outputs: { leather: 1 }, ticksToComplete: 3, age: 4 },
    { id: 'vacuum_tube', inputs: { glass: 1, copper_wire: 1 }, outputs: { vacuum_tube: 2 }, ticksToComplete: 3, age: 4 },

    // Complex Parts
    { id: 'carburetor', inputs: { steel_plate: 1, brass_ingot: 1 }, outputs: { carburetor: 1 }, ticksToComplete: 4, age: 4 },
    { id: 'spark_plug', inputs: { ceramic_tile: 1, copper_wire: 1 }, outputs: { spark_plug: 4 }, ticksToComplete: 2, age: 4 },
    { id: 'engine_block', inputs: { steel_ingot: 4, piston: 4, gear: 2 }, outputs: { engine_block: 1 }, ticksToComplete: 10, age: 4 },
    { id: 'tire', inputs: { rubber: 2, steel_plate: 1 }, outputs: { tire: 1 }, ticksToComplete: 3, age: 4 },
    { id: 'battery', inputs: { plastic: 1, steel_plate: 1, copper_ingot: 1 }, outputs: { battery: 1 }, ticksToComplete: 5, age: 4 },
    { id: 'light_bulb', inputs: { glass: 1, copper_wire: 1 }, outputs: { light_bulb: 4 }, ticksToComplete: 2, age: 4 },

    // Final Goods Age 4
    { id: 'car_tire', inputs: { tire: 1, steel_plate: 1 }, outputs: { car_tire: 1 }, ticksToComplete: 2, age: 4 },
    { id: 'car_engine', inputs: { engine_block: 1, carburetor: 1, spark_plug: 4, lubricant: 1 }, outputs: { car_engine: 1 }, ticksToComplete: 15, age: 4 },
    { id: 'lawn_mower', inputs: { engine_block: 1, steel_plate: 2, tire: 4, gasoline: 1 }, outputs: { lawn_mower: 1 }, ticksToComplete: 12, age: 4 },
    { id: 'chainsaw', inputs: { engine_block: 1, gear: 2, plastic: 1, steel_chain: 1 }, outputs: { chainsaw: 1 }, ticksToComplete: 8, age: 4 },
    { id: 'generator', inputs: { engine_block: 1, copper_wire: 5, steel_plate: 2 }, outputs: { generator: 1 }, ticksToComplete: 10, age: 4 },
    { id: 'scooter', inputs: { engine_block: 1, tire: 2, steel_beam: 2 }, outputs: { scooter: 1 }, ticksToComplete: 15, age: 4 },
    { id: 'motorcycle', inputs: { car_engine: 1, tire: 2, steel_beam: 2 }, outputs: { motorcycle: 1 }, ticksToComplete: 20, age: 4 },
    { id: 'automobile', inputs: { car_engine: 1, car_tire: 4, steel_plate: 6, glass: 2, vinyl: 2 }, outputs: { automobile: 1 }, ticksToComplete: 40, age: 4 },
    { id: 'radio_transmitter', inputs: { plastic: 3, copper_wire: 2 }, outputs: { radio_transmitter: 1 }, ticksToComplete: 5, age: 4 },
    { id: 'typewriter', inputs: { steel_plate: 2, gear: 10, plastic: 1 }, outputs: { typewriter: 1 }, ticksToComplete: 8, age: 4 },
    { id: 'camera', inputs: { plastic: 2, glass_lens: 2, gear: 2 }, outputs: { camera: 1 }, ticksToComplete: 6, age: 4 },
    { id: 'industrial_pump', inputs: { steel_pipe: 4, engine_block: 1, rubber: 2 }, outputs: { industrial_pump: 1 }, ticksToComplete: 10, age: 4 },
    { id: 'power_saw', inputs: { engine_block: 1, saw: 1, plastic: 1 }, outputs: { power_saw: 1 }, ticksToComplete: 8, age: 4 },
    { id: 'jackhammer', inputs: { engine_block: 1, chisel: 2, steel_spring: 2 }, outputs: { jackhammer: 1 }, ticksToComplete: 8, age: 4 },
    { id: 'concrete_mixer', inputs: { engine_block: 1, steel_plate: 8, wheel: 4 }, outputs: { concrete_mixer: 1 }, ticksToComplete: 15, age: 4 },
    { id: 'traffic_light', inputs: { steel_pipe: 1, light_bulb: 3, glass_lens: 3 }, outputs: { traffic_light: 1 }, ticksToComplete: 6, age: 4 },
    { id: 'street_lamp', inputs: { steel_pipe: 2, light_bulb: 1, glass: 1 }, outputs: { street_lamp: 1 }, ticksToComplete: 5, age: 4 },
    { id: 'telephone', inputs: { plastic: 2, copper_wire: 2, steel_spring: 1 }, outputs: { telephone: 1 }, ticksToComplete: 5, age: 4 },
    { id: 'vinyl_record', inputs: { vinyl: 1 }, outputs: { vinyl_record: 2 }, ticksToComplete: 2, age: 4 },
    { id: 'plastic_container', inputs: { plastic: 1 }, outputs: { plastic_container: 2 }, ticksToComplete: 1, age: 4 },
    { id: 'garden_hose', inputs: { rubber: 1, brass_ingot: 1 }, outputs: { garden_hose: 1 }, ticksToComplete: 2, age: 4 },
    { id: 'fuel_tank', inputs: { steel_plate: 4, steel_pipe: 1 }, outputs: { fuel_tank: 1 }, ticksToComplete: 6, age: 4 },
    { id: 'oil_drum', inputs: { steel_plate: 2 }, outputs: { oil_drum: 1 }, ticksToComplete: 3, age: 4 },
    { id: 'flashlight', inputs: { plastic: 1, light_bulb: 1, battery: 1 }, outputs: { flashlight: 1 }, ticksToComplete: 2, age: 4 },
    { id: 'road_segment', inputs: { asphalt: 4, concrete: 2 }, outputs: { road_segment: 1 }, ticksToComplete: 5, age: 4 },
    { id: 'leather_jacket', inputs: { leather: 3, synthetic_fabric: 2 }, outputs: { leather_jacket: 1 }, ticksToComplete: 6, age: 4 },
    { id: 'amplifier', inputs: { vacuum_tube: 4, copper_wire: 6, steel_plate: 1 }, outputs: { amplifier: 1 }, ticksToComplete: 8, age: 4 },
    { id: 'diesel_truck', inputs: { car_engine: 1, car_tire: 6, steel_plate: 8, diesel_fuel: 4 }, outputs: { diesel_truck: 1 }, ticksToComplete: 50, age: 4 },
    { id: 'chemistry_set', inputs: { glass_bottle: 5, rubber: 1, plastic: 1 }, outputs: { chemistry_set: 1 }, ticksToComplete: 4, age: 4 },
    { id: 'raincoat', inputs: { plastic_sheet: 3, synthetic_fabric: 1 }, outputs: { raincoat: 1 }, ticksToComplete: 3, age: 4 },
    { id: 'kayak', inputs: { fiberglass: 5, plastic: 1 }, outputs: { kayak: 1 }, ticksToComplete: 8, age: 4 },

    // --- AGE 5: ELECTRIC ---
    // - Updated with new logic for Age 5
    // Intermediates
    { id: 'aluminum_ingot', inputs: { bauxite: 2 }, outputs: { aluminum_ingot: 1 }, ticksToComplete: 4, age: 5 },
    { id: 'aluminum_sheet', inputs: { aluminum_ingot: 2 }, outputs: { aluminum_sheet: 1 }, ticksToComplete: 2, age: 5 },
    { id: 'aluminum_rod', inputs: { aluminum_ingot: 1 }, outputs: { aluminum_rod: 2 }, ticksToComplete: 2, age: 5 },
    { id: 'insulated_wire', inputs: { copper_wire: 1, plastic: 1 }, outputs: { insulated_wire: 2 }, ticksToComplete: 1, age: 5 },
    { id: 'electric_coil', inputs: { copper_wire: 2, iron_rod: 1 }, outputs: { electric_coil: 1 }, ticksToComplete: 2, age: 5 },
    { id: 'electric_motor', inputs: { electric_coil: 2, steel_ingot: 1 }, outputs: { electric_motor: 1 }, ticksToComplete: 5, age: 5 },
    { id: 'heating_element', inputs: { iron_rod: 1, copper_wire: 2 }, outputs: { heating_element: 1 }, ticksToComplete: 2, age: 5 },
    { id: 'electric_switch', inputs: { plastic: 1, copper_sheet: 1 }, outputs: { electric_switch: 2 }, ticksToComplete: 1, age: 5 },
    { id: 'transformer', inputs: { electric_coil: 2, steel_plate: 1 }, outputs: { transformer: 1 }, ticksToComplete: 4, age: 5 },
    { id: 'capacitor', inputs: { aluminum_sheet: 1, plastic: 1 }, outputs: { capacitor: 4 }, ticksToComplete: 2, age: 5 },
    { id: 'resistor', inputs: { ceramic_tile: 1, copper_wire: 1 }, outputs: { resistor: 8 }, ticksToComplete: 1, age: 5 },
    { id: 'bulb_socket', inputs: { plastic: 1, brass_sheet: 1 }, outputs: { bulb_socket: 2 }, ticksToComplete: 1, age: 5 },
    { id: 'relay', inputs: { electric_coil: 1, electric_switch: 1 }, outputs: { relay: 1 }, ticksToComplete: 2, age: 5 },
    { id: 'thermostat', inputs: { brass_sheet: 1, electric_switch: 1 }, outputs: { thermostat: 1 }, ticksToComplete: 3, age: 5 },
    { id: 'compressor', inputs: { electric_motor: 1, aluminum_sheet: 1, pipe: 1 }, outputs: { compressor: 1 }, ticksToComplete: 6, age: 5 },
    { id: 'housing', inputs: { steel_plate: 1, aluminum_sheet: 1 }, outputs: { housing: 2 }, ticksToComplete: 3, age: 5 },
    { id: 'steel_wire', inputs: { steel_ingot: 1 }, outputs: { steel_wire: 4 }, ticksToComplete: 1, age: 5 },
    { id: 'insulation', inputs: { fiberglass: 1, synthetic_fabric: 1 }, outputs: { insulation: 2 }, ticksToComplete: 2, age: 5 },

    // Final Goods Age 5
    { id: 'fan', inputs: { electric_motor: 1, plastic: 2, aluminum_sheet: 1 }, outputs: { fan: 1 }, ticksToComplete: 5, age: 5 },
    { id: 'toaster', inputs: { heating_element: 2, aluminum_sheet: 1, plastic: 1, electric_switch: 1 }, outputs: { toaster: 1 }, ticksToComplete: 4, age: 5 },
    { id: 'vacuum', inputs: { electric_motor: 1, plastic: 3, pipe: 1 }, outputs: { vacuum: 1 }, ticksToComplete: 6, age: 5 },
    { id: 'fridge', inputs: { aluminum_sheet: 4, compressor: 1, plastic: 2, thermostat: 1 }, outputs: { fridge: 1 }, ticksToComplete: 10, age: 5 },
    { id: 'washer', inputs: { steel_plate: 3, electric_motor: 1, glass: 1, rubber: 1 }, outputs: { washer: 1 }, ticksToComplete: 10, age: 5 },
    { id: 'dishwasher', inputs: { steel_plate: 3, electric_motor: 1, plastic: 2, heating_element: 1 }, outputs: { dishwasher: 1 }, ticksToComplete: 10, age: 5 },
    { id: 'air_conditioner', inputs: { compressor: 1, fan: 1, aluminum_sheet: 2 }, outputs: { air_conditioner: 1 }, ticksToComplete: 12, age: 5 },
    { id: 'electric_oven', inputs: { heating_element: 4, steel_plate: 4, glass: 1, thermostat: 1 }, outputs: { electric_oven: 1 }, ticksToComplete: 10, age: 5 },
    { id: 'radio', inputs: { plastic: 2, insulated_wire: 3, resistor: 2, capacitor: 2 }, outputs: { radio: 1 }, ticksToComplete: 5, age: 5 },
    { id: 'drill', inputs: { electric_motor: 1, plastic: 2, gear: 1 }, outputs: { drill: 1 }, ticksToComplete: 5, age: 5 },
    { id: 'mixer', inputs: { electric_motor: 1, glass: 1, plastic: 1 }, outputs: { mixer: 1 }, ticksToComplete: 4, age: 5 },
    { id: 'blender', inputs: { electric_motor: 1, glass_bottle: 1, plastic: 1 }, outputs: { blender: 1 }, ticksToComplete: 4, age: 5 },
    { id: 'food_processor', inputs: { electric_motor: 1, plastic: 2, steel_plate: 1 }, outputs: { food_processor: 1 }, ticksToComplete: 5, age: 5 },
    { id: 'hair_dryer', inputs: { heating_element: 1, fan: 1, plastic: 1 }, outputs: { hair_dryer: 1 }, ticksToComplete: 3, age: 5 },
    { id: 'electric_heater', inputs: { heating_element: 2, steel_plate: 1, fan: 1 }, outputs: { electric_heater: 1 }, ticksToComplete: 5, age: 5 },
    { id: 'electric_kettle', inputs: { heating_element: 1, plastic: 1, copper_sheet: 1 }, outputs: { electric_kettle: 1 }, ticksToComplete: 3, age: 5 },
    { id: 'electric_saw', inputs: { electric_motor: 1, saw: 1, aluminum_sheet: 1 }, outputs: { electric_saw: 1 }, ticksToComplete: 6, age: 5 },
    { id: 'arc_welder', inputs: { transformer: 1, insulated_wire: 2, steel_plate: 1 }, outputs: { arc_welder: 1 }, ticksToComplete: 8, age: 5 },
    { id: 'electric_guitar', inputs: { wood: 2, electric_coil: 2 }, outputs: { electric_guitar: 1 }, ticksToComplete: 6, age: 5 },
    { id: 'jukebox', inputs: { wood: 4, glass: 2, radio: 1, vinyl_record: 1 }, outputs: { jukebox: 1 }, ticksToComplete: 10, age: 5 },
    { id: 'ceiling_fan', inputs: { electric_motor: 1, wood: 2, brass_ingot: 1 }, outputs: { ceiling_fan: 1 }, ticksToComplete: 6, age: 5 },
    { id: 'water_heater', inputs: { heating_element: 2, steel_plate: 3 }, outputs: { water_heater: 1 }, ticksToComplete: 8, age: 5 },
    { id: 'sander', inputs: { electric_motor: 1, plastic: 1 }, outputs: { sander: 1 }, ticksToComplete: 4, age: 5 },
    { id: 'elevator_motor', inputs: { electric_motor: 2, steel_gear: 4, steel_beam: 2 }, outputs: { elevator_motor: 1 }, ticksToComplete: 12, age: 5 },
    { id: 'motor_housing_unit', inputs: { housing: 2, electric_motor: 1, aluminum_sheet: 1 }, outputs: { motor_housing_unit: 1 }, ticksToComplete: 6, age: 5 },
    { id: 'insulated_pipe', inputs: { steel_pipe: 2, insulation: 1 }, outputs: { insulated_pipe: 1 }, ticksToComplete: 4, age: 5 },
    { id: 'relay_panel', inputs: { relay: 6, circuit_board: 1, steel_plate: 1 }, outputs: { relay_panel: 1 }, ticksToComplete: 8, age: 5 },
    { id: 'wire_spool', inputs: { steel_wire: 10, aluminum_rod: 1 }, outputs: { wire_spool: 1 }, ticksToComplete: 3, age: 5 },
    { id: 'lamp_fixture', inputs: { bulb_socket: 3, aluminum_sheet: 1, steel_bracket: 2 }, outputs: { lamp_fixture: 1 }, ticksToComplete: 4, age: 5 },

    // --- AGE 6: DIGITAL ---
    // - Updated with new logic for Age 6
    // Intermediates
    { id: 'silicon', inputs: { sand: 4 }, outputs: { silicon: 1 }, ticksToComplete: 5, age: 6 },
    { id: 'circuit_board', inputs: { plastic_sheet: 1, copper_wire: 2 }, outputs: { circuit_board: 2 }, ticksToComplete: 3, age: 6 },
    { id: 'cpu', inputs: { silicon: 2, circuit_board: 1 }, outputs: { cpu: 1 }, ticksToComplete: 8, age: 6 },
    { id: 'led', inputs: { plastic: 1, silicon: 1 }, outputs: { led: 4 }, ticksToComplete: 2, age: 6 },
    { id: 'screen', inputs: { glass: 2, plastic: 1, led: 4 }, outputs: { screen: 1 }, ticksToComplete: 5, age: 6 },
    { id: 'ram_module', inputs: { circuit_board: 1, silicon: 2 }, outputs: { ram_module: 1 }, ticksToComplete: 4, age: 6 },
    { id: 'hard_drive', inputs: { aluminum_sheet: 1, electric_motor: 1, circuit_board: 1 }, outputs: { hard_drive: 1 }, ticksToComplete: 5, age: 6 },
    { id: 'motherboard', inputs: { circuit_board: 2, cpu: 1, capacitor: 2 }, outputs: { motherboard: 1 }, ticksToComplete: 6, age: 6 },
    { id: 'graphics_card', inputs: { circuit_board: 1, cpu: 1, fan: 1 }, outputs: { graphics_card: 1 }, ticksToComplete: 7, age: 6 },
    { id: 'power_supply', inputs: { transformer: 1, capacitor: 2, steel_plate: 1, fan: 1 }, outputs: { power_supply: 1 }, ticksToComplete: 5, age: 6 },
    { id: 'keyboard', inputs: { plastic: 2, circuit_board: 1 }, outputs: { keyboard: 1 }, ticksToComplete: 3, age: 6 },
    { id: 'mouse', inputs: { plastic: 1, led: 1, circuit_board: 1 }, outputs: { mouse: 1 }, ticksToComplete: 2, age: 6 },
    { id: 'usb_cable', inputs: { insulated_wire: 2 }, outputs: { usb_cable: 2 }, ticksToComplete: 1, age: 6 },
    { id: 'digital_sensor', inputs: { silicon: 1, circuit_board: 1 }, outputs: { digital_sensor: 1 }, ticksToComplete: 3, age: 6 },
    { id: 'steel_bracket', inputs: { steel_plate: 1 }, outputs: { steel_bracket: 4 }, ticksToComplete: 2, age: 6 },

    // Final Goods Age 6
    { id: 'monitor', inputs: { screen: 1, plastic: 2, circuit_board: 1 }, outputs: { monitor: 1 }, ticksToComplete: 6, age: 6 },
    { id: 'computer', inputs: { motherboard: 1, power_supply: 1, hard_drive: 1, ram_module: 1, aluminum_sheet: 2 }, outputs: { computer: 1 }, ticksToComplete: 15, age: 6 },
    { id: 'laptop', inputs: { motherboard: 1, screen: 1, keyboard: 1, battery: 1, plastic: 2 }, outputs: { laptop: 1 }, ticksToComplete: 18, age: 6 },
    { id: 'tv', inputs: { screen: 1, circuit_board: 1, plastic: 4, electric_switch: 1 }, outputs: { tv: 1 }, ticksToComplete: 12, age: 6 },
    { id: 'microwave', inputs: { heating_element: 1, circuit_board: 1, steel_plate: 2, glass: 1 }, outputs: { microwave: 1 }, ticksToComplete: 8, age: 6 },
    { id: 'calculator', inputs: { circuit_board: 1, screen: 1, plastic: 1 }, outputs: { calculator: 1 }, ticksToComplete: 4, age: 6 },
    { id: 'console', inputs: { motherboard: 1, graphics_card: 1, plastic: 3 }, outputs: { console: 1 }, ticksToComplete: 12, age: 6 },
    { id: 'printer', inputs: { electric_motor: 2, circuit_board: 1, plastic: 3 }, outputs: { printer: 1 }, ticksToComplete: 8, age: 6 },
    { id: 'watch_digital', inputs: { circuit_board: 1, plastic: 1, battery: 1 }, outputs: { watch_digital: 1 }, ticksToComplete: 3, age: 6 },
    { id: 'server', inputs: { motherboard: 2, hard_drive: 4, power_supply: 2, steel_plate: 4 }, outputs: { server: 1 }, ticksToComplete: 20, age: 6 },
    { id: 'solar_panel_item', inputs: { silicon: 4, glass: 2, aluminum_sheet: 1 }, outputs: { solar_panel_item: 1 }, ticksToComplete: 8, age: 6 },
    { id: 'scanner', inputs: { light_bulb: 2, digital_sensor: 1, electric_motor: 1, plastic: 2 }, outputs: { scanner: 1 }, ticksToComplete: 8, age: 6 },
    { id: 'modem', inputs: { circuit_board: 2, plastic: 1 }, outputs: { modem: 1 }, ticksToComplete: 5, age: 6 },
    { id: 'router', inputs: { circuit_board: 2, plastic: 1, radio_transmitter: 1 }, outputs: { router: 1 }, ticksToComplete: 5, age: 6 },
    { id: 'digital_camera', inputs: { digital_sensor: 1, screen: 1, glass_lens: 1, battery: 1 }, outputs: { digital_camera: 1 }, ticksToComplete: 8, age: 6 },
    { id: 'mp3_player', inputs: { circuit_board: 1, screen: 1, battery: 1, plastic: 1 }, outputs: { mp3_player: 1 }, ticksToComplete: 5, age: 6 },
    { id: 'electronic_lock', inputs: { circuit_board: 1, electric_motor: 1, steel_plate: 1 }, outputs: { electronic_lock: 1 }, ticksToComplete: 6, age: 6 },
    { id: 'gps_device', inputs: { screen: 1, circuit_board: 1, battery: 1, radio_transmitter: 1 }, outputs: { gps_device: 1 }, ticksToComplete: 8, age: 6 },
    { id: 'barcode_scanner', inputs: { led: 1, digital_sensor: 1, plastic: 1 }, outputs: { barcode_scanner: 1 }, ticksToComplete: 5, age: 6 },
    { id: 'atm_machine', inputs: { computer: 1, safe: 1, screen: 1, steel_plate: 4 }, outputs: { atm_machine: 1 }, ticksToComplete: 25, age: 6 },
    { id: 'pos_terminal', inputs: { screen: 1, circuit_board: 1, keyboard: 1 }, outputs: { pos_terminal: 1 }, ticksToComplete: 8, age: 6 },
    { id: 'led_display', inputs: { led: 8, circuit_board: 2, aluminum_sheet: 2 }, outputs: { led_display: 1 }, ticksToComplete: 10, age: 6 },
    { id: 'surveillance_camera', inputs: { digital_camera: 1, electric_motor: 1 }, outputs: { surveillance_camera: 1 }, ticksToComplete: 10, age: 6 },
    { id: 'tablet', inputs: { screen: 1, motherboard: 1, battery: 1, aluminum_sheet: 1 }, outputs: { tablet: 1 }, ticksToComplete: 12, age: 6 },
    { id: 'bracket_assembly', inputs: { steel_bracket: 6, steel_plate: 1 }, outputs: { bracket_assembly: 1 }, ticksToComplete: 5, age: 6 },
    { id: 'computer_station', inputs: { computer: 1, monitor: 2, mouse: 1, keyboard: 1 }, outputs: { computer_station: 1 }, ticksToComplete: 20, age: 6 },
    { id: 'cable_organizer', inputs: { usb_cable: 4, plastic: 2 }, outputs: { cable_organizer: 1 }, ticksToComplete: 4, age: 6 },

    // --- AGE 7: FUTURE ---
    // - Updated with new logic for Age 7
    // Intermediates
    { id: 'adv_battery', inputs: { bauxite: 1, rare_earth_ore: 1, plastic: 1 }, outputs: { adv_battery: 1 }, ticksToComplete: 6, age: 7 },
    { id: 'composite', inputs: { plastic: 2, coal: 2 }, outputs: { composite: 1 }, ticksToComplete: 6, age: 7 },
    { id: 'graphene_sheet', inputs: { coal: 4, electric_coil: 2 }, outputs: { graphene_sheet: 1 }, ticksToComplete: 8, age: 7 },
    { id: 'nano_material', inputs: { composite: 1, silicon: 1 }, outputs: { nano_material: 1 }, ticksToComplete: 10, age: 7 },
    { id: 'superconductor', inputs: { rare_earth_ore: 2, copper_wire: 4 }, outputs: { superconductor: 1 }, ticksToComplete: 10, age: 7 },
    { id: 'quantum_processor', inputs: { superconductor: 2, silicon: 2, laser: 1 }, outputs: { quantum_processor: 1 }, ticksToComplete: 20, age: 7 },
    { id: 'ai_core', inputs: { quantum_processor: 1, motherboard: 2, rare_earth_ore: 2 }, outputs: { ai_core: 1 }, ticksToComplete: 30, age: 7 },
    { id: 'plasma_containment', inputs: { superconductor: 4, aluminum_sheet: 2 }, outputs: { plasma_containment: 1 }, ticksToComplete: 15, age: 7 },
    { id: 'fusion_core', inputs: { plasma_containment: 1, rare_earth_ore: 4 }, outputs: { fusion_core: 1 }, ticksToComplete: 40, age: 7 },
    { id: 'neural_interface', inputs: { digital_sensor: 2, ai_core: 1, nano_material: 1 }, outputs: { neural_interface: 1 }, ticksToComplete: 20, age: 7 },
    { id: 'holographic_projector', inputs: { laser: 2, glass_lens: 2, circuit_board: 2 }, outputs: { holographic_projector: 1 }, ticksToComplete: 12, age: 7 },
    { id: 'smart_fabric', inputs: { synthetic_fabric: 2, nano_material: 1, circuit_board: 1 }, outputs: { smart_fabric: 1 }, ticksToComplete: 8, age: 7 },
    { id: 'anti_grav_unit', inputs: { superconductor: 4, fusion_core: 1 }, outputs: { anti_grav_unit: 1 }, ticksToComplete: 50, age: 7 },
    { id: 'liquid_nitrogen', inputs: { coal: 2, rare_earth_ore: 1 }, outputs: { liquid_nitrogen: 2 }, ticksToComplete: 5, age: 7 },
    { id: 'helmet', inputs: { composite: 1, aluminum_sheet: 1, plastic: 1 }, outputs: { helmet: 1 }, ticksToComplete: 5, age: 7 },

    // Final Goods Age 7
    { id: 'smartphone', inputs: { cpu: 1, screen: 1, adv_battery: 1, camera: 1 }, outputs: { smartphone: 1 }, ticksToComplete: 10, age: 7 },
    { id: 'drone', inputs: { electric_motor: 4, adv_battery: 1, circuit_board: 1, composite: 1 }, outputs: { drone: 1 }, ticksToComplete: 10, age: 7 },
    { id: 'robot', inputs: { ai_core: 1, electric_motor: 6, composite: 4, adv_battery: 2 }, outputs: { robot: 1 }, ticksToComplete: 30, age: 7 },
    { id: 'vr_headset', inputs: { screen: 2, cpu: 1, plastic: 2, digital_sensor: 2 }, outputs: { vr_headset: 1 }, ticksToComplete: 12, age: 7 },
    { id: 'electric_car', inputs: { composite: 6, adv_battery: 4, electric_motor: 2, screen: 1 }, outputs: { electric_car: 1 }, ticksToComplete: 50, age: 7 },
    { id: 'laser', inputs: { rare_earth_ore: 1, glass: 2, circuit_board: 2 , cpu:1, power_supply:1}, outputs: { laser: 1 }, ticksToComplete: 15, age: 7 },
    { id: 'flying_car', inputs: { anti_grav_unit: 2, composite: 6, fusion_core: 1 }, outputs: { flying_car: 1 }, ticksToComplete: 100, age: 7 },
    { id: 'hoverboard', inputs: { anti_grav_unit: 1, composite: 2 }, outputs: { hoverboard: 1 }, ticksToComplete: 30, age: 7 },
    { id: 'printer_3d', inputs: { electric_motor: 3, aluminum_rod: 4, computer: 1 }, outputs: { printer_3d: 1 }, ticksToComplete: 20, age: 7 },
    { id: 'holographic_display', inputs: { holographic_projector: 4, nano_material: 2 }, outputs: { holographic_display: 1 }, ticksToComplete: 25, age: 7 },
    { id: 'ar_glasses', inputs: { holographic_projector: 1, cpu: 1, glass_lens: 2 }, outputs: { ar_glasses: 1 }, ticksToComplete: 15, age: 7 },
    { id: 'exoskeleton', inputs: { electric_motor: 8, composite: 4, ai_core: 1, adv_battery: 2 }, outputs: { exoskeleton: 1 }, ticksToComplete: 40, age: 7 },
    { id: 'personal_assistant_robot', inputs: { robot: 1, ai_core: 1, smart_fabric: 2 }, outputs: { personal_assistant_robot: 1 }, ticksToComplete: 50, age: 7 },
    { id: 'smart_home_hub', inputs: { ai_core: 1, radio_transmitter: 1, screen: 1 }, outputs: { smart_home_hub: 1 }, ticksToComplete: 20, age: 7 },
    { id: 'autonomous_vehicle', inputs: { electric_car: 1, ai_core: 2, digital_sensor: 6 }, outputs: { autonomous_vehicle: 1 }, ticksToComplete: 80, age: 7 },
    { id: 'space_suit', inputs: { smart_fabric: 6, composite: 2 }, outputs: { space_suit: 1 }, ticksToComplete: 30, age: 7 },
    { id: 'medical_scanner', inputs: { laser: 2, ai_core: 1, bed: 1 }, outputs: { medical_scanner: 1 }, ticksToComplete: 40, age: 7 },
    { id: 'quantum_computer', inputs: { quantum_processor: 4, plasma_containment: 1, server: 1 }, outputs: { quantum_computer: 1 }, ticksToComplete: 100, age: 7 },
    { id: 'teleporter_pad', inputs: { quantum_computer: 1, fusion_core: 2, nano_material: 10 }, outputs: { teleporter_pad: 1 }, ticksToComplete: 200, age: 7 },
    { id: 'energy_shield', inputs: { plasma_containment: 2, fusion_core: 1 }, outputs: { energy_shield: 1 }, ticksToComplete: 80, age: 7 },
    { id: 'weather_control', inputs: { quantum_computer: 1, digital_sensor: 20, anti_grav_unit: 4 }, outputs: { weather_control: 1 }, ticksToComplete: 150, age: 7 },
    { id: 'replicator', inputs: { quantum_computer: 1, teleporter_pad: 1, nano_material: 20 }, outputs: { replicator: 1 }, ticksToComplete: 300, age: 7 },
    { id: 'cryogenic_chamber', inputs: { liquid_nitrogen: 6, composite: 4, digital_sensor: 2 }, outputs: { cryogenic_chamber: 1 }, ticksToComplete: 60, age: 7 },
    { id: 'space_helmet', inputs: { helmet: 1, composite: 2, glass: 1 }, outputs: { space_helmet: 1 }, ticksToComplete: 15, age: 7 },
    { id: 'graphene_armor', inputs: { graphene_sheet: 8, composite: 4, nano_material: 2 }, outputs: { graphene_armor: 1 }, ticksToComplete: 40, age: 7 },
    { id: 'neural_implant', inputs: { neural_interface: 1, ai_core: 1, adv_battery: 1 }, outputs: { neural_implant: 1 }, ticksToComplete: 35, age: 7 },
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
    maxPopularity: 2.5,
    // External Market Events (random price fluctuations)
    eventChance: 0.003,          // 0.3% chance per item per tick
    eventMinModifier: 0.10,      // Minimum effect: 10%
    eventMaxModifier: 0.20,      // Maximum effect: 20%
    eventMinDuration: 30,        // Minimum duration: 30 ticks
    eventMaxDuration: 80         // Maximum duration: 80 ticks
  },

  // ============================================================================
  // Research
  // ============================================================================
  research: {
    // Existing
    energyCost: 3,
    discoveryChance: 0.25,          // Increased from 0.20
    proximityWeight: 0.5,

    // Research Points system - cheap early, scales with age
    creditsToRPRatio: 2,            // 2 credits = 1 RP (very efficient early game)
    ageMultipliers: { 1: 1.0, 2: 1.5, 3: 2.0, 4: 3.0, 5: 5.0, 6: 8.0, 7: 12.0 },
    passiveDiscoveryChance: 0.005,  // 1/200 per tick
    ageWeighting: { floor: 0.30, ceiling: 0.85 },
    // Keep early pacing similar, ease advanced-age research costs.
    experimentCosts: { 1: 15, 2: 35, 3: 75, 4: 140, 5: 280, 6: 460, 7: 900 },
    targetedExperimentMultiplier: 4, // Cheaper targeted catch-up for late-age pushes
    prototypeMultiplier: {
      // Age-scaled prototype requirements (applied per input with ceil).
      // Easier in early ages, with a gentler late-age ramp to avoid stalling progression.
      1: 2.0,
      2: 2.0,
      3: 2.1,
      4: 2.2,
      5: 2.3,
      6: 2.4,
      7: 2.4,
      default: 2.3,
    }
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
      animation: { frames: 4, speed: 0.03 },
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
      sizeX: 4, sizeY: 6,
      energyConsumption: 8,
      animation: { frames: 6, speed: 0.01, separateFrames: true },
      disableAutoScale: true,
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
      sizeX: 6, sizeY: 15,
      energyConsumption: 10,
      offsetX: 0, offsetY: 50,
      animation: { frames: 4, speed: 0.02, separateFrames: true},
      disableAutoScale: true,
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
      sizeX: 6, sizeY: 4,
      energyConsumption: 10,
      animation: { frames: 4, speed: 0.02, separateFrames: true },
      disableAutoScale: true,
      allowedRecipes: [
        'steel_ingot', 'aluminum_ingot', 'silicon', 'brass_ingot', 'bronze_ingot' // Consolidating all ingot/hot processing
      ]
    },
    {
      id: 'chemical_plant',
      itemId: 'chemical_plant',
      name: 'Chemical Plant',
      sizeX: 10, sizeY: 10,
      energyConsumption: 20,
      offsetX: 0, offsetY: 30,
      animation: { frames: 4, speed: 0.01, separateFrames: true  },
      disableAutoScale: true,
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
      passiveDiscoveryBonus: 0.001, // +0.1% per facility
      disabled: true // Disabled until the mechanic is finalized
    },
    {
      id: 'precision_assembler',
      itemId: 'precision_assembler',
      name: 'Precision Assembler',
      sizeX: 8, sizeY: 8,
      energyConsumption: 15,
      animation: { frames: 4, speed: 0.01, separateFrames: true  },
      specificScaleFactor: 0.7,
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
      sizeX: 8, sizeY: 8,
      energyConsumption: 50,
      animation: { frames: 3, speed: 0.01, separateFrames: true },
      specificScaleFactor: 0.7,
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
      id: 'thermal_generator',
      itemId: 'thermal_generator',
      name: 'Thermal Generator',
      sizeX: 3, sizeY: 6,
      energyOutput: 5,
      animation: { frames: 4, speed: 0.02, separateFrames: true },
      disableAutoScale: true,
      fuelRequirement: { materialId: 'wood', consumptionRate: 1 }
    },
    {
      id: 'windmill',
      itemId: 'windmill',
      name: 'Windmill',
      sizeX: 6, sizeY: 8,
      energyOutput: 30,
      disableAutoScale: true,
      animation: { frames: 4, speed: 0.005, separateFrames: true }
    },
    {
      id: 'coal_power_plant',
      itemId: 'coal_power_plant',
      name: 'Coal Power Plant',
      sizeX: 16, sizeY: 12,
      offsetX: 0, offsetY: 50,
      energyOutput: 500,
      disableAutoScale: true,
      animation: { frames: 4, speed: 0.01 , separateFrames: true},
      fuelRequirement: { materialId: 'coal', consumptionRate: 1 }
    },
    {
      id: 'diesel_gen',
      itemId: 'diesel_gen',
      name: 'Diesel Power Plant',
      sizeX: 16, sizeY: 12,
      offsetX: 0, offsetY: 50,
      energyOutput: 800,
      disableAutoScale: true,
      animation: { frames: 4, speed: 0.02, separateFrames: true },
      fuelRequirement: { materialId: 'diesel_fuel', consumptionRate: 1 }
    },
    {
      id: 'solar_array',
      itemId: 'solar_array',
      name: 'Solar Array',
      sizeX: 13, sizeY: 13,
      disableAutoScale: true,
      offsetX: 0, offsetY: 25,
      energyOutput: 100,
      animation: { frames: 3, speed: 0.005, separateFrames: true }
    },
    {
      id: 'nuclear_fission_reactor',
      itemId: 'nuclear_fission_reactor',
      name: 'Nuclear Reactor',
      sizeX: 30, sizeY: 30,
      offsetX: 0, offsetY: 400,
      energyOutput: 5000,
      disableAutoScale: true,
      animation: { frames: 2, speed: 0.005, separateFrames: true }
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
        { label: 'Structural Frame', material: 'iron_plate', quantity: 4 }
      ]
    },
    steel_forge: {
      slots: [
        { label: 'Heavy Plating', material: 'steel_ingot', quantity: 10 },
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
        { label: 'Drive Motors', material: 'drive_shaft', quantity: 2 },
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
    thermal_generator: {
      slots: [
        { label: 'Fire Bricks', material: 'stone_bricks', quantity: 6 },
        { label: 'Iron Grate', material: 'iron_plate', quantity: 2 },
        { label: 'Chimney', material: 'stone_bricks', quantity: 2 }
      ]
    },
    windmill: {
      slots: [
        { label: 'Main Sails', material: 'planks', quantity: 20 },
        { label: 'Tower Frame', material: 'wooden_beam', quantity: 8 },
        { label: 'Axle Supports', material: 'iron_rod', quantity: 4 },
        { label: 'Assembly Nails', material: 'nails', quantity: 20 },
        { label: 'Base Structure', material: 'stone_bricks', quantity: 10 }
      ]
    },
    coal_power_plant: {
      slots: [
        { label: 'Heavy Frame', material: 'steel_plate', quantity: 10 },
        { label: 'Pressure Boiler', material: 'boiler', quantity: 1 },
        { label: 'Power Pistons', material: 'piston', quantity: 2 },
        { label: 'Pressure Control', material: 'pressure_gauge', quantity: 3 },
        { label: 'Steam Pipes', material: 'pipe', quantity: 16 }
      ]
    },
    diesel_gen: {
      slots: [
        { label: 'Diesel Engines', material: 'engine_block', quantity: 2 },
        { label: 'Electric Generator', material: 'generator', quantity: 1 }
      ]
    },
    nuclear_fission_reactor: {
      slots: [
        { label: 'Reactor Vessel', material: 'steel_plate', quantity: 20 },
        { label: 'Containment Dome', material: 'concrete', quantity: 50 },
        { label: 'Cooling Loops', material: 'steel_pipe', quantity: 20 },
        { label: 'Coolant Pumps', material: 'industrial_pump', quantity: 15 },
        { label: 'Control Systems', material: 'computer', quantity: 10 },
        { label: 'Steam Valves', material: 'steam_valve', quantity: 10 },
        { label: 'Monitoring Panels', material: 'led_display', quantity: 10 },
        { label: 'Induction Generators', material: 'electric_coil', quantity: 10 },
        { label: 'Cooling Exhaust', material: 'insulated_pipe', quantity: 20 },
        { label: 'Cooling Layers', material: 'insulation', quantity: 30 }
      ]
    },
    solar_array: {
      slots: [
        { label: 'Solar Panels', material: 'solar_panel_item', quantity: 16 },
        { label: 'Mounting Frame', material: 'aluminum_sheet', quantity: 4 }
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
    costPerCell: 3,                 // Base cost per cell (was 1)
    expansionScaleFactor: 1.25,     // Each expansion costs 25% more than the last
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
    baseCostPerCell: 2,
    nodeUnlockCost: 15,             // Base cost for first node (was 8)
    globalNodeScaleFactor: 1.015,   // Each node unlock increases ALL future costs by 1.5%
    nodeSpawnChance: 0.20,
    nodeRateRange: { min: 1, max: 2 },
    // All nodes are standardized to the interval max to avoid hidden node-roll penalties.
    fixedNodeRatesByResource: {},
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
    },

    // Resource ages for ring-based filtering
    resourceAges: {
      wood: 1,
      stone: 1,
      iron_ore: 1,
      sand: 1,
      copper_ore: 2,
      clay: 2,
      coal: 3,
      oil: 4,
      bauxite: 5,
      rare_earth_ore: 7
    },

    // Ring boundaries (distance from center in tiles)
    // Inner ring: Age 1-2 resources only
    // Middle ring: Age 1-4 resources (adds coal, oil)
    // Outer ring: All ages (adds bauxite, rare earth)
    ringBoundaries: {
      inner: 20,
      middle: 48
    },

    // Spawn weights based on recipe demand analysis
    // Higher weight = spawns more frequently when eligible
    resourceSpawnWeights: {
      iron_ore: 1.00,
      copper_ore: 0.57,
      coal: 0.40,
      sand: 0.26,
      oil: 0.18,
      bauxite: 0.15,
      wood: 0.08,
      rare_earth_ore: 0.06,
      clay: 0.02,
      stone: 0.02
    },

    // Per-resource unlock cost scaling factors
    // Cost = nodeUnlockCost * resourceScaleFactor^(sameResourceCount) * globalScaleFactor^(totalNodes)
    // Higher factor = costs grow faster for that resource type
    unlockScaleFactors: {
      iron_ore: 1.18,               // Was 1.12 - most needed, still scales
      copper_ore: 1.20,             // Was 1.15
      coal: 1.22,                   // Was 1.18
      sand: 1.25,                   // Was 1.20
      oil: 1.30,                    // Was 1.25
      bauxite: 1.30,                // Was 1.25
      wood: 1.40,                   // Was 1.35 - steeper since it's fuel
      rare_earth_ore: 1.25,         // Was 1.20
      clay: 1.45,                   // Was 1.40
      stone: 1.45                   // Was 1.40
    },

    // Guaranteed minimum nodes in initial explored area
    // Players should unlock these for better production throughput
    guaranteedStartingNodes: {
      iron_ore: 3,
      wood: 2,
      stone: 2,
      sand: 2
    }
  }
};

function getStructureAge(structure, materialById) {
  const materialId = structure.itemId || structure.id;
  return materialById.get(materialId)?.age || 1;
}

function aggregateBuildSlotInputs(buildRecipe) {
  const inputs = {};
  for (const slot of buildRecipe?.slots || []) {
    if (!slot?.material) continue;
    const quantity = slot.quantity || 1;
    inputs[slot.material] = (inputs[slot.material] || 0) + quantity;
  }
  return inputs;
}

function createStructureBlueprintRecipes(rules) {
  const generated = [];
  const existingRecipeIds = new Set((rules.recipes || []).map(recipe => recipe.id));
  const materialById = new Map((rules.materials || []).map(material => [material.id, material]));

  const appendBlueprints = (structures, buildRecipes) => {
    for (const structure of structures || []) {
      if (structure?.disabled) continue;
      if (existingRecipeIds.has(structure.id)) continue;

      const buildRecipe = buildRecipes?.[structure.id];
      if (!buildRecipe?.slots?.length) continue;

      const inputs = aggregateBuildSlotInputs(buildRecipe);
      const outputId = structure.itemId || structure.id;
      if (!materialById.has(outputId) || Object.keys(inputs).length === 0) continue;

      const age = getStructureAge(structure, materialById);
      generated.push({
        id: structure.id,
        inputs,
        outputs: { [outputId]: 1 },
        ticksToComplete: Math.max(4, age + 3),
        age,
      });
      existingRecipeIds.add(structure.id);
    }
  };

  appendBlueprints(rules.machines, rules.machineRecipes);
  appendBlueprints(rules.generators, rules.generatorRecipes);

  return generated;
}

const structureBlueprintRecipes = createStructureBlueprintRecipes(defaultRules);
if (structureBlueprintRecipes.length > 0) {
  defaultRules.recipes.push(...structureBlueprintRecipes);
}
