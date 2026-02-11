import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FactoryBottomBar from '../../components/factory/FactoryBottomBar';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue, options) => {
      const template = typeof defaultValue === 'string' ? defaultValue : key;
      if (!options || typeof template !== 'string') {
        return template;
      }
      return template.replace(/\{\{(\w+)\}\}/g, (_, name) => {
        if (Object.prototype.hasOwnProperty.call(options, name)) {
          return String(options[name]);
        }
        return `{{${name}}}`;
      });
    },
  }),
}));

vi.mock('../../components/common/MaterialIcon', () => ({
  default: ({ materialName }) => <span data-testid="material-icon">{materialName}</span>
}));

vi.mock('../../components/common/TickProgressIndicator', () => ({
  default: () => <div data-testid="tick-progress">TickProgress</div>
}));

vi.mock('../../utils/translationHelpers', () => ({
  getMaterialName: (id, defaultName) => defaultName || id
}));

vi.mock('@mui/material/Chip', () => ({
  default: ({ label, sx }) => (
    <div
      data-testid="mock-chip"
      data-border-color={sx?.borderColor ?? ''}
      data-background-color={sx?.backgroundColor ?? ''}
    >
      {label}
    </div>
  )
}));

const mockStartGameLoop = vi.fn();
const mockStopGameLoop = vi.fn();
const mockShipGoods = vi.fn(() => ({
  shipmentResult: {
    totalCredits: 1234,
  },
}));
const mockBuyInventorySpace = vi.fn();

vi.mock('../../stores/gameStore', () => ({
  default: (selector) => {
    const state = {
      currentSpeed: 'normal',
      startGameLoop: mockStartGameLoop,
      stopGameLoop: mockStopGameLoop,
      shipGoods: mockShipGoods,
      buyInventorySpace: mockBuyInventorySpace,
      engineState: {
        marketPopularity: {},
        marketEvents: {},
        marketRecentSales: [],
        discoveredRecipes: [],
      },
    };
    return selector(state);
  }
}));

const mockRules = {
  materials: [
    { id: 'iron_ingot', name: 'Iron Ingot', category: 'intermediate', basePrice: 5 },
    { id: 'wood', name: 'Wood', category: 'raw', basePrice: 1 },
    { id: 'widget', name: 'Widget', category: 'final', basePrice: 10, age: 1 }
  ],
  market: {
    diversificationWindow: 50,
    diversificationBonuses: {},
    obsolescenceEnabled: false,
    obsolescenceMaxDebuff: 0.5,
  },
  recipes: [],
};

