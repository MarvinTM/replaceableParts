
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import LanguageMenu from '../../components/common/LanguageMenu';

const mockChangeLanguage = vi.fn();

// Mock translation and i18n constants
vi.mock('../../i18n', () => ({
  SUPPORTED_LANGUAGES: [
    { code: 'en', labelKey: 'English' },
    { code: 'es', labelKey: 'Spanish' }
  ]
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: 'en',
      changeLanguage: mockChangeLanguage
    }
  }),
}));

describe('LanguageMenu', () => {
  it('should render language icon button', () => {
    render(<LanguageMenu />);
    expect(screen.getByTestId('LanguageIcon')).toBeInTheDocument();
  });

  it('should open menu on click', async () => {
    const user = userEvent.setup();
    render(<LanguageMenu />);
    
    // MUI IconButton usually has role button
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Spanish')).toBeInTheDocument();
  });

  it('should highlight current language', async () => {
    const user = userEvent.setup();
    render(<LanguageMenu />);
    
    await user.click(screen.getByRole('button'));
    
    // In MUI Menu, selected item usually has 'Mui-selected' class or aria-selected
    // Or we can check if it calls changeLanguage correctly
    // Let's verify presence for now as 'selected' style is implementation detail of MUI
    const enItem = screen.getByText('English').closest('li');
    expect(enItem).toHaveClass('Mui-selected');
  });

  it('should change language on selection', async () => {
    const user = userEvent.setup();
    render(<LanguageMenu />);
    
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Spanish'));
    
    expect(mockChangeLanguage).toHaveBeenCalledWith('es');
  });
});
