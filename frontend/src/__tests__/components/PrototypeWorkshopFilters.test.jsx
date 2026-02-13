import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import PrototypeWorkshop from '../../components/research/PrototypeWorkshop';

vi.mock('react-i18next', () => ({
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
  useTranslation: () => ({
    t: (key, options) => {
      if (key === 'market.age') return 'Age';
      const base = options?.defaultValue || key;
      if (!options) return base;
      return Object.entries(options).reduce((text, [param, value]) => {
        if (param === 'defaultValue') return text;
        return text.replace(`{{${param}}}`, String(value));
      }, base);
    },
  }),
}));

vi.mock('../../components/research/PrototypeCard', () => ({
  default: ({ prototype }) => <div data-testid="prototype-card">{prototype.recipeId}</div>,
}));

vi.mock('../../components/research/PrototypeBuildPopup', () => ({
  default: () => null,
}));

vi.mock('../../utils/translationHelpers', () => ({
  getMaterialName: (id, fallback) => fallback || id,
}));

describe('PrototypeWorkshop filters and sorting', () => {
  const rules = {
    recipes: [
      { id: 'recipe_new', outputs: { alpha_output: 1 }, age: 5 },
      { id: 'recipe_old', outputs: { beta_output: 1 }, age: 1 },
      { id: 'recipe_mid', outputs: { gamma_output: 1 }, age: 3 },
    ],
    materials: [
      { id: 'alpha_output', name: 'Zulu Output', age: 5 },
      { id: 'beta_output', name: 'Alpha Output', age: 1 },
      { id: 'gamma_output', name: 'Mike Output', age: 3 },
    ],
  };

  const awaitingPrototype = [
    { recipeId: 'recipe_new', mode: 'slots', slots: [] },
    { recipeId: 'recipe_old', mode: 'slots', slots: [] },
    { recipeId: 'recipe_mid', mode: 'slots', slots: [] },
  ];

  const renderWorkshop = () => {
    render(
      <PrototypeWorkshop
        awaitingPrototype={awaitingPrototype}
        rules={rules}
        inventory={{}}
      />
    );
  };

  it('sorts prototypes by age ascending by default', () => {
    renderWorkshop();
    const ids = screen.getAllByTestId('prototype-card').map((el) => el.textContent);
    expect(ids).toEqual(['recipe_old', 'recipe_mid', 'recipe_new']);
  });

  it('filters prototypes by search name', () => {
    renderWorkshop();
    fireEvent.change(screen.getByLabelText('Search by name'), {
      target: { value: 'Mike' },
    });

    const ids = screen.getAllByTestId('prototype-card').map((el) => el.textContent);
    expect(ids).toEqual(['recipe_mid']);
    expect(screen.getByText('Showing 1 of 3 prototypes')).toBeInTheDocument();
  });

  it('filters prototypes by selected age chips', () => {
    renderWorkshop();
    fireEvent.click(screen.getByRole('button', { name: 'Age 1' }));

    const ids = screen.getAllByTestId('prototype-card').map((el) => el.textContent);
    expect(ids).toEqual(['recipe_mid', 'recipe_new']);
    expect(screen.getByText('Showing 2 of 3 prototypes')).toBeInTheDocument();
  });

  it('changes sort order to name descending', () => {
    renderWorkshop();

    fireEvent.mouseDown(screen.getByRole('combobox'));
    const listbox = screen.getByRole('listbox');
    fireEvent.click(within(listbox).getByRole('option', { name: 'Name: Z -> A' }));

    const ids = screen.getAllByTestId('prototype-card').map((el) => el.textContent);
    expect(ids).toEqual(['recipe_new', 'recipe_mid', 'recipe_old']);
  });
});
