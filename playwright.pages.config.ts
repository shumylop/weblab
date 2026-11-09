import { defineConfig, devices } from '@playwright/test';
const base = process.env.VITE_BASE_PATH || '/web-lab/';
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'pages.spec.ts',
  workers: 1,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://127.0.0.1:5191${base}`,
  },
  webServer: {
    command: 'npm run preview -- --port 5191 --strictPort',
    url: `http://127.0.0.1:5191${base}`,
    env: { VITE_BASE_PATH: base },
    reuseExistingServer: false,
  },
});
