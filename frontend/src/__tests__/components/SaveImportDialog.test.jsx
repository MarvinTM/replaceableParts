import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SaveImportDialog from '../../components/SaveImportDialog';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

describe('SaveImportDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onImportReady: vi.fn()
  };

  it('parses a valid file and forwards payload', async () => {
    const onImportReady = vi.fn();
    render(
      <SaveImportDialog {...defaultProps} onImportReady={onImportReady} />
    );

    const input = screen.getByTestId('save-import-file-input');
    const file = new File(
      [JSON.stringify({ format: 'replaceableParts-save', version: 1, save: { name: 'Cloud Save', data: { tick: 10 } } })],
      'save-export.rpsave.json',
      { type: 'application/json' }
    );

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onImportReady).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            format: 'replaceableParts-save'
          }),
          suggestedName: 'Cloud Save'
        })
      );
    });
  });

  it('shows error on invalid JSON file', async () => {
    render(<SaveImportDialog {...defaultProps} />);
    const input = screen.getByTestId('save-import-file-input');
    const badFile = new File(['not-json'], 'bad.json', { type: 'application/json' });

    fireEvent.change(input, { target: { files: [badFile] } });

    expect(await screen.findByText('saves.importInvalidFile')).toBeInTheDocument();
  });

  it('shows error when file exceeds max size', async () => {
    render(<SaveImportDialog {...defaultProps} maxFileSizeBytes={5} />);
    const input = screen.getByTestId('save-import-file-input');
    const largeFile = new File(['123456'], 'large.rpsave.json', { type: 'application/json' });

    fireEvent.change(input, { target: { files: [largeFile] } });

    expect(await screen.findByText('saves.importFileTooLarge')).toBeInTheDocument();
  });
});
