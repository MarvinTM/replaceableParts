
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

  it('should show two columns with section headers when both final goods and parts exist', () => {
    render(
      <FactoryBottomBar
        inventory={{ widget: 20, wood: 30 }}
        rules={mockRules}
        tick={100}
        inventoryCapacity={100}
      />
    );

    expect(screen.getByText('Final Goods (1)')).toBeInTheDocument();
    expect(screen.getByText('Parts (1)')).toBeInTheDocument();
    const widget = screen.getByText(/Widget: 20\/100/);
    const wood = screen.getByText(/Wood: 30\/100/);
    expect(widget.compareDocumentPosition(wood) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('should show single column when only parts exist', () => {
    render(
      <FactoryBottomBar
        inventory={{ wood: 30, iron_ingot: 10 }}
        rules={mockRules}
        tick={100}
        inventoryCapacity={100}
      />
    );

    expect(screen.getByText('Parts (2)')).toBeInTheDocument();
    expect(screen.queryByText(/Final Goods/)).not.toBeInTheDocument();
  });

  it('should show single column when only final goods exist', () => {
    render(
      <FactoryBottomBar
        inventory={{ widget: 20 }}
        rules={mockRules}
        tick={100}
        inventoryCapacity={100}
      />
    );

    expect(screen.getByText('Final Goods (1)')).toBeInTheDocument();
    expect(screen.queryByText(/Parts/)).not.toBeInTheDocument();
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
});
