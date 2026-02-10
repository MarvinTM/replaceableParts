import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EncyclopediaTab from '../../components/encyclopedia/EncyclopediaTab';

const { mockStoreState } = vi.hoisted(() => ({
  mockStoreState: {
    engineState: {
      discoveredRecipes: ['thermal_generator', 'windmill'],
      unlockedRecipes: ['thermal_generator', 'windmill']
    },
    rules: {
      machines: [],
      materials: [
        { id: 'wood', name: 'Wood', category: 'raw', basePrice: 2 },
        { id: 'iron_ingot', name: 'Iron Ingot', category: 'intermediate', basePrice: 8 },
        { id: 'thermal_generator', name: 'Thermal Generator', category: 'equipment', basePrice: 250 },
        { id: 'windmill', name: 'Windmill', category: 'equipment', basePrice: 500 }
      ],
      recipes: [
        {
          id: 'thermal_generator',
          age: 3,
          ticks: 12,
          inputs: { iron_ingot: 5 },
          outputs: { thermal_generator: 1 }
        },
        {
          id: 'windmill',
          age: 3,
          ticks: 12,
          inputs: { iron_ingot: 8 },
          outputs: { windmill: 1 }
        }
      ],
      generators: [
        {
          id: 'thermal_generator',
          fuelRequirement: { materialId: 'wood', consumptionRate: 1 }
        },
        { id: 'windmill' }
      ]
    }
  }
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => {
      const labels = {
        'encyclopedia.fuelType': 'Fuel type',
        'encyclopedia.fuelConsumption': 'Fuel consumption'
      };
      return labels[key] || defaultValue || key;
    }
  })
}));

vi.mock('../../stores/gameStore', () => ({
  default: (selector) => selector(mockStoreState)
}));

vi.mock('../../components/common/MaterialIcon', () => ({
  default: ({ materialId, materialName }) => (
    <span data-testid={`material-icon-${materialId}`}>{materialName || materialId}</span>
  )
}));

vi.mock('../../components/common/StructureSpriteIcon', () => ({
  default: ({ materialName }) => <span>{materialName}</span>
}));

vi.mock('../../components/common/RecipeIODisplay', () => ({
  default: () => <div data-testid="recipe-io-display" />
}));

vi.mock('../../utils/currency', () => ({
  formatCredits: (value) => `${value}`
}));

vi.mock('../../utils/translationHelpers', () => ({
  getMaterialName: (id, fallbackName) => fallbackName || id,
  getRecipeName: (id) => {
    if (id === 'thermal_generator') return 'Thermal Generator';
    if (id === 'windmill') return 'Windmill';
    return id;
  },
  getMaterialDescription: () => 'description'
}));

describe('EncyclopediaTab', () => {
  it('shows fuel type and consumption for generators that require fuel', () => {
    render(<EncyclopediaTab />);

    fireEvent.click(screen.getAllByText('Thermal Generator')[0]);

    expect(screen.getByText('Fuel type')).toBeInTheDocument();
    expect(screen.getByTestId('material-icon-wood')).toBeInTheDocument();
    expect(screen.getByText('Fuel consumption')).toBeInTheDocument();
    expect(screen.getByText('1 / tick')).toBeInTheDocument();
  });

  it('does not show fuel fields for generators without fuel requirements', () => {
    render(<EncyclopediaTab />);

    fireEvent.click(screen.getAllByText('Windmill')[0]);

    expect(screen.queryByText('Fuel type')).not.toBeInTheDocument();
    expect(screen.queryByText('Fuel consumption')).not.toBeInTheDocument();
  });
});
