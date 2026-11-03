import {defineConfig, devices} from '@playwright/test';

// BASE_URL set  -> test an already running site (e.g. the live site), no local server.
// BASE_URL unset -> serve the production build in ./build on a local port.
const PORT = Number(process.env.PORT ?? 3100);
const externalBaseUrl = process.env.BASE_URL;
const baseURL = (externalBaseUrl ?? `http://localhost:${PORT}/`).replace(/\/?$/, '/');
const chromiumPath = process.env.PW_CHROMIUM_PATH;

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  expect: {timeout: 15_000},
  reporter: process.env.CI
    ? [['list'], ['html', {open: 'never'}]]
    : [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
    launchOptions: chromiumPath ? {executablePath: chromiumPath} : {},
  },
  projects: [{name: 'chromium', use: {...devices['Desktop Chrome']}}],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: `pnpm exec docusaurus serve --port ${PORT} --no-open`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
