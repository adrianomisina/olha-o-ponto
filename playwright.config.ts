import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3400',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'PORT=3400 DISABLE_HMR=true npm run dev',
    url: 'http://127.0.0.1:3400/api/health',
    reuseExistingServer: false,
    timeout: 120000,
  },
});
