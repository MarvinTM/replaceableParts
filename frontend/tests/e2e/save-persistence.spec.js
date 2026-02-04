import { test, expect } from '@playwright/test';

async function primeGuestMode(context) {
  await context.addInitScript(async () => {
    localStorage.setItem('replaceableParts-guestMode', 'true');
    // Bypass heavy asset loading so RequireAssets lets us in after reload
    try {
      const mod = await import('/src/services/assetLoaderService.js');
      mod.clearAssetCache();
      mod.areAssetsLoaded = () => true;
      mod.loadAllAssets = async () => ({});
      if (mod.default) {
        mod.default.areAssetsLoaded = () => true;
        mod.default.loadAllAssets = async () => ({});
      }
    } catch (e) {
      // ignore if module not yet available
    }
  });
  await context.route('**/api/**', route => route.fulfill({ status: 200, body: '{}' }));
}

async function startGuestGame(page, name = 'Persisted Game') {
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

async function placeMachineAndSave(page) {
  return await page.evaluate(async () => {
    const store = window.__GAME_STORE__ || (await import('/src/stores/gameStore.js')).default;
    const { defaultRules } = await import('/src/engine/defaultRules.js');

    // Make sure rules and state exist
    if (!store.getState().engineState) {
      store.getState().initNewGame();
    }

    // Unlock recipe and seed inventory
    store.getState().unlockRecipe('iron_ingot');
    store.setState(prev => ({
      ...prev,
      engineState: {
        ...prev.engineState,
        inventory: { ...prev.engineState.inventory, iron_ore: 50, coal: 50, wood: 50 },
        energy: { produced: 100, consumed: 0 },
      },
      rules: defaultRules,
    }), false, 'e2e/persist-seed');

    // Place windmill (no fuel) and a furnace
    store.getState().addGenerator('windmill', 0, 0);
    const addMachineRes = store.getState().addMachine('stone_furnace', 8, 0);
    const machineId = addMachineRes?.state?.machines?.slice(-1)[0]?.id;
    if (machineId) {
      store.getState().assignRecipe(machineId, 'iron_ingot', true);
    }

    // Run a few ticks
    for (let i = 0; i < 10; i++) store.getState().simulate();
    const state = store.getState().engineState;

    return {
      tick: state.tick,
      machines: state.machines.length,
      ingots: state.inventory.iron_ingot || 0,
    };
  });
}

async function reloadAndLoad(page) {
  await page.reload();
  // Landing may appear; wait for the prompt, click, then wait for menu
  await page.getByText(/click anywhere or press any key to continue/i).click({ timeout: 15000 });
  await page.waitForURL('**/menu', { timeout: 15000 });

  // Should show Continue since guest save exists
  const continueBtn = page.getByRole('button', { name: /Continue/i });
  await expect(continueBtn).toBeVisible();
  await continueBtn.click();
  await page.waitForURL('**/game');
}

async function waitForLoadedState(page, expected) {
  await expect.poll(async () => {
    return await page.evaluate(async ({ expectedMachines, expectedIngots, expectedTick }) => {
      const store = window.__GAME_STORE__ || (await import('/src/stores/gameStore.js')).default;
      const state = store.getState().engineState;
      const machines = state?.machines?.length || 0;
      const ingots = state?.inventory?.iron_ingot || 0;
      const tick = state?.tick || 0;
      return machines >= expectedMachines && ingots >= expectedIngots && tick >= expectedTick;
    }, {
      expectedMachines: expected.machines,
      expectedIngots: expected.ingots,
      expectedTick: expected.tick,
    });
  }, { timeout: 15000 }).toBe(true);
}

async function waitForGuestSave(page, expected) {
  await expect.poll(async () => {
    return await page.evaluate(async ({ expectedMachines, expectedIngots, expectedTick }) => {
      const savedRaw = localStorage.getItem('replaceableParts-guestSave');
      if (!savedRaw) return false;
      let saved;
      try {
        saved = JSON.parse(savedRaw);
      } catch {
        return false;
      }
      const data = saved?.data;
      const machines = data?.machines?.length || 0;
      const ingots = data?.inventory?.iron_ingot || 0;
      const tick = data?.tick || 0;
      return machines >= expectedMachines && ingots >= expectedIngots && tick >= expectedTick;
    }, {
      expectedMachines: expected.machines,
      expectedIngots: expected.ingots,
      expectedTick: expected.tick,
    });
  }, { timeout: 15000 }).toBe(true);
}

async function getStateSnapshot(page) {
  return await page.evaluate(async () => {
    const store = window.__GAME_STORE__ || (await import('/src/stores/gameStore.js')).default;
    const state = store.getState().engineState;
    return {
      tick: state?.tick,
      machines: state?.machines?.length || 0,
      ingots: state?.inventory?.iron_ingot || 0,
    };
  });
}

test.describe('Guest local save persistence', () => {
  test.beforeEach(async ({ context }) => {
    await primeGuestMode(context);
  });

  test('persists placed machine and inventory across reload', async ({ page }) => {
    await startGuestGame(page);
    const before = await placeMachineAndSave(page);
    await page.getByRole('button', { name: /save game/i }).click();
    await waitForGuestSave(page, before);
    await reloadAndLoad(page);
    await waitForLoadedState(page, before);
    const after = await getStateSnapshot(page);

    expect(after.machines).toBeGreaterThanOrEqual(before.machines);
    expect(after.ingots).toBeGreaterThanOrEqual(before.ingots);
    expect(after.tick).toBeGreaterThanOrEqual(before.tick);
  });
});
