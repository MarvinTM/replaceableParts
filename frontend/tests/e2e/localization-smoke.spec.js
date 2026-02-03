import { test, expect } from '@playwright/test';

async function primeGuestMode(context) {
  await context.addInitScript(() => {
    localStorage.setItem('replaceableParts-guestMode', 'true');
  });
  await context.route('**/api/**', route => route.fulfill({ status: 200, body: '{}' }));
}

async function startGuestMenu(page) {
  await page.goto('/');
  await page.getByText(/click anywhere or press any key to continue/i).click();
  await page.waitForURL('**/menu');
}

test.describe('Localization smoke', () => {
  test.beforeEach(async ({ context }) => {
    await primeGuestMode(context);
  });

  test('switch to French updates menu labels', async ({ page }) => {
    await startGuestMenu(page);

    // Open language menu (top-right)
    const langButton = page.locator('[data-lang-menu]');
    await langButton.click();
    await page.getByRole('menu').waitFor({ state: 'visible', timeout: 5000 });

    // Choose French (label is English before switching)
    await page.getByRole('menuitem', { name: /French/i }).click();

    // Assert key labels translated on menu buttons
    await expect(page.getByRole('button', { name: /Nouvelle Partie/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Se Connecter|Connexion/i })).toBeVisible();
  });
});
