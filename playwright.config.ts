import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests/browser', workers: 1, timeout: 120000, use: { baseURL: 'http://localhost:9010', launchOptions: { executablePath: process.env.CI ? undefined : '/usr/bin/google-chrome' } }, webServer: { timeout: 180000, command: 'npx next start -p 9010', url: 'http://localhost:9010', reuseExistingServer: false } });
