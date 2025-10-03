import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');

  // Expect page to have a title or heading
  await expect(page).toHaveTitle(/Vite \+ React/);
});
