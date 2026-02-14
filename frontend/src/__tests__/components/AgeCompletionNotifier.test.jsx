import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AgeCompletionNotifier from '../../components/research/AgeCompletionNotifier';

const { mockStoreState } = vi.hoisted(() => ({
  mockStoreState: {
    engineState: {
      unlockedRecipes: ['r1'],
    },
    rules: {
      recipes: [
        { id: 'r1', outputs: { plank: 1 }, age: 1 },
        { id: 'r2', outputs: { rope: 1 }, age: 1 },
        { id: 'r3', outputs: { gear: 1 }, age: 2 },
      ],
      materials: [
        { id: 'plank', name: 'Plank', age: 1, category: 'intermediate' },
        { id: 'rope', name: 'Rope', age: 1, category: 'intermediate' },
        { id: 'gear', name: 'Gear', age: 2, category: 'intermediate' },
      ],
    },
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, values = {}) => {
      const labels = {
        'research.stoneAge': 'Stone Age',
        'research.age': 'Age {{age}}',
        'research.ageCompleteTitle': 'Age {{age}} Complete!',
        'research.ageCompleteSubtitle': 'All recipes in this age are now unlocked.',
        'research.ageCompleteProgress': '{{unlocked}} / {{total}} recipes unlocked',
        'research.continue': 'Continue',
        'research.replayAnimation': 'Replay animation',
      };
      const template = labels[key] || key;
      return template.replace(/\{\{(\w+)\}\}/g, (_, token) => String(values[token] ?? ''));
    },
  }),
}));

vi.mock('../../stores/gameStore', () => ({
  default: (selector) => selector(mockStoreState),
}));

describe('AgeCompletionNotifier', () => {
  beforeEach(() => {
    mockStoreState.engineState.unlockedRecipes = ['r1'];
  });

  it('shows the celebration dialog when an age becomes fully unlocked', async () => {
    const { rerender } = render(<AgeCompletionNotifier />);
    expect(screen.queryByText('Age 1 Complete!')).not.toBeInTheDocument();

    mockStoreState.engineState.unlockedRecipes = ['r1', 'r2'];
    rerender(<AgeCompletionNotifier />);

    expect(await screen.findByText('Age 1 Complete!')).toBeInTheDocument();
    expect(screen.getByText('2 / 2 recipes unlocked')).toBeInTheDocument();
  });

  it('does not show the dialog for already-completed ages on initial render', () => {
    mockStoreState.engineState.unlockedRecipes = ['r1', 'r2'];
    render(<AgeCompletionNotifier />);

    expect(screen.queryByText('Age 1 Complete!')).not.toBeInTheDocument();
  });
});
