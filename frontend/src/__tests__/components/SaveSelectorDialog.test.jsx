
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import SaveSelectorDialog from '../../components/SaveSelectorDialog';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

const mockDeleteSave = vi.fn();

vi.mock('../../contexts/GameContext', () => ({
  useGame: () => ({
    deleteSave: mockDeleteSave
  })
}));

const mockSaves = [
  { 
    id: 'save1', 
    name: 'Save 1', 
    updatedAt: '2023-01-01T12:00:00Z', 
    createdAt: '2023-01-01T10:00:00Z' 
  },
  { 
    id: 'save2', 
    name: 'Save 2', 
    updatedAt: '2023-01-02T12:00:00Z', 
    createdAt: '2023-01-02T10:00:00Z' 
  }
];

describe('SaveSelectorDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSelect: vi.fn(),
    saves: mockSaves,
    onExport: undefined
  };

  it('should render save slots', () => {
    render(<SaveSelectorDialog {...defaultProps} />);
    expect(screen.getByText('menu.loadGame')).toBeInTheDocument();
    expect(screen.getByText('Save 1')).toBeInTheDocument();
    expect(screen.getByText('Save 2')).toBeInTheDocument();
  });

  it('should render empty state message when no saves', () => {
    render(<SaveSelectorDialog {...defaultProps} saves={[]} />);
    expect(screen.getByText('saves.noSaves')).toBeInTheDocument();
  });

  it('should call onSelect when save is clicked', async () => {
    const user = userEvent.setup();
    render(<SaveSelectorDialog {...defaultProps} />);
    
    await user.click(screen.getByText('Save 1'));
    expect(defaultProps.onSelect).toHaveBeenCalledWith(mockSaves[0]);
  });

  it('should confirm before deleting', async () => {
    const user = userEvent.setup();
    render(<SaveSelectorDialog {...defaultProps} />);
    
    const deleteButtons = screen.getAllByRole('button').filter(b => b.querySelector('svg[data-testid="DeleteIcon"]'));
    // Click delete on first save
    await user.click(deleteButtons[0]);
    
    // Should verify it didn't call deleteSave yet (needs confirm)
    expect(mockDeleteSave).not.toHaveBeenCalled();
    
    // Click again to confirm
    await user.click(deleteButtons[0]);
    
    // Wait for async delete
    expect(mockDeleteSave).toHaveBeenCalledWith('save2'); // save2 is sorted first due to date
  });

  it('should call onExport when export button is clicked', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    render(<SaveSelectorDialog {...defaultProps} onExport={onExport} />);

    const exportButtons = screen.getAllByRole('button').filter(b => b.querySelector('svg[data-testid="DownloadIcon"]'));
    await user.click(exportButtons[0]);

    // save2 is rendered first because of updatedAt sorting
    expect(onExport).toHaveBeenCalledWith(mockSaves[1]);
  });
});
