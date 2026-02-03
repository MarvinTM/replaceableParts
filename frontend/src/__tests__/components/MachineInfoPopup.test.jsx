import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MachineInfoPopup from '../../components/factory/MachineInfoPopup';

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
  }),
}));

// Mock MaterialIcon to avoid complex rendering and icon loading
vi.mock('../../components/common/MaterialIcon', () => ({
  default: ({ materialName }) => <div data-testid="material-icon">{materialName}</div>
}));

// Mock translation helpers
vi.mock('../../utils/translationHelpers', () => ({
  getRecipeName: (id) => `Recipe ${id}`,
  getMaterialName: (id, defaultName) => defaultName || id
}));

const mockMachine = {
  id: 'm1',
  type: 'stone_furnace',
  recipeId: 'iron_ingot',
  status: 'working',
  enabled: true,
  internalBuffer: { iron_ore: 2 },
  x: 0,
  y: 0
};

const mockMachineBlocked = {
  ...mockMachine,
  status: 'blocked',
  id: 'm2'
};

const mockMachineDisabled = {
  ...mockMachine,
  enabled: false,
  id: 'm3'
};

const mockRules = {
  machines: {
      baseEnergy: 5,
      list: [{ id: 'stone_furnace', name: 'Stone Furnace', energyConsumption: 10 }]
  },
  recipes: [
    { 
        id: 'iron_ingot', 
        name: 'Iron Ingot', 
        inputs: { iron_ore: 2 }, 
        outputs: { iron_ingot: 1 } 
    }
  ],
  materials: [
    { id: 'iron_ore', name: 'Iron Ore' },
    { id: 'iron_ingot', name: 'Iron Ingot' }
  ]
};

const mockPosition = { top: 100, left: 100 };

describe('MachineInfoPopup', () => {
  const defaultProps = {
    machine: mockMachine,
    position: mockPosition,
    rules: mockRules,
    onToggleEnabled: vi.fn(),
    onOpenRecipeSelector: vi.fn(),
    onClose: vi.fn()
  };

  it('should display machine name', () => {
    render(<MachineInfoPopup {...defaultProps} />);
    // "Production Machine" is the default translation key fallback
    expect(screen.getByText('Production Machine')).toBeInTheDocument();
  });

  it('should display machine status', () => {
    render(<MachineInfoPopup {...defaultProps} />);
    expect(screen.getByText('Working')).toBeInTheDocument();
  });

  it('should display recipe name', () => {
    render(<MachineInfoPopup {...defaultProps} />);
    expect(screen.getByText('Recipe iron_ingot')).toBeInTheDocument();
  });

  it('should display energy consumption', () => {
    render(<MachineInfoPopup {...defaultProps} />);
    // baseEnergy is 5 in mockRules.machines.baseEnergy
    expect(screen.getByText(/-5 \/ tick/)).toBeInTheDocument();
  });

  it('should show blocked status when machine is blocked', () => {
    render(<MachineInfoPopup {...defaultProps} machine={mockMachineBlocked} />);
    expect(screen.getByText('Blocked')).toBeInTheDocument();
  });

  it('should show disabled status when machine is disabled', () => {
    render(<MachineInfoPopup {...defaultProps} machine={mockMachineDisabled} />);
    const disabledTexts = screen.getAllByText('Disabled');
    expect(disabledTexts[0]).toBeInTheDocument();
  });

  it('should call onToggleEnabled when switch clicked', () => {
    render(<MachineInfoPopup {...defaultProps} />);
    const switchInput = screen.getByRole('checkbox'); // Switch renders as checkbox
    fireEvent.click(switchInput);
    expect(defaultProps.onToggleEnabled).toHaveBeenCalledWith('m1');
  });

  it('should call onOpenRecipeSelector when recipe button clicked', () => {
    render(<MachineInfoPopup {...defaultProps} />);
    const recipeButton = screen.getByText('Recipe iron_ingot'); 
    fireEvent.click(recipeButton);
    expect(defaultProps.onOpenRecipeSelector).toHaveBeenCalledWith(mockMachine);
  });
  
  it('should display inputs and outputs', () => {
      render(<MachineInfoPopup {...defaultProps} />);
      expect(screen.getByText('Iron Ore')).toBeInTheDocument();
      expect(screen.getByText('x2')).toBeInTheDocument(); // Input quantity
      // Output quantity x1 might be present
      expect(screen.getByText('x1')).toBeInTheDocument();
  });
});