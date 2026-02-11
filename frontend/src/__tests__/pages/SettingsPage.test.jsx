import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from '../../pages/SettingsPage';

const mockNavigate = vi.fn();
const mockDeleteAccount = vi.fn();

let mockIsAuthenticated = true;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

vi.mock('react-i18next', () => ({
  initReactI18next: {
    type: '3rdParty',
    init: () => {}
  },
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn()
    }
  })
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    deleteAccount: mockDeleteAccount
  })
}));

const gameStoreState = {
  machineAnimationMode: 'disabled',
  productionAnimationStyle: 'floatingFadeOut',
  setMachineAnimationMode: vi.fn(),
  setProductionAnimationStyle: vi.fn()
};

vi.mock('../../stores/gameStore', () => ({
  default: (selector) => selector(gameStoreState)
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    mockIsAuthenticated = true;
    mockDeleteAccount.mockReset();
    mockDeleteAccount.mockResolvedValue(undefined);
    mockNavigate.mockReset();
  });

  it('shows delete account section for authenticated users', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('settings.deleteAccount.title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'settings.deleteAccount.action' })).toBeInTheDocument();
  });

  it('hides delete account section for guests', () => {
    mockIsAuthenticated = false;

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    expect(screen.queryByText('settings.deleteAccount.title')).not.toBeInTheDocument();
  });

  it('requires DELETE confirmation before deleting account', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: 'settings.deleteAccount.action' }));

    const confirmButton = screen.getByRole('button', { name: 'settings.deleteAccount.confirm' });
    expect(confirmButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText('DELETE'), 'DELETE');
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalledTimes(1);
    });
    expect(mockNavigate).toHaveBeenCalledWith('/menu', { replace: true });
  });
});
