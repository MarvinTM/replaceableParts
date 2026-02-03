import { test, expect } from '@playwright/test';

async function primeGuestMode(context) {
  await context.addInitScript(() => {
    localStorage.setItem('replaceableParts-guestMode', 'true');
  });
  await context.route('**/api/**', route => route.fulfill({ status: 200, body: '{}' }));
}

async function startGuestGame(page) {
  await page.goto('/');
  await page.getByText(/click anywhere or press any key to continue/i).click();
  await page.waitForURL('**/menu');

  const playAsGuest = page.getByRole('button', { name: /Play as Guest/i });
  if (await playAsGuest.count()) {
    await playAsGuest.click();
  }

  await page.getByRole('button', { name: /New Game/i }).click();
  await expect(page.getByRole('dialog', { name: /Name Your Game/i })).toBeVisible();
  await page.getByPlaceholder(/Enter a name for your game/i).fill('E2E Factory Flow');
  await page.getByRole('button', { name: /Create Game/i }).click();
  await page.waitForURL('**/game');

  const skipTutorial = page.getByRole('button', { name: /Skip tutorial/i });
  if (await skipTutorial.count()) await skipTutorial.click();
}

test.describe('Factory basics', () => {
  test.beforeEach(async ({ context }) => {
    await primeGuestMode(context);
  });

  test('place generator + furnace and produce ingots', async ({ page }) => {
    await startGuestGame(page);

    // Seed state and run simulation steps in the app context
    const result = await page.evaluate(async () => {
      const store = (await import('/src/stores/gameStore.js')).default;
      const rules = (await import('/src/engine/defaultRules.js')).defaultRules;

      // Ensure we have fuel and ore and sufficient power
      store.setState((prev) => ({
        ...prev,
        engineState: {
          ...prev.engineState,
          inventory: {
            ...prev.engineState.inventory,
            iron_ore: 200,
            coal: 200,
            wood: 200,
          },
          energy: { produced: 100, consumed: 0 },
        },
      }), false, 'e2e/seedInventory');

      // Unlock iron ingot recipe to allow assignment/production
      store.getState().unlockRecipe('iron_ingot');

      // Place power and furnace
      store.getState().addGenerator('windmill', 0, 0);
      const addMachineRes = store.getState().addMachine('stone_furnace', 8, 0);
      const machineId = addMachineRes?.state?.machines?.slice(-1)[0]?.id;
      if (machineId) {
        store.getState().assignRecipe(machineId, 'iron_ingot', true);
        // Pre-fill buffer to allow immediate production
        store.setState((prev) => {
          const recipe = prev.rules.recipes.find(r => r.id === 'iron_ingot');
          const machines = prev.engineState.machines.map(m =>
            m.id === machineId ? { ...m, internalBuffer: { ...recipe.inputs } } : m
          );
          return { ...prev, engineState: { ...prev.engineState, machines } };
        }, false, 'e2e/prefillBuffer');
      }

      // Run several ticks to allow production
      for (let i = 0; i < 60; i++) {
        store.getState().simulate();
      }

      const state = store.getState().engineState;
      return {
        tick: state.tick,
        credits: state.credits,
        ironIngots: state.inventory.iron_ingot || 0,
        energy: state.energy,
      };
    });

    expect(result.tick).toBeGreaterThan(0);
    expect(result.ironIngots).toBeGreaterThan(0);
    expect(result.energy.produced).toBeGreaterThan(0);
  });
});
