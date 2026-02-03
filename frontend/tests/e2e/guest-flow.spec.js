import { test, expect } from '@playwright/test';

// Helper: stub backend calls (guest flow uses local state)
async function setupRoutes(context) {
  await context.route('**/api/**', (route) => {
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

test.describe('Guest game smoke', () => {
  test.beforeEach(async ({ context }) => {
    // Force guest mode before app scripts run
    await context.addInitScript(async () => {
      localStorage.setItem('replaceableParts-guestMode', 'true');
    });

    await setupRoutes(context);
  });

  test('start new guest game reaches Factory tab', async ({ page }) => {
    // Start at landing and click through prompt
    await page.goto('/');
    await page.getByText(/click anywhere or press any key to continue/i).waitFor({ state: 'visible' });
    await page.mouse.click(10, 10);
    await page.waitForURL('**/menu');

    // Menu: enter guest mode and start a game
    const playAsGuest = page.getByRole('button', { name: /Play as Guest/i });
    if (await playAsGuest.count()) {
      await playAsGuest.click();
    }

    await page.getByRole('button', { name: /New Game/i }).click();

    // Guest naming dialog
    await expect(page.getByRole('dialog', { name: /Name Your Game/i })).toBeVisible();
    await page.getByPlaceholder(/Enter a name for your game/i).fill('E2E Guest Run');
    await page.getByRole('button', { name: /Create Game/i }).click();

    await page.waitForURL('**/game');
    // Close tutorial overlay if present
    const skipTutorial = page.getByRole('button', { name: /Skip tutorial/i });
    if (await skipTutorial.count()) {
      await skipTutorial.click();
    } else {
      const nextBtn = page.getByRole('button', { name: /Next/i });
      if (await nextBtn.count()) {
        await nextBtn.click();
      }
    }

    await expect(page.getByRole('tab', { name: /Factory/i })).toBeVisible();
  });
});
