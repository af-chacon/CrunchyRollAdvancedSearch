import { test, expect, Page } from '@playwright/test';

// Reads the "N results (Page X of Y)" line above the grid.
async function resultCount(page: Page): Promise<number> {
  const text = await page.locator('.results-count').innerText();
  const match = text.match(/^([\d,]+) results/);
  if (!match) throw new Error(`Unexpected results count text: ${text}`);
  return Number(match[1].replace(/,/g, ''));
}

// Expands a collapsed filter section by its header label.
async function openSection(page: Page, label: string) {
  await page.locator('.section-toggle', { hasText: label }).click();
}

// Clicks a tri-state option the given number of times: once = include,
// twice = exclude (the button cycles default -> include -> exclude).
async function cycleOption(page: Page, section: string, option: string, times: number) {
  const button = page
    .locator('.filter-section', { has: page.locator('.section-label', { hasText: section }) })
    .locator('.tri-state-filter', { hasText: option });
  for (let i = 0; i < times; i++) {
    await button.click();
  }
}

test.describe('Audio and subtitle language filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.anime-grid');
  });

  test('sections list languages with facet counts', async ({ page }) => {
    await openSection(page, 'Audio Language');

    const japanese = page
      .locator('.filter-section', { has: page.locator('.section-label', { hasText: 'Audio Language' }) })
      .locator('.tri-state-filter', { hasText: 'Japanese' });

    // Label carries a display name and a non-zero count, e.g. "Japanese (1901)"
    await expect(japanese).toHaveText(/Japanese \([1-9]\d*\)/);
  });

  test('including a language narrows results', async ({ page }) => {
    const total = await resultCount(page);

    await openSection(page, 'Audio Language');
    await cycleOption(page, 'Audio Language', 'German', 1);

    const german = await resultCount(page);
    expect(german).toBeGreaterThan(0);
    expect(german).toBeLessThan(total);
  });

  test('including two languages matches either one (OR), not both', async ({ page }) => {
    await openSection(page, 'Audio Language');

    await cycleOption(page, 'Audio Language', 'German', 1);
    const german = await resultCount(page);

    await cycleOption(page, 'Audio Language', 'French', 1);
    const both = await resultCount(page);

    // OR semantics: adding a second language can only widen the result set.
    // Under AND semantics this would shrink instead.
    expect(both).toBeGreaterThan(german);
  });

  test('excluding a language removes titles offering it', async ({ page }) => {
    const total = await resultCount(page);

    await openSection(page, 'Subtitle Language');
    await cycleOption(page, 'Subtitle Language', 'English', 2);

    const withoutEnglish = await resultCount(page);
    expect(withoutEnglish).toBeGreaterThan(0);
    expect(withoutEnglish).toBeLessThan(total);
  });

  test('clear filters resets both language sections', async ({ page }) => {
    const total = await resultCount(page);

    await openSection(page, 'Audio Language');
    await cycleOption(page, 'Audio Language', 'German', 1);
    await openSection(page, 'Subtitle Language');
    await cycleOption(page, 'Subtitle Language', 'Italian', 1);
    expect(await resultCount(page)).toBeLessThan(total);

    await page.locator('.clear-filters-btn').click();
    expect(await resultCount(page)).toBe(total);
  });
});
