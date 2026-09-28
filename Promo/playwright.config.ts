import { defineConfig } from '@playwright/test';

// BASE_URL задан → прогон против уже поднятого сайта (например, GitHub Pages
// https://elyorrakhmatullaev.github.io/Texnomart/promo/), свой сервер не нужен.
const BASE_URL = process.env.BASE_URL;
const LOCAL_URL = 'http://localhost:5183/';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL ?? LOCAL_URL,
    channel: process.env.PW_CHANNEL ?? 'chrome',
    locale: 'ru-RU',
    timezoneId: 'Asia/Tashkent',
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: BASE_URL
    ? undefined
    : {
        command: 'npx vite --port 5183 --strictPort',
        url: LOCAL_URL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
