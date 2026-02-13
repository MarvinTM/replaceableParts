import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VictoryScreen from '../../components/victory/VictoryScreen';

const mockNavigate = vi.fn();
const mockExitToMenu = vi.fn();

let mockVictory = { achieved: true, tick: 12345 };

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../contexts/GameContext', () => ({
  useGame: () => ({
    exitToMenu: mockExitToMenu,
  }),
}));

vi.mock('../../stores/gameStore', () => ({
  default: (selector) => selector({
    engineState: {
      victory: mockVictory,
    },
  }),
}));

describe('VictoryScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVictory = { achieved: true, tick: 12345 };
    mockExitToMenu.mockResolvedValue(undefined);
  });

  it('shows both victory actions', () => {
    render(<VictoryScreen />);

    expect(screen.getByRole('button', { name: 'Back to Main Menu' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue Playing' })).toBeInTheDocument();
  });

  it('dismisses the popup when continue is clicked', async () => {
    const user = userEvent.setup();
    render(<VictoryScreen />);

    await user.click(screen.getByRole('button', { name: 'Continue Playing' }));

    expect(screen.queryByText('Technological Singularity Achieved!')).not.toBeInTheDocument();
  });

  it('returns to menu when back-to-menu is clicked', async () => {
    const user = userEvent.setup();
    render(<VictoryScreen />);

    await user.click(screen.getByRole('button', { name: 'Back to Main Menu' }));

    await waitFor(() => {
      expect(mockExitToMenu).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/menu');
    });
  });
});
