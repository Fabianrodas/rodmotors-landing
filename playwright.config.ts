import { defineConfig, devices } from '@playwright/test';

// Chromium real de @sparticuz/chromium: este entorno no tiene descarga de navegadores
// de Playwright, así que se apunta al binario ya instalado en /home/claude/render.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:4321', launchOptions: executablePath ? { executablePath, args: ['--no-sandbox'] } : {} },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'celular', use: { ...devices['Pixel 7'] } },
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
  ],
});
