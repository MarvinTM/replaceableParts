import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PrototypeWorkshop from '../../components/research/PrototypeWorkshop';

vi.mock('react-i18next', () => ({
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

vi.mock('../../components/research/PrototypeCard', () => ({
  default: ({ prototype, onBuildClick }) => (
    <button
      type="button"
      data-testid={`open-${prototype.recipeId}`}
      onClick={() => onBuildClick(prototype)}
    >
      open
    </button>
  ),
}));

vi.mock('../../components/research/PrototypeBuildPopup', () => ({
  default: ({ open, prototype }) => (
    open ? <div data-testid="prototype-popup">{prototype?.recipeId}</div> : null
  ),
}));

describe('PrototypeWorkshop popup state', () => {
  it('keeps popup open across tick updates for the same prototype id', () => {
    const rules = {
      recipes: [
        { id: 'recipe_1', outputs: { iron_plate: 1 } }
      ],
    };

    const firstProps = {
      rules,
      inventory: { iron_ingot: 5 },
      awaitingPrototype: [
        {
          recipeId: 'recipe_1',
          mode: 'slots',
          slots: [{ material: 'iron_ingot', quantity: 4, filled: 0 }]
        }
      ]
    };

    const { rerender } = render(<PrototypeWorkshop {...firstProps} />);
    fireEvent.click(screen.getByTestId('open-recipe_1'));
    expect(screen.getByTestId('prototype-popup')).toHaveTextContent('recipe_1');

    // Simulate a tick update that replaces prototype objects but keeps the same recipe id.
    rerender(
      <PrototypeWorkshop
        {...firstProps}
        awaitingPrototype={[
          {
            recipeId: 'recipe_1',
            mode: 'slots',
            slots: [{ material: 'iron_ingot', quantity: 4, filled: 1 }]
          }
        ]}
      />
    );

    expect(screen.getByTestId('prototype-popup')).toHaveTextContent('recipe_1');
  });

  it('keeps popup open when selected prototype is removed from awaiting list (completion flow)', () => {
    const rules = {
      recipes: [
        { id: 'recipe_1', outputs: { iron_plate: 1 } }
      ],
    };

    const firstProps = {
      rules,
      inventory: { iron_ingot: 5 },
      awaitingPrototype: [
        {
          recipeId: 'recipe_1',
          mode: 'slots',
          slots: [{ material: 'iron_ingot', quantity: 4, filled: 4 }]
        }
      ]
    };

    const { rerender } = render(<PrototypeWorkshop {...firstProps} />);
    fireEvent.click(screen.getByTestId('open-recipe_1'));
    expect(screen.getByTestId('prototype-popup')).toHaveTextContent('recipe_1');

    // Prototype disappears from awaiting list after completion/unlock.
    rerender(
      <PrototypeWorkshop
        {...firstProps}
        awaitingPrototype={[]}
      />
    );

    // Popup should remain mounted until it closes itself.
    expect(screen.getByTestId('prototype-popup')).toHaveTextContent('recipe_1');
  });
});
