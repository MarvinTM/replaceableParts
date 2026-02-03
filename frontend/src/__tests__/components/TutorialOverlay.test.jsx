
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import TutorialOverlay from '../../components/tutorial/TutorialOverlay';

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

describe('TutorialOverlay', () => {
  it('should render first step content', () => {
    render(<TutorialOverlay open={true} onComplete={vi.fn()} />);
    expect(screen.getByText('tutorial.factory.title')).toBeInTheDocument();
    expect(screen.getByText('tutorial.factory.description')).toBeInTheDocument();
  });

  it('should navigate to next step', async () => {
    const user = userEvent.setup();
    render(<TutorialOverlay open={true} onComplete={vi.fn()} />);
    
    const nextBtn = screen.getByRole('button', { name: /tutorial.next/i });
    await user.click(nextBtn);
    
    // Step 2 is Power
    expect(screen.getByText('tutorial.power.title')).toBeInTheDocument();
  });

  it('should navigate back to previous step', async () => {
    const user = userEvent.setup();
    render(<TutorialOverlay open={true} onComplete={vi.fn()} />);
    
    // Go to step 2
    const nextBtn = screen.getByRole('button', { name: /tutorial.next/i });
    await user.click(nextBtn);
    expect(screen.getByText('tutorial.power.title')).toBeInTheDocument();
    
    // Go back to step 1
    const prevBtn = screen.getByRole('button', { name: /tutorial.previous/i });
    await user.click(prevBtn);
    expect(screen.getByText('tutorial.factory.title')).toBeInTheDocument();
  });

  it('should call onComplete on last step', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<TutorialOverlay open={true} onComplete={onComplete} />);
    
    // Click next 4 times to get to last step (5 screens total)
    const nextBtn = screen.getByRole('button', { name: /tutorial.next/i });
    await user.click(nextBtn);
    await user.click(nextBtn);
    await user.click(nextBtn);
    await user.click(nextBtn);
    
    // Should be on last step (Market)
    expect(screen.getByText('tutorial.market.title')).toBeInTheDocument();
    
    // Click start playing
    const startBtn = screen.getByRole('button', { name: /tutorial.startPlaying/i });
    await user.click(startBtn);
    
    expect(onComplete).toHaveBeenCalled();
  });

  it('should call onComplete when skipped', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<TutorialOverlay open={true} onComplete={onComplete} />);
    
    const skipBtn = screen.getByRole('button', { name: /tutorial.skip/i });
    await user.click(skipBtn);
    
    expect(onComplete).toHaveBeenCalled();
  });
});
