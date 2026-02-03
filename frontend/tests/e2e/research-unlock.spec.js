import { test, expect } from '@playwright/test';

async function primeGuestMode(context) {
  await context.addInitScript(() => {
    localStorage.setItem('replaceableParts-guestMode', 'true');
  });
  await context.route('**/api/**', route => route.fulfill({ status: 200, body: '{}' }));
}

async function startGuestGame(page, name = 'Research Run') {
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

test.describe('Research unlock flow', () => {
  test.beforeEach(async ({ context }) => {
    await primeGuestMode(context);
  });

  test('experiments unlock at least one recipe', async ({ page }) => {
    await startGuestGame(page);

    const result = await page.evaluate(async () => {
      const store = (await import('/src/stores/gameStore.js')).default;
      const { defaultRules } = await import('/src/engine/defaultRules.js');

      if (!store.getState().engineState) {
        store.getState().initNewGame();
      }

      store.setState(prev => ({
        ...prev,
        rules: defaultRules,
        engineState: {
          ...prev.engineState,
          energy: { produced: 100, consumed: 0 },
          research: {
            ...prev.engineState.research,
            active: true,
            researchPoints: 500,
            awaitingPrototype: [],
          },
          unlockedRecipes: [],
          discoveredRecipes: [],
        }
      }), false, 'e2e/research-seed');

      const beforeUnlocked = store.getState().engineState.unlockedRecipes.length;

      for (let i = 0; i < 15; i++) {
        const res = store.getState().runExperiment();
        // Auto-complete prototypes to unlock immediately
        if (res?.state?.research?.awaitingPrototype?.length) {
          const proto = res.state.research.awaitingPrototype[0];
          store.getState().fillPrototypeSlot(proto.recipeId, Object.keys(defaultRules.materials)[0], 1);
          store.getState().unlockRecipe(proto.recipeId);
        }
        // Advance ticks to progress research queue
        for (let t = 0; t < 30; t++) {
          store.getState().simulate();
        }
        if (store.getState().engineState.unlockedRecipes.length > 0) break;
      }

      const state = store.getState().engineState;
      return {
        unlocked: state.unlockedRecipes.length,
        discovered: state.discoveredRecipes.length,
        tick: state.tick,
      };
    });

    expect(result.unlocked).toBeGreaterThan(0);
    expect(result.discovered).toBeGreaterThan(0);
    expect(result.tick).toBeGreaterThan(0);
  });
});