describe('FactoryBottomBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display empty message when inventory is empty', () => {
    render(<FactoryBottomBar inventory={{}} rules={mockRules} tick={100} />);
    expect(screen.getByText('game.factory.emptyInventory')).toBeInTheDocument();
  });

  it('should display current tick', () => {
    render(<FactoryBottomBar inventory={{ iron_ingot: 10 }} rules={mockRules} tick={1234} />);
    expect(screen.getByText(/game.tick: 1234/)).toBeInTheDocument();
  });

  it('should show unlocked inventory capacity status in header', () => {
    render(
      <FactoryBottomBar
        inventory={{ iron_ingot: 10, wood: 20 }}
        rules={mockRules}
        tick={100}
        inventoryCapacity={100}
      />
    );

    expect(screen.getByText('Capacity: 100')).toBeInTheDocument();
  });

  it('should handle play controls interaction', async () => {
    const user = userEvent.setup();
    render(<FactoryBottomBar inventory={{ iron_ingot: 10 }} rules={mockRules} tick={100} />);

    const pauseBtn = screen.getByRole('button', { name: /Pause/i });
    const playBtn = screen.getByRole('button', { name: /Play/i });
    const fastBtn = screen.getByRole('button', { name: /Fast/i });

    await user.click(pauseBtn);
    expect(mockStopGameLoop).toHaveBeenCalled();

    await user.click(playBtn);
    expect(mockStartGameLoop).toHaveBeenCalledWith('normal');

    await user.click(fastBtn);
    expect(mockStartGameLoop).toHaveBeenCalledWith('fast');
  });

  it('should show a clear expand inventory action and handle clicks', async () => {
    const user = userEvent.setup();
    render(
      <FactoryBottomBar
        inventory={{ iron_ingot: 10 }}
        rules={mockRules}
        tick={100}
        inventoryCapacity={100}
        credits={1000}
      />
    );

    const expandButton = screen.getByRole('button', { name: 'Expand +100' });
    expect(expandButton).toBeInTheDocument();

    await user.hover(expandButton);
    expect(await screen.findByText('Increase max inventory by 100 (cost: 75₵)')).toBeInTheDocument();

    await user.click(expandButton);
    expect(mockBuyInventorySpace).toHaveBeenCalled();
  });

  it('should show a full storage indicator when a final good reaches stack capacity', () => {
    render(
      <FactoryBottomBar
        inventory={{ widget: 100 }}
        rules={mockRules}
        tick={100}
        inventoryCapacity={100}
      />
    );

    expect(screen.getAllByText(/Widget: 100\/100/).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Storage full').length).toBeGreaterThan(0);
  });

  it('should show projected shipment credits in the button and tooltip breakdown', async () => {
    const user = userEvent.setup();
    render(
      <FactoryBottomBar
        inventory={{ widget: 2 }}
        rules={mockRules}
        tick={100}
        inventoryCapacity={100}
      />
    );

    const shipButton = screen.getByRole('button', { name: 'Ship Goods (+20₵)' });
    expect(shipButton).toBeInTheDocument();

    await user.hover(shipButton);
    expect(await screen.findByText('Total: +20₵')).toBeInTheDocument();
    expect(screen.getByText('Widget x2: +20₵')).toBeInTheDocument();
  });

  it('should not show throughput values for final goods', () => {
    render(
      <FactoryBottomBar
        inventory={{ widget: 20 }}
        rules={mockRules}
        tick={100}
        inventoryCapacity={100}
        materialThroughput={new Map([['widget', { consumed: 3, produced: 7 }]])}
      />
    );

    expect(screen.getByText(/Widget: 20\/100/)).toBeInTheDocument();
    expect(screen.queryByText(/Widget: 20\/100 \(3\/7\)/)).not.toBeInTheDocument();
  });

  it('should color non-final deficits red when consumption is higher than production', () => {
    render(
      <FactoryBottomBar
        inventory={{ iron_ingot: 10 }}
        rules={mockRules}
        tick={100}
        inventoryCapacity={100}
        materialThroughput={new Map([['iron_ingot', { consumed: 5, produced: 2 }]])}
      />
    );

    const label = screen.getByText(/Iron Ingot: 10\/100 \(5\/2\)/);
    const chip = label.closest('[data-testid="mock-chip"]');

    expect(chip).toHaveAttribute('data-background-color', 'rgba(244, 67, 54, 0.08)');
    expect(chip).toHaveAttribute('data-border-color', 'rgba(244, 67, 54, 0.4)');
  });

  it('should show summary sections by default in the new inventory layout', () => {
    render(
      <FactoryBottomBar
        inventory={{ iron_ingot: 10, widget: 20 }}
        rules={mockRules}
        tick={100}
        inventoryCapacity={100}
        materialThroughput={new Map([['iron_ingot', { consumed: 5, produced: 2 }]])}
      />
    );

    expect(screen.getByText('Ready to Ship (1)')).toBeInTheDocument();
    expect(screen.getByText('Bottlenecks (1)')).toBeInTheDocument();
    expect(screen.getByText('Stockpile (0)')).toBeInTheDocument();

    const ready = screen.getByText('Ready to Ship (1)');
    const bottlenecks = screen.getByText('Bottlenecks (1)');
    const stockpile = screen.getByText('Stockpile (0)');

    expect(ready.compareDocumentPosition(bottlenecks) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(bottlenecks.compareDocumentPosition(stockpile) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('should show stockpile items by default', () => {
    render(
      <FactoryBottomBar
        inventory={{ wood: 90 }}
        rules={mockRules}
        tick={100}
        inventoryCapacity={100}
      />
    );

    expect(screen.getByText('Stockpile (1)')).toBeInTheDocument();
    expect(screen.getByText(/Wood: 90\/100/)).toBeInTheDocument();
  });

  it('should show stockpile overflow message when there are many stock items', () => {
    const manyStockRules = {
      materials: [
        ...mockRules.materials,
        ...Array.from({ length: 9 }, (_, i) => ({
          id: `stock_${i}`,
          name: `Stock ${i}`,
          category: 'intermediate',
        })),
      ],
    };

    const manyStockInventory = Object.fromEntries(
      Array.from({ length: 9 }, (_, i) => [`stock_${i}`, 100])
    );

    render(
      <FactoryBottomBar
        inventory={manyStockInventory}
        rules={manyStockRules}
        tick={100}
        inventoryCapacity={100}
      />
    );

    expect(screen.getByText('Stockpile (9)')).toBeInTheDocument();
    expect(screen.getByText(/\+\d+ more stock items/)).toBeInTheDocument();
  });

  it('should open drawer when clicking stockpile overflow message', async () => {
    const user = userEvent.setup();
    const manyStockRules = {
      materials: [
        ...mockRules.materials,
        ...Array.from({ length: 9 }, (_, i) => ({
          id: `stock_${i}`,
          name: `Stock ${i}`,
          category: 'intermediate',
        })),
      ],
    };

    const manyStockInventory = Object.fromEntries(
      Array.from({ length: 9 }, (_, i) => [`stock_${i}`, 100])
    );

    render(
      <FactoryBottomBar
        inventory={manyStockInventory}
        rules={manyStockRules}
        tick={100}
        inventoryCapacity={100}
      />
    );

    await user.click(screen.getByRole('button', { name: /\+\d+ more stock items/ }));

    expect(screen.getAllByText('Browse all parts').length).toBeGreaterThan(1);
  });

  it('should open the inventory browser drawer', async () => {
    const user = userEvent.setup();
    render(
      <FactoryBottomBar
        inventory={{ wood: 10, iron_ingot: 4, widget: 2 }}
        rules={mockRules}
        tick={100}
        inventoryCapacity={100}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Browse all parts' }));

    expect(screen.getAllByText('Browse all parts').length).toBeGreaterThan(1);
    expect(screen.getByText('3 unique items')).toBeInTheDocument();
  });

  it('should show status color labels in browse all parts rows', async () => {
    const user = userEvent.setup();
    render(
      <FactoryBottomBar
        inventory={{ iron_ingot: 10, wood: 90, widget: 100 }}
        rules={mockRules}
        tick={100}
        inventoryCapacity={100}
        materialThroughput={new Map([['iron_ingot', { consumed: 5, produced: 2 }]])}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Browse all parts' }));

    expect(screen.getByText('Deficit')).toBeInTheDocument();
    expect(screen.getByText('At cap')).toBeInTheDocument();
  });
});
