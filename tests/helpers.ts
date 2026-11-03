import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs';
import {join, relative} from 'node:path';
import type {Page, APIRequestContext, TestInfo} from '@playwright/test';
import {test as base, expect} from '@playwright/test';

export {expect};

/** Path of a URL relative to the site base, without leading slash ('' = home). */
export function toSitePath(url: string, baseURL: string): string {
  const base = new URL(baseURL);
  const u = new URL(url, base);
  const basePath = base.pathname.replace(/\/$/, '');
  let p = u.pathname;
  if (basePath && p.startsWith(basePath)) p = p.slice(basePath.length);
  return p.replace(/^\//, '');
}

/** All page paths from sitemap.xml: the local build output if present, else the served site. */
export async function loadPages(request: APIRequestContext, baseURL: string): Promise<string[]> {
  let xml: string;
  const local = join(process.cwd(), 'build', 'sitemap.xml');
  if (!process.env.BASE_URL && existsSync(local)) {
    xml = readFileSync(local, 'utf8');
  } else {
    const res = await request.get(new URL('sitemap.xml', baseURL).toString());
    expect(res.status(), 'sitemap.xml must be reachable').toBe(200);
    xml = await res.text();
  }
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => toSitePath(m[1], baseURL));
  expect(paths.length, 'sitemap.xml lists no pages').toBeGreaterThan(5);
  return [...new Set(paths)];
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

/** Docs source files containing mermaid blocks, mapped to site paths (default slug rules). */
export function mermaidSources(): {path: string; blocks: number; file: string}[] {
  const root = join(process.cwd(), 'docs');
  return walk(root)
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => ({f, blocks: (readFileSync(f, 'utf8').match(/^```mermaid/gm) ?? []).length}))
    .filter((x) => x.blocks > 0)
    .map(({f, blocks}) => {
      let rel = relative(root, f).replace(/\.mdx?$/, '').replace(/\\/g, '/');
      rel = rel.replace(/(^|\/)(index|README)$/, '$1');
      return {path: `docs/${rel}`.replace(/\/$/, ''), blocks, file: relative(process.cwd(), f)};
    });
}

/** Normalise 'docs/x/' and 'docs/x' to one form for comparisons. */
export const norm = (p: string) => p.replace(/\/$/, '');

export interface Problems {
  pageErrors: string[];
  consoleErrors: string[];
  failedRequests: string[];
}

/**
 * Blocks every request to a host other than the site's own (analytics etc.) by answering it
 * locally, and records problems that matter: page errors, console errors and failed
 * same-origin requests.
 */
export async function guardPage(page: Page, baseURL: string): Promise<Problems> {
  const origin = new URL(baseURL).origin;
  const problems: Problems = {pageErrors: [], consoleErrors: [], failedRequests: []};

  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith('data:') || url.startsWith('blob:') || new URL(url).origin === origin) {
      return route.fallback();
    }
    const type = route.request().resourceType();
    return route.fulfill({
      status: 200,
      contentType: type === 'script' ? 'application/javascript' : type === 'stylesheet' ? 'text/css' : 'text/plain',
      body: '',
    });
  });

  page.on('pageerror', (e) => problems.pageErrors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') problems.consoleErrors.push(`${m.text()} (${m.location().url})`);
  });
  page.on('response', (r) => {
    if (new URL(r.url()).origin === origin && r.status() >= 400) {
      problems.failedRequests.push(`${r.status()} ${r.url()}`);
    }
  });
  page.on('requestfailed', (r) => {
    if (new URL(r.url()).origin === origin) {
      problems.failedRequests.push(`FAILED ${r.url()} (${r.failure()?.errorText})`);
    }
  });
  return problems;
}

export const test = base.extend<{guarded: Problems}>({
  guarded: async ({page, baseURL}, use) => {
    await use(await guardPage(page, baseURL!));
  },
});

export function attachProblems(testInfo: TestInfo, p: Problems) {
  return testInfo.attach('problems.json', {body: JSON.stringify(p, null, 2), contentType: 'application/json'});
}
