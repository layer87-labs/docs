import type {Page} from '@playwright/test';
import {guardPage, loadPages, mermaidSources, norm, expect, test} from './helpers';

const CONCURRENCY = 4;

/** Runs `check` for every page with a few parallel tabs and fails once, listing every bad page. */
async function forEachPage(
  page: Page,
  baseURL: string,
  pages: string[],
  check: (p: Page, path: string) => Promise<string[]>,
) {
  const context = page.context();
  const failures: string[] = [];
  const queue = [...pages];
  await Promise.all(
    Array.from({length: CONCURRENCY}, async () => {
      const tab = await context.newPage();
      const problems = await guardPage(tab, baseURL);
      let current = '';
      while ((current = queue.shift() ?? '') !== '' || queue.length > 0) {
        const path = current;
        problems.pageErrors.length = problems.consoleErrors.length = problems.failedRequests.length = 0;
        try {
          const found = await check(tab, path);
          found.push(
            ...problems.pageErrors.map((m) => `pageerror: ${m}`),
            ...problems.consoleErrors.map((m) => `console.error: ${m}`),
            ...problems.failedRequests.map((m) => `request: ${m}`),
          );
          failures.push(...found.map((f) => `/${path}: ${f}`));
        } catch (e) {
          failures.push(`/${path}: ${(e as Error).message.split('\n')[0]}`);
        }
      }
      await tab.close();
    }),
  );
  expect(failures, `Problems found:\n${failures.join('\n')}\n`).toEqual([]);
}

let pages: string[];
test.beforeAll(async ({playwright, baseURL}) => {
  const request = await playwright.request.newContext();
  pages = await loadPages(request, baseURL!);
  await request.dispose();
});

test.describe('page health', () => {
  test.setTimeout(240_000);

  test('@smoke every page loads cleanly with one h1 and content', async ({page, baseURL}) => {
    await forEachPage(page, baseURL!, pages, async (tab, path) => {
      const out: string[] = [];
      const res = await tab.goto(path, {waitUntil: 'load'});
      if (res?.status() !== 200) out.push(`HTTP ${res?.status()}`);
      await tab.waitForLoadState('networkidle');
      const h1 = tab.locator('h1:visible');
      const n = await h1.count();
      if (n !== 1) out.push(`expected exactly one visible h1, found ${n}`);
      const text = ((await tab.locator('main').first().innerText()) ?? '').trim();
      if (text.length < 40) out.push(`main content is (nearly) empty (${text.length} chars)`);
      return out;
    });
  });
});

test.describe('styles', () => {
  for (const [label, width, height] of [['desktop', 1280, 800], ['mobile', 375, 800]] as const) {
    test(`@smoke stylesheet is applied at ${label} width`, async ({page, baseURL}) => {
      await guardPage(page, baseURL!);
      await page.setViewportSize({width, height});
      await page.goto('docs/relctl/intro');
      const navbar = page.locator('nav.navbar').first();
      await expect(navbar).toBeVisible();
      const s = await page.evaluate(() => {
        const cs = (sel: string) => getComputedStyle(document.querySelector(sel)!);
        return {
          navPosition: cs('nav.navbar').position,
          navBackground: cs('nav.navbar').backgroundColor,
          bodyFont: cs('body').fontFamily,
          articleFontSize: parseFloat(cs('article').fontSize),
          articleColor: cs('article').color,
          bodyBackground: cs('body').backgroundColor,
        };
      });
      expect(['sticky', 'fixed'], 'navbar position').toContain(s.navPosition);
      expect(s.navBackground, 'navbar background').not.toBe('rgba(0, 0, 0, 0)');
      expect(s.bodyFont, 'body font is the browser default').not.toMatch(/^("?Times New Roman"?|serif)$/i);
      expect(s.articleFontSize, 'article font size').toBeGreaterThan(14);
      expect(s.articleColor, 'article text color is the unstyled default').not.toBe('rgb(0, 0, 0)');
      expect(s.bodyBackground, 'body background is the unstyled default').not.toBe('rgba(0, 0, 0, 0)');
    });

    test(`no horizontal overflow on any page at ${label} width`, async ({page, baseURL}) => {
      test.setTimeout(240_000);
      await page.setViewportSize({width, height});
      await forEachPage(page, baseURL!, pages, async (tab, path) => {
        await tab.setViewportSize({width, height});
        await tab.goto(path, {waitUntil: 'load'});
        const m = await tab.evaluate(() => ({sw: document.documentElement.scrollWidth, iw: window.innerWidth}));
        return m.sw <= m.iw ? [] : [`horizontal overflow at ${m.iw}px: scrollWidth ${m.sw}`];
      });
    });
  }

  test('@smoke theme: data-theme and background follow the configured mode', async ({page, baseURL}) => {
    await guardPage(page, baseURL!);
    await page.goto('');
    const html = page.locator('html');
    const theme = await html.getAttribute('data-theme');
    expect(['dark', 'light']).toContain(theme);
    const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const lightness = async () => {
      const [r, g, b] = (await bg()).match(/\d+/g)!.map(Number);
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    };
    const toggle = page.locator('button[class*="toggleButton"]').first();
    if (await toggle.count()) {
      // Color mode switch is enabled: it must flip data-theme and the background.
      const before = await bg();
      await toggle.click();
      await expect(html).not.toHaveAttribute('data-theme', theme!);
      expect(await bg(), 'background color must change with the theme').not.toBe(before);
    } else {
      // Switch is disabled in the config (dark-only site): the background must match the theme.
      const l = await lightness();
      if (theme === 'dark') expect(l, 'dark theme needs a dark background').toBeLessThan(0.3);
      else expect(l, 'light theme needs a light background').toBeGreaterThan(0.7);
    }
  });
});

