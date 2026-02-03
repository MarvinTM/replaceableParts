
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FactoryCanvas from '../../components/factory/FactoryCanvas';

// Mock PixiJS
vi.mock('pixi.js', () => {
  const Container = class {
    constructor() {
      this.children = [];
      this.scale = { set: vi.fn(), x: 1, y: 1 };
      this.x = 0;
      this.y = 0;
    }
    addChild = vi.fn();
    removeChildren = vi.fn().mockReturnValue([]);
    destroy = vi.fn();
  };
  
  const Application = class {
    constructor() {
      this.stage = new Container();
      this.canvas = document.createElement('canvas');
      this.destroy = vi.fn();
      this.ticker = { add: vi.fn(), remove: vi.fn() };
      this.renderer = { events: { cursorStyles: {} } };
      this.init = vi.fn().mockResolvedValue();
      this.screen = { width: 800, height: 600 };
    }
  };
  
  const Graphics = class {
      clear = vi.fn();
      fill = vi.fn();
      stroke = vi.fn();
      rect = vi.fn();
      circle = vi.fn();
      moveTo = vi.fn();
      lineTo = vi.fn();
      poly = vi.fn();
      roundRect = vi.fn();
      destroy = vi.fn();
  };
  
  const Sprite = class {
      anchor = { set: vi.fn() };
      scale = { set: vi.fn() };
      destroy = vi.fn();
      texture = { width: 0, height: 0 };
  };
  
  const AnimatedSprite = class {
      animationSpeed = 1;
      loop = true;
      play = vi.fn();
      stop = vi.fn();
      destroy = vi.fn();
      anchor = { set: vi.fn() };
      scale = { set: vi.fn() };
      gotoAndStop = vi.fn();
      texture = { width: 0, height: 0 };
  };
  
  const TilingSprite = class {
      tileScale = { set: vi.fn() };
      tilePosition = { x: 0, y: 0 };
      destroy = vi.fn();
  };
  
  const Text = class {
      anchor = { set: vi.fn() };
      destroy = vi.fn();
  };

  return {
    Application,
    Container,
    Graphics,
    Sprite,
    AnimatedSprite,
    TilingSprite,
    Text,
    Assets: {
      load: vi.fn().mockResolvedValue({ width: 100, height: 100 })
    },
    Texture: { from: vi.fn() },
    TextStyle: vi.fn()
  };
});

// Mock hooks
vi.mock('../../stores/gameStore', () => {
  const mockStore = {
    productionAnimationStyle: 'popAndFloat',
    pendingProductionEvents: [],
    clearProductionEvents: vi.fn(),
    currentSpeed: 'normal',
    startGameLoop: vi.fn(),
    stopGameLoop: vi.fn()
  };
  const useGameStore = (selector) => selector(mockStore);
  useGameStore.getState = () => mockStore;
  return {
    default: useGameStore,
    NORMAL_TICK_MS: 1000,
    FAST_TICK_MS: 200
  };
});

vi.mock('../../services/assetLoaderService', () => ({
  getFactoryAssets: vi.fn().mockReturnValue({
      floor: { light: {}, dark: {} },
      walls: { segment: {}, door: {} },
      terrain: { grass: [], road: {}, background: { source: { scaleMode: 'linear' } } },
      machines: {},
      generators: {}
  })
}));

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

// Mock useIsometric (can assume it just returns coords)
vi.mock('../../components/factory/useIsometric', () => ({
  gridToScreen: (x, y) => ({ x: x * 10, y: y * 10 }),
  screenToGrid: (x, y) => ({ x: Math.floor(x / 10), y: Math.floor(y / 10) }),
  getStructureScreenPosition: (x, y) => ({ x: x * 10, y: y * 10 }),
  getGridCenter: (w, h) => ({ x: w * 5, y: h * 5 }),
  TILE_WIDTH: 64,
  TILE_HEIGHT: 32,
  COLORS: { 
      floorLight: 0xffffff, 
      floorDark: 0x000000,
      machine: 0x00ff00,
      machineBlocked: 0xff0000,
      machineIdle: 0xcccccc,
      generator: 0xffff00,
      generatorUnpowered: 0x555555
  }
}));

const mockFloorSpace = {
  width: 10,
  height: 10,
  chunks: [{ x: 0, y: 0, width: 10, height: 10 }],
  placements: []
};

const mockMachines = [
  { id: 'm1', type: 'stone_furnace', x: 2, y: 2, enabled: true, status: 'working' }
];

const mockRules = {
  machines: [{ id: 'stone_furnace', sizeX: 3, sizeY: 3, name: 'Stone Furnace' }],
  generators: [],
  research: { energyCost: 10 }
};

describe('FactoryCanvas', () => {
  it('should render canvas container', async () => {
    let result;
    await act(async () => {
      result = render(
        <FactoryCanvas 
          floorSpace={mockFloorSpace}
          machines={mockMachines}
          generators={[]}
          rules={mockRules}
          engineState={{}}
        />
      );
    });
    
    expect(result.container.firstChild).toBeInTheDocument();
  });
});
