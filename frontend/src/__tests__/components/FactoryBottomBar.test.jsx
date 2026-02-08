
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import FactoryBottomBar from '../../components/factory/FactoryBottomBar';

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
  }),
}));

// Mock MaterialIcon
vi.mock('../../components/common/MaterialIcon', () => ({
  default: ({ materialName }) => <span data-testid="material-icon">{materialName}</span>
}));

// Mock TickProgressIndicator
vi.mock('../../components/common/TickProgressIndicator', () => ({
  default: () => <div data-testid="tick-progress">TickProgress</div>
}));

// Mock translation helpers
vi.mock('../../utils/translationHelpers', () => ({
  getMaterialName: (id, defaultName) => defaultName || id
}));

// Mock store
const mockStartGameLoop = vi.fn();
const mockStopGameLoop = vi.fn();

vi.mock('../../stores/gameStore', () => ({
  default: (selector) => {
    const state = {
      currentSpeed: 'normal',
      startGameLoop: mockStartGameLoop,
      stopGameLoop: mockStopGameLoop
    };
    return selector(state);
  }
}));

const mockInventory = {
  'iron_ingot': 10,
  'wood': 5
};

const mockRules = {
  materials: [
    { id: 'iron_ingot', name: 'Iron Ingot', category: 'intermediate' },
    { id: 'wood', name: 'Wood', category: 'raw' },
    { id: 'widget', name: 'Widget', category: 'final' }
  ]
};

describe('FactoryBottomBar', () => {
  it('should display inventory items and quantities', () => {
    render(<FactoryBottomBar inventory={mockInventory} rules={mockRules} tick={100} inventoryCapacity={100} />);
    
    expect(screen.getByText(/Iron Ingot: 10/)).toBeInTheDocument();
    expect(screen.getByText(/Wood: 5/)).toBeInTheDocument();
  });

  it('should display empty message when inventory is empty', () => {
    render(<FactoryBottomBar inventory={{}} rules={mockRules} tick={100} />);
    // Mocked t returns key if no default value provided
    expect(screen.getByText('game.factory.emptyInventory')).toBeInTheDocument();
  });

  it('should display current tick', () => {
    render(<FactoryBottomBar inventory={mockInventory} rules={mockRules} tick={1234} />);
    expect(screen.getByText(/game.tick: 1234/)).toBeInTheDocument();
  });

  it('should handle play controls interaction', async () => {
    const user = userEvent.setup();
    render(<FactoryBottomBar inventory={mockInventory} rules={mockRules} tick={100} />);
    
    // Find controls by tooltip title (we mocked t to return default value)
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

  it('should show a full storage indicator when a final good reaches stack capacity', () => {
    render(
      <FactoryBottomBar
        inventory={{ widget: 100 }}
        rules={mockRules}
        tick={100}
        inventoryCapacity={100}
      />
    );

    expect(screen.getByText(/Widget: 100\/100/)).toBeInTheDocument();
    expect(screen.getByLabelText('Storage full')).toBeInTheDocument();
  });

  it('should not show full storage indicator for non-final items', () => {
    render(
      <FactoryBottomBar
        inventory={{ wood: 100 }}
        rules={mockRules}
        tick={100}
        inventoryCapacity={100}
      />
    );

    expect(screen.getByText(/Wood: 100\/100/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Storage full')).not.toBeInTheDocument();
  });
});