test.describe('mermaid', () => {
  test.setTimeout(240_000);
  test('every mermaid block renders as svg without syntax errors', async ({page, baseURL}) => {
    const sources = mermaidSources();
    expect(sources.length, 'no mermaid sources found under docs/').toBeGreaterThan(0);
    const known = new Set(pages.map(norm));
    const unmapped = sources.filter((s) => !known.has(norm(s.path)));
    expect(unmapped.map((s) => `${s.file} -> /${s.path}`), 'mermaid sources without a matching sitemap page').toEqual([]);

    const byPath = new Map(sources.map((s) => [norm(s.path), s]));
    await forEachPage(page, baseURL!, [...byPath.keys()], async (tab, path) => {
      const out: string[] = [];
      await tab.goto(path, {waitUntil: 'load'});
      const blocks = byPath.get(path)!.blocks;
      const svgs = tab.locator('.docusaurus-mermaid-container svg');
      try {
        await expect(svgs).toHaveCount(blocks, {timeout: 20_000});
      } catch {
        out.push(`expected ${blocks} rendered mermaid svg, found ${await svgs.count()}`);
      }
      const body = await tab.locator('body').innerText();
      if (/syntax error/i.test(body)) out.push('page shows a mermaid "Syntax error"');
      return out;
    });
  });
});

test.describe('navigation', () => {
  test('@smoke first-level sidebar and navbar links resolve', async ({page, baseURL, request}) => {
    await guardPage(page, baseURL!);
    await page.goto('docs/');
    const hrefs = await page.evaluate(() => {
      const sel = ['.theme-doc-sidebar-menu > li > a[href]', '.theme-doc-sidebar-menu > li > .menu__list-item-collapsible > a[href]', 'nav.navbar a[href]', 'footer a[href]'];
      return [...document.querySelectorAll(sel.join(','))].map((a) => (a as HTMLAnchorElement).href);
    });
    const origin = new URL(baseURL!).origin;
    const internal = [...new Set(hrefs.filter((h) => new URL(h).origin === origin).map((h) => h.split('#')[0]))];
    expect(internal.length, 'no sidebar links found').toBeGreaterThan(2);
    const bad: string[] = [];
    for (const href of internal) {
      const res = await request.get(href);
      if (res.status() !== 200) bad.push(`${res.status()} ${href}`);
    }
    expect(bad).toEqual([]);
  });

  test('search (when configured) does not crash', async ({page, baseURL}) => {
    const problems = await guardPage(page, baseURL!);
    await page.goto('');
    const search = page.locator('.navbar__search-input, button.DocSearch-Button, [class*="searchBar"] input');
    test.skip((await search.count()) === 0, 'no search configured on this site');
    await search.first().click();
    await page.keyboard.type('release');
    await page.waitForTimeout(500);
    expect(problems.pageErrors).toEqual([]);
  });
});
