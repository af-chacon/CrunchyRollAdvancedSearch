import { test, expect } from '@playwright/test';

test.describe('Theme Tests', () => {
  test('light theme renders correctly', async ({ page }) => {
    // Set color scheme to light
    await page.emulateMedia({ colorScheme: 'light' });

    // Navigate to the page
    await page.goto('/');

    // Wait for content to load
    await page.waitForSelector('.anime-grid');

    // Check search input has light background
    const searchInput = page.locator('.search-input');
    const searchInputBg = await searchInput.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(searchInputBg).toBe('rgb(249, 249, 249)');

    // Check search input has dark text
    const searchInputColor = await searchInput.evaluate((el) =>
      window.getComputedStyle(el).color
    );
    expect(searchInputColor).toBe('rgb(33, 53, 71)');

    // Check anime card has white background
    const animeCard = page.locator('.anime-card').first();
    const cardBg = await animeCard.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(cardBg).toBe('rgb(255, 255, 255)');

    // Check dropdown select has light background
    const select = page.locator('.per-page-selector select');
    const selectBg = await select.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(selectBg).toBe('rgb(249, 249, 249)');

    // Check page title has dark color (from :root)
    const root = page.locator(':root');
    const rootColor = await root.evaluate((el) =>
      window.getComputedStyle(el).color
    );
    expect(rootColor).toBe('rgb(33, 53, 71)');

    // Check page background is white
    const rootBg = await root.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(rootBg).toBe('rgb(255, 255, 255)');
  });

  test('dark theme renders correctly', async ({ page }) => {
    // Set color scheme to dark
    await page.emulateMedia({ colorScheme: 'dark' });

    // Navigate to the page
    await page.goto('/');

    // Wait for content to load
    await page.waitForSelector('.anime-grid');

    // Check search input has dark background
    const searchInput = page.locator('.search-input');
    const searchInputBg = await searchInput.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(searchInputBg).toBe('rgb(26, 26, 26)');

    // Check search input has light text
    const searchInputColor = await searchInput.evaluate((el) =>
      window.getComputedStyle(el).color
    );
    expect(searchInputColor).toBe('rgb(255, 255, 255)');

    // Check anime card has dark background
    const animeCard = page.locator('.anime-card').first();
    const cardBg = await animeCard.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(cardBg).toBe('rgb(26, 26, 26)');

    // Check dropdown select has dark background
    const select = page.locator('.per-page-selector select');
    const selectBg = await select.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(selectBg).toBe('rgb(26, 26, 26)');

    // Check page title has light color (from :root)
    const root = page.locator(':root');
    const rootColor = await root.evaluate((el) =>
      window.getComputedStyle(el).color
    );
    expect(rootColor).toBe('rgba(255, 255, 255, 0.87)');

    // Check page background is dark
    const rootBg = await root.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(rootBg).toBe('rgb(36, 36, 36)');
  });
});
