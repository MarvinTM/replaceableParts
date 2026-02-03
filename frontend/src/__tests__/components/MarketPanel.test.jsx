import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import MarketTab from '../../components/market/MarketTab';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

vi.mock('../../components/common/MaterialIcon', () => ({
  default: ({ materialId }) => <div data-testid={`icon-${materialId}`}>Icon</div>
}));

vi.mock('../../utils/currency', () => ({
  formatCredits: (amount) => `$${amount}`
}));

vi.mock('../../utils/translationHelpers', () => ({
  getMaterialName: (id, name) => name || id
}));

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null
}));

// Mock store
const mockSellGoods = vi.fn();
const mockEngineState = {
  credits: 1000,
  tick: 100,
  inventory: {
    'iron_ingot': 10,
    'copper_ingot': 5
  },
  discoveredRecipes: ['recipe_iron_ingot'],
  marketPopularity: {
    'iron_ingot': 1.2
  },
  marketEvents: {
    'iron_ingot': { modifier: 1.5, type: 'positive', expiresAt: 150 }
  },
  marketRecentSales: [],
  marketPriceHistory: []
};

const mockRules = {
  recipes: [
    { id: 'recipe_iron_ingot', outputs: { 'iron_ingot': 1 } }
  ],
  materials: [
    { id: 'iron_ingot', name: 'Iron Ingot', basePrice: 10, age: 1, category: 'final' }
  ],
  market: {
    obsolescenceEnabled: false,
    diversificationWindow: 100,
    diversificationBonuses: {}
  }
};

vi.mock('../../stores/gameStore', () => ({
  default: (selector) => {
    const state = {
      engineState: mockEngineState,
      rules: mockRules,
      sellGoods: mockSellGoods
    };
    return selector(state);
  }
}));

describe('MarketPanel', () => {
  it('should display items in inventory', () => {
    render(<MarketTab />);
    const items = screen.getAllByText('Iron Ingot');
    expect(items.length).toBeGreaterThan(0);
    expect(screen.getByText('market.inStock: 10')).toBeInTheDocument();
  });

  it('should show price with popularity and event modifier', () => {
    render(<MarketTab />);
    expect(screen.getByText('$18')).toBeInTheDocument();
  });

  it('should show market event indicator', () => {
    render(<MarketTab />);
    expect(screen.getByText('+50%')).toBeInTheDocument();
  });

  it('should select item on click', async () => {
    const user = userEvent.setup();
    render(<MarketTab />);
    // Click the specific stock text which is unique to the inventory card
    await user.click(screen.getByText('market.inStock: 10'));
    
    // Check for unique element in sell panel header
    // Using getAllByText and taking first as it might match other occurrences, 
    // but header is usually prominent.
    const headers = screen.getAllByText('market.sellPanel');
    expect(headers[0]).toBeInTheDocument();
    
    expect(screen.getByText('market.pricePerUnit: $18')).toBeInTheDocument();
  });

  it('should call sellGoods when sell button clicked', async () => {
    const user = userEvent.setup();
    render(<MarketTab />);
    await user.click(screen.getByText('market.inStock: 10'));
    
    // Find all buttons and filter for the one with sell text
    const buttons = screen.getAllByRole('button');
    const sellBtn = buttons.find(b => b.textContent.includes('market.sellFor'));
    
    if (!sellBtn) throw new Error('Sell button not found');
    await user.click(sellBtn);
    
    expect(mockSellGoods).toHaveBeenCalledWith('iron_ingot', 1);
  });

  it('should update total when quantity changes', async () => {
    const user = userEvent.setup();
    const { container } = render(<MarketTab />);
    await user.click(screen.getByText('market.inStock: 10'));
    
    // Find input - specifically type="number" to avoid checkboxes
    const input = container.querySelector('input[type="number"]');
    if (!input) throw new Error('Quantity input not found');
    
    // Using fireEvent directly to bypass user-event check if element is editable (MUI inputs can be tricky in tests)
    fireEvent.change(input, { target: { value: '5' } });
    
    expect(screen.getByText('market.total: $90')).toBeInTheDocument();
  });
});
