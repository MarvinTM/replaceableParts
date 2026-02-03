import { test, expect } from '@playwright/test';

async function primeGuestMode(context) {
  await context.addInitScript(() => {
    localStorage.setItem('replaceableParts-guestMode', 'true');
  });
  await context.route('**/api/**', route => route.fulfill({ status: 200, body: '{}' }));
}

async function startGuestGame(page, name = 'Market Run') {
  await page.goto('/');
  await page.getByText(/click anywhere or press any key to continue/i).click();
  await page.waitForURL('**/menu');

  const playAsGuest = page.getByRole('button', { name: /Play as Guest/i });
  if (await playAsGuest.count()) await playAsGuest.click();

  await page.getByRole('button', { name: /New Game/i }).click();
  await page.getByRole('dialog', { name: /Name Your Game/i }).getByPlaceholder(/Enter a name/i).fill(name);
  await page.getByRole('button', { name: /Create Game/i }).click();
  await page.waitForURL('**/game');

  const skipTutorial = page.getByRole('button', { name: /Skip tutorial/i });
  if (await skipTutorial.count()) await skipTutorial.click();
}

test.describe('Market sell and floor expansion', () => {
  test.beforeEach(async ({ context }) => {
    await primeGuestMode(context);
  });

  test('selling goods increases credits, buying floor expands grid', async ({ page }) => {
    await startGuestGame(page);

    const before = await page.evaluate(async () => {
      const store = (await import('/src/stores/gameStore.js')).default;
      const { defaultRules } = await import('/src/engine/defaultRules.js');

      if (!store.getState().engineState) store.getState().initNewGame();

      // Seed inventory, credits, and rules
      store.setState(prev => ({
        ...prev,
        rules: defaultRules,
        engineState: {
          ...prev.engineState,
          inventory: { ...prev.engineState.inventory, iron_ingot: 50 },
          credits: 100,
          floorSpace: { width: 16, height: 16, chunks: [{ x: 0, y: 0, width: 16, height: 16 }] },
        }
      }), false, 'e2e/market-seed');

      return {
        credits: store.getState().engineState.credits,
        width: store.getState().engineState.floorSpace.width,
      };
    });

    // Perform sell and buy actions inside the app state for determinism
    const after = await page.evaluate(async () => {
      const store = (await import('/src/stores/gameStore.js')).default;
      // Sell all iron ingots
      store.getState().sellGoods('iron_ingot', 50);
      // Buy floor space once
      store.getState().buyFloorSpace();
      const state = store.getState().engineState;
      return {
        credits: state.credits,
        width: state.floorSpace.width,
        ingots: state.inventory.iron_ingot || 0,
      };
    });

    expect(after.credits).toBeGreaterThan(before.credits);
    expect(after.width).toBeGreaterThan(before.width);
    expect(after.ingots).toBe(0);
  });
});
