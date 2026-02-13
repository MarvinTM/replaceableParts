import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RecipeDropdown from '../../components/factory/RecipeDropdown';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValueOrOptions, maybeOptions) => {
      const defaultValue = typeof defaultValueOrOptions === 'string'
        ? defaultValueOrOptions
        : maybeOptions?.defaultValue || defaultValueOrOptions?.defaultValue;

      if (key === 'game.factory.recipeCount') {
        const count = maybeOptions?.count ?? defaultValueOrOptions?.count ?? 0;
        return `${count} recipes available`;
      }

      if (key === 'game.factory.inputsCount') {
        const count = maybeOptions?.count ?? defaultValueOrOptions?.count ?? 0;
        return `${count} inputs`;
      }

      return defaultValue || key;
    },
  }),
}));

vi.mock('../../utils/translationHelpers', () => ({
  getRecipeName: (id) => `Recipe ${id}`,
  getMaterialName: (id, fallbackName) => fallbackName || id,
}));

vi.mock('../../components/common/RecipeIODisplay', () => ({
  default: ({ recipe }) => <div data-testid={`recipe-io-${recipe.id}`}>I/O</div>
}));

const mockMachine = {
  id: 'machine-1',
  type: 'precision_assembler',
  recipeId: 'beta_widget',
  enabled: true,
  status: 'working',
};

const mockRules = {
  machines: [
    {
      id: 'precision_assembler',
      allowedRecipes: ['alpha_widget', 'beta_widget', 'gamma_gear', 'delta_drive'],
    }
  ],
  recipes: [
    {
      id: 'alpha_widget',
      age: 1,
      inputs: { iron_plate: 1 },
      outputs: { alpha_widget: 1 },
    },
    {
      id: 'beta_widget',
      age: 2,
      inputs: { copper_wire: 2, iron_plate: 1 },
      outputs: { beta_widget: 1 },
    },
    {
      id: 'gamma_gear',
      age: 2,
      inputs: { steel_plate: 2 },
      outputs: { servo_gear: 1 },
    },
    {
      id: 'delta_drive',
      age: 3,
      inputs: { servo_gear: 1, copper_wire: 3 },
      outputs: { delta_drive: 1 },
    },
  ],
  materials: [
    { id: 'iron_plate', name: 'Iron Plate', category: 'intermediate' },
    { id: 'copper_wire', name: 'Copper Wire', category: 'intermediate' },
    { id: 'steel_plate', name: 'Steel Plate', category: 'intermediate' },
    { id: 'alpha_widget', name: 'Alpha Widget', category: 'final' },
    { id: 'beta_widget', name: 'Beta Widget', category: 'final' },
    { id: 'servo_gear', name: 'Servo Gear', category: 'intermediate' },
    { id: 'delta_drive', name: 'Delta Drive', category: 'final' },
  ],
};

const mockPosition = { top: 120, left: 160 };

describe('RecipeDropdown', () => {
  const buildProps = (overrides = {}) => ({
    machine: mockMachine,
    position: mockPosition,
    unlockedRecipes: ['alpha_widget', 'beta_widget', 'gamma_gear', 'delta_drive'],
    recentRecipeIds: [],
    rules: mockRules,
    onSelectRecipe: vi.fn(),
    onClose: vi.fn(),
    cheatMode: false,
    ...overrides,
  });

  it('pins the currently assigned recipe at the top of the recipe list', () => {
    render(<RecipeDropdown {...buildProps()} />);

    const list = screen.getByTestId('recipe-options-list');
    const recipeIds = Array.from(list.querySelectorAll('[data-recipe-id]'))
      .map((node) => node.getAttribute('data-recipe-id'));

    expect(recipeIds[0]).toBe('beta_widget');
  });

  it('filters recipes by search text across material names', () => {
    render(<RecipeDropdown {...buildProps()} />);

    const searchInput = screen.getByLabelText('Search recipes');
    fireEvent.change(searchInput, { target: { value: 'alpha widget' } });

    expect(screen.getByTestId('recipe-option-alpha_widget')).toBeInTheDocument();
    expect(screen.queryByTestId('recipe-option-beta_widget')).not.toBeInTheDocument();
    expect(screen.queryByTestId('recipe-option-gamma_gear')).not.toBeInTheDocument();
    expect(screen.queryByTestId('recipe-option-delta_drive')).not.toBeInTheDocument();
  });

  it('filters recipes by selected age chip', () => {
    render(<RecipeDropdown {...buildProps()} />);

    fireEvent.click(screen.getByRole('button', { name: 'T2' }));

    expect(screen.getByTestId('recipe-option-beta_widget')).toBeInTheDocument();
    expect(screen.getByTestId('recipe-option-gamma_gear')).toBeInTheDocument();
    expect(screen.queryByTestId('recipe-option-alpha_widget')).not.toBeInTheDocument();
    expect(screen.queryByTestId('recipe-option-delta_drive')).not.toBeInTheDocument();
  });

  it('shows and applies recent recipes filter in recency order', () => {
    render(<RecipeDropdown {...buildProps({ recentRecipeIds: ['delta_drive', 'alpha_widget'] })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Recent' }));

    const list = screen.getByTestId('recipe-options-list');
    const recipeIds = Array.from(list.querySelectorAll('[data-recipe-id]'))
      .map((node) => node.getAttribute('data-recipe-id'));

    expect(recipeIds).toEqual(['delta_drive', 'alpha_widget']);
    expect(screen.queryByTestId('recipe-option-beta_widget')).not.toBeInTheDocument();
    expect(screen.queryByTestId('recipe-option-gamma_gear')).not.toBeInTheDocument();
  });

  it('supports keyboard selection from the search input', () => {
    const onSelectRecipe = vi.fn();
    render(<RecipeDropdown {...buildProps({ onSelectRecipe })} />);

    const searchInput = screen.getByLabelText('Search recipes');
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(onSelectRecipe).toHaveBeenCalledWith('machine-1', 'alpha_widget');
  });
});
