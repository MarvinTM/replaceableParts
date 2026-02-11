import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FactoryBottomBar from '../../components/factory/FactoryBottomBar';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue, options) => {
      const template = typeof defaultValue === 'string' ? defaultValue : key;
      if (!options || typeof template !== 'string') {
        return template;
      }
      return template.replace(/\{\{(\w+)\}\}/g, (_, name) => String(options[name] ?? `{{${name}}}`));
    },
  }),
}));

vi.mock('../../components/common/MaterialIcon', () => ({
  default: ({ materialName }) => <div data-testid="material-icon">{materialName}</div>
}));

vi.mock('../../components/common/TickProgressIndicator', () => ({
  default: () => <div data-testid="tick-progress">TickProgress</div>
}));

vi.mock('../../utils/translationHelpers', () => ({
  getMaterialName: (id, defaultName) => defaultName || id
}));

vi.mock('../../stores/gameStore', () => ({
  default: (selector) => selector({
    currentSpeed: 'normal',
    startGameLoop: vi.fn(),
    stopGameLoop: vi.fn(),
    shipGoods: vi.fn(() => ({ shipmentResult: { totalCredits: 100 } })),
    buyInventorySpace: vi.fn(),
  })
}));

const mockRules = {
  materials: [
    { id: 'iron_ingot', name: 'Iron Ingot', category: 'intermediate', weight: 2 },
    { id: 'wood', name: 'Wood', category: 'raw', weight: 1 },
    { id: 'widget', name: 'Widget', category: 'final', weight: 1 },
  ]
};

describe('InventoryPanel (FactoryBottomBar)', () => {
  it('shows summary sections in default inventory layout', () => {
    render(
      <FactoryBottomBar
        inventory={{ iron_ingot: 10, widget: 5 }}
        rules={mockRules}
        tick={100}
        inventoryCapacity={100}
        materialThroughput={new Map([['iron_ingot', { consumed: 5, produced: 2 }]])}
      />
    );

    expect(screen.getByText('Ready to Ship (1)')).toBeInTheDocument();
    expect(screen.getByText('Bottlenecks (1)')).toBeInTheDocument();
    expect(screen.getByText('Stockpile (0)')).toBeInTheDocument();
  });

  it('shows stockpile items when inventory is near full', () => {
    render(
      <FactoryBottomBar
        inventory={{ wood: 95 }}
        rules={mockRules}
        tick={100}
        inventoryCapacity={100}
      />
    );

    expect(screen.getByText('Stockpile (1)')).toBeInTheDocument();
    expect(screen.getByText(/Wood: 95\/100/)).toBeInTheDocument();
  });

  it('shows empty inventory message when inventory is empty', () => {
    render(<FactoryBottomBar inventory={{}} rules={mockRules} tick={100} />);
    expect(screen.getByText('game.factory.emptyInventory')).toBeInTheDocument();
  });
});
