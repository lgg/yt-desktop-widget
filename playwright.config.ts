import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:34174',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run preview:e2e',
    url: 'http://127.0.0.1:34174',
    reuseExistingServer: false,
    env: {
      VITE_YTM_DATA_SOURCE: 'simulator',
    },
  },
});
