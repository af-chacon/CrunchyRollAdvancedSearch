import { test, expect, Page, Locator } from '@playwright/test';

// Reads the "N results (Page X of Y)" line above the grid.
async function resultCount(page: Page): Promise<number> {
  const text = await page.locator('.results-count').innerText();
  const match = text.match(/^([\d,]+) results/);
  if (!match) throw new Error(`Unexpected results count text: ${text}`);
  return Number(match[1].replace(/,/g, ''));
}

function section(page: Page, label: string): Locator {
  return page.locator('.filter-section', {
    has: page.locator('.section-label', { hasText: label }),
  });
}

// Expands a collapsed filter section by its header label.
async function openSection(page: Page, label: string) {
  await section(page, label).locator('.section-toggle').click();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// A single language option, matched on its whole label -- "Name (count)" -- so
// that "English" cannot also pick up "English (India)".
function option(page: Page, sectionLabel: string, language: string): Locator {
  const label = new RegExp(`^${escapeRegExp(language)} \\(\\d+\\)$`);
  return section(page, sectionLabel)
    .locator('.tri-state-filter')
    .filter({ has: page.locator('.tri-state-label', { hasText: label }) });
}

// The facet count rendered in an option's label, e.g. "German (215)" -> 215.
async function optionCount(page: Page, sectionLabel: string, language: string): Promise<number> {
  const text = await option(page, sectionLabel, language).locator('.tri-state-label').innerText();
  const match = text.match(/\((\d+)\)$/);
  if (!match) throw new Error(`Unexpected option label: ${text}`);
  return Number(match[1]);
}

// The button cycles default -> include -> exclude -> default.
async function cycle(page: Page, sectionLabel: string, language: string, times: number) {
  const button = option(page, sectionLabel, language);
  for (let i = 0; i < times; i++) {
    await button.click();
  }
}

const INCLUDE = 1;
const EXCLUDE = 2;
const RESET = 3;

test.describe('Audio and subtitle language filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.anime-grid');
  });

  test('sections list languages with facet counts', async ({ page }) => {
    await openSection(page, 'Audio Language');
    await expect(option(page, 'Audio Language', 'Japanese').locator('.tri-state-label'))
      .toHaveText(/^Japanese \([1-9]\d*\)$/);

    await openSection(page, 'Subtitle Language');
    await expect(option(page, 'Subtitle Language', 'English').locator('.tri-state-label'))
      .toHaveText(/^English \([1-9]\d*\)$/);
  });

  test('options render display names, not raw locale codes', async ({ page }) => {
    await openSection(page, 'Audio Language');
    const labels = await section(page, 'Audio Language').locator('.tri-state-label').allInnerTexts();

    expect(labels.length).toBeGreaterThan(0);
    // Display names are capitalised and locale codes are not, which catches any
    // length of subtag ('ja-JP', 'fil-PH'). A lowercase name means the locale is
    // missing from LANGUAGE_NAMES in src/utils.ts -- add it there.
    for (const label of labels) {
      expect(label.replace(/\s*\(\d+\)$/, '')).toMatch(/^[A-Z]/);
    }
  });

  test('options are ordered by display name', async ({ page }) => {
    await openSection(page, 'Subtitle Language');
    const labels = await section(page, 'Subtitle Language').locator('.tri-state-label').allInnerTexts();
    const names = labels.map(label => label.replace(/\s*\(\d+\)$/, ''));

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  test('including a language narrows results to its facet count', async ({ page }) => {
    const total = await resultCount(page);

    await openSection(page, 'Audio Language');
    const german = await optionCount(page, 'Audio Language', 'German');
    await cycle(page, 'Audio Language', 'German', INCLUDE);

    // The facet count promises exactly what the filter delivers.
    expect(await resultCount(page)).toBe(german);
    expect(german).toBeGreaterThan(0);
    expect(german).toBeLessThan(total);
  });

  test('including two languages matches either one (OR), not both', async ({ page }) => {
    await openSection(page, 'Audio Language');

    const germanOnly = await optionCount(page, 'Audio Language', 'German');
    const frenchOnly = await optionCount(page, 'Audio Language', 'French');

    await cycle(page, 'Audio Language', 'German', INCLUDE);
    await cycle(page, 'Audio Language', 'French', INCLUDE);
    const either = await resultCount(page);

    // OR: the union is at least as large as either language alone, and no
    // larger than their sum. Under AND semantics this would be smaller.
    expect(either).toBeGreaterThan(germanOnly);
    expect(either).toBeGreaterThan(frenchOnly);
    expect(either).toBeLessThanOrEqual(germanOnly + frenchOnly);
  });

  test('excluding a language removes titles offering it', async ({ page }) => {
    const total = await resultCount(page);

    await openSection(page, 'Subtitle Language');
    const english = await optionCount(page, 'Subtitle Language', 'English');
    await cycle(page, 'Subtitle Language', 'English', EXCLUDE);

    expect(await resultCount(page)).toBe(total - english);
  });

  test('excluding beats including when a title offers both languages', async ({ page }) => {
    await openSection(page, 'Audio Language');

    await cycle(page, 'Audio Language', 'German', INCLUDE);
    const german = await resultCount(page);

    // Nearly every dub also ships the original Japanese track, so excluding it
    // must drop those titles even though German is included.
    await cycle(page, 'Audio Language', 'Japanese', EXCLUDE);
    expect(await resultCount(page)).toBeLessThan(german);
  });

  test('a third click clears an option again', async ({ page }) => {
    const total = await resultCount(page);

    await openSection(page, 'Audio Language');
    await cycle(page, 'Audio Language', 'German', INCLUDE);
    expect(await resultCount(page)).toBeLessThan(total);

    await cycle(page, 'Audio Language', 'German', RESET - INCLUDE);
    expect(await resultCount(page)).toBe(total);
  });

  test('audio and subtitle sections narrow each other', async ({ page }) => {
    await openSection(page, 'Audio Language');
    await cycle(page, 'Audio Language', 'German', INCLUDE);
    const germanDub = await resultCount(page);

    await openSection(page, 'Subtitle Language');
    await cycle(page, 'Subtitle Language', 'Italian', INCLUDE);

    // Separate sections still AND together, as every other section pair does.
    expect(await resultCount(page)).toBeLessThanOrEqual(germanDub);
  });

  test('facet counts funnel from the sections above', async ({ page }) => {
    await openSection(page, 'Subtitle Language');
    const italianBefore = await optionCount(page, 'Subtitle Language', 'Italian');

    await openSection(page, 'Audio Language');
    await cycle(page, 'Audio Language', 'German', INCLUDE);
    const germanDub = await resultCount(page);

    // Subtitle counts now describe only the German-dubbed titles above them.
    const italianAfter = await optionCount(page, 'Subtitle Language', 'Italian');
    expect(italianAfter).toBeLessThan(italianBefore);
    expect(italianAfter).toBeLessThanOrEqual(germanDub);
  });

  test('section header reports included and excluded counts', async ({ page }) => {
    await openSection(page, 'Audio Language');
    await cycle(page, 'Audio Language', 'German', INCLUDE);
    await cycle(page, 'Audio Language', 'French', EXCLUDE);

    await expect(section(page, 'Audio Language').locator('.filter-count')).toHaveText('1 inc, 1 exc');
  });

  test('language filters compose with the search box', async ({ page }) => {
    await page.locator('.search-input').fill('dragon');
    const searchOnly = await resultCount(page);
    expect(searchOnly).toBeGreaterThan(0);

    await openSection(page, 'Audio Language');
    await cycle(page, 'Audio Language', 'Japanese', INCLUDE);
    expect(await resultCount(page)).toBeLessThanOrEqual(searchOnly);
  });

  test('clear filters returns to the first page even with nothing selected', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.locator('.pagination button', { hasText: 'Next' }).click();
    }
    await expect(page.locator('.results-count')).not.toContainText('Page 1 of');

    // Regression guard: clearFilters must hand React a fresh filter object, or
    // the update bails out and the page-reset effect never runs.
    await page.locator('.clear-filters-btn').click();
    await expect(page.locator('.results-count')).toContainText('Page 1 of');
  });

  test('clear filters resets both language sections', async ({ page }) => {
    const total = await resultCount(page);

    await openSection(page, 'Audio Language');
    await cycle(page, 'Audio Language', 'German', INCLUDE);
    await openSection(page, 'Subtitle Language');
    await cycle(page, 'Subtitle Language', 'Italian', INCLUDE);
    expect(await resultCount(page)).toBeLessThan(total);

    await page.locator('.clear-filters-btn').click();

    expect(await resultCount(page)).toBe(total);
    await expect(section(page, 'Audio Language').locator('.filter-count')).toHaveCount(0);
    await expect(section(page, 'Subtitle Language').locator('.filter-count')).toHaveCount(0);
  });
});
