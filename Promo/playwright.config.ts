import { defineConfig } from '@playwright/test';

// BASE_URL задан → прогон против уже поднятого сайта (например, GitHub Pages
// https://elyorrakhmatullaev.github.io/Texnomart/promo/), свой сервер не нужен.
const BASE_URL = process.env.BASE_URL;
const LOCAL_URL = 'http://localhost:5183/';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  // Капа воркеров: по умолчанию Playwright берёт cpus/2 (на этой машине — 8 из 16
  // логических ядер), и все 8 реальных Chrome держат общий CPU на 97-100% весь
  // прогон (замерено Get-Counter '\Processor(_Total)\% Processor Time' поверх
  // штатного прогона — 19 из 20 замеров по 5с ≥ 97%). Под такой нагрузкой изредка
  // не укладывается в 30с общий цикл выбора даты в календаре (несколько кликов +
  // ожиданий подряд) — не логическая ошибка теста, а нехватка CPU. Меньше
  // воркеров = меньше одновременных Chrome = стабильно без изменения тестов.
  workers: 4,
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
