import { test, expect, type Page } from '@playwright/test';

/** «Сейчас» режима кадра — FILM_NOW в src/film/frame-mode.ts (= FIXED_NOW e2e). */
const FILM_NOW = Date.parse('2026-09-28T12:00:00+05:00');

function frameUrl(path: string, q: Record<string, string> = {}) {
  const query = new URLSearchParams({
    'film-frame': '1',
    role: 'Коммерческий директор',
    user: 'u-1',
    theme: 'light',
    ...q,
  });
  return `${path}?${query}`;
}

test.describe('режим кадра', () => {
  test('вход из адреса, зафиксированная дата, анимации выключены', async ({ page }) => {
    await page.goto(frameUrl('short-calendar'));
    await expect(page.getByRole('heading', { name: 'Краткий промо-календарь' })).toBeVisible();
    expect(await page.evaluate(() => Date.now())).toBe(FILM_NOW);
    expect(await page.evaluate(() => new Date().getTime())).toBe(FILM_NOW);
    expect(await page.evaluate(() => new Date(2026, 0, 15).getDate())).toBe(15);
    const toggle = page.getByRole('button', { name: 'Переключить тему' });
    expect(await toggle.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');
  });

  test('роль, пользователь и тема берутся из адреса', async ({ page }) => {
    await page.goto(frameUrl('audit', { role: 'Администратор', user: 'u-2', theme: 'dark' }));
    await expect(page.getByRole('heading', { name: 'Аудит-лог и контроль сроков' })).toBeVisible();
    await expect(page.getByText('Администратор', { exact: true }).first()).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  });

  test('экран открывается от корня по film-path', async ({ page }) => {
    await page.goto(`?${new URLSearchParams({ 'film-frame': '1', 'film-path': 'audit', role: 'Коммерческий директор', user: 'u-1', theme: 'light' })}`);
    await expect(page.getByRole('heading', { name: 'Аудит-лог и контроль сроков' })).toBeVisible();
    expect(new URL(page.url()).pathname).toMatch(/\/audit$/); // и под базой GitHub Pages /…/promo/
  });

  test('кадр не пишет в хранилища вкладки', async ({ page, context }) => {
    await page.goto(frameUrl('short-calendar'));
    await expect(page.getByRole('heading', { name: 'Краткий промо-календарь' })).toBeVisible();
    await page.evaluate(() => localStorage.setItem('film-probe', '1'));
    // Контроль: в памяти кадра запись есть.
    expect(await page.evaluate(() => localStorage.getItem('film-probe'))).toBe('1');
    const other = await context.newPage();
    await other.goto('login');
    expect(await other.evaluate(() => localStorage.getItem('film-probe'))).toBeNull();
  });

  test('без film-frame приложение прежнее', async ({ page }) => {
    await page.goto('short-calendar');
    await expect(page).toHaveURL(/\/login/);
    const drift = Math.abs((await page.evaluate(() => Date.now())) - Date.now());
    expect(drift).toBeLessThan(60_000);
    const submit = page.getByRole('button', { name: 'Войти' });
    expect(await submit.evaluate((el) => getComputedStyle(el).transitionDuration)).not.toBe('0s');
  });
});

type Capture = {
  duration: number;
  chapters: { key: string; at: number; end: number }[];
  seek(t: number): Promise<void>;
};
declare global {
  interface Window {
    __capture?: Capture;
  }
}

async function openFilm(page: Page, query = '') {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(`embed/film?capture=1${query}`);
  await page.waitForFunction(() => !!window.__capture);
}
const seek = (page: Page, t: number) => page.evaluate((t) => window.__capture!.seek(t), t);
const chapters = (page: Page) => page.evaluate(() => window.__capture!.chapters);
async function shotAt(page: Page, t: number) {
  await seek(page, t);
  return page.screenshot();
}
const same = (a: Buffer, b: Buffer) => Buffer.compare(a, b) === 0;

test.describe('фильм: запись', () => {
  test('__capture: главы подряд от «hook», длительность — конец последней', async ({ page }) => {
    await openFilm(page);
    const cap = await page.evaluate(() => ({
      duration: window.__capture!.duration,
      chapters: window.__capture!.chapters,
    }));
    expect(cap.chapters[0]).toMatchObject({ key: 'hook', at: 0 });
    for (let i = 1; i < cap.chapters.length; i++) {
      expect(cap.chapters[i].at).toBe(cap.chapters[i - 1].end);
    }
    expect(cap.chapters.at(-1)!.end).toBe(cap.duration);
  });

  test('кадр фрагмента не зависит от пути перемотки', async ({ page }) => {
    await openFilm(page);
    const a = await shotAt(page, 1.2);
    await seek(page, 4);
    await seek(page, 0.2);
    const b = await shotAt(page, 1.2);
    expect(same(a, b)).toBe(true);
    const c = await shotAt(page, 1.5);
    expect(same(a, c)).toBe(false); // контроль: кадр меняется во времени
  });

  test('фильм всегда светлый, даже при тёмной теме вкладки', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('promo:pref-theme', 'dark'));
    await page.goto('login');
    await expect(page.locator('html')).toHaveClass(/\bdark\b/); // контроль: тема вкладки тёмная
    await openFilm(page);
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
  });

  test('без capture фильм играет сам и не отдаёт __capture', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('embed/film');
    await expect(page.getByText('9 ролей.')).toBeVisible();
    expect(await page.evaluate(() => window.__capture)).toBeUndefined();
    await expect(page.getByText('Сотни позиций.')).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('фильм: сцены-экраны', () => {
  test.setTimeout(120_000);

  test('plan: живой экран, кадр детерминирован, хранилища вкладки чистые', async ({ page }) => {
    await openFilm(page);
    const plan = (await chapters(page)).find((c) => c.key === 'plan')!;
    const a = await shotAt(page, plan.at + 4);
    await seek(page, plan.at + 5.5);
    await seek(page, plan.at + 1);
    const b = await shotAt(page, plan.at + 4);
    expect(same(a, b)).toBe(true);
    const c = await shotAt(page, plan.at + 4.5);
    expect(same(a, c)).toBe(false); // контроль: камера движется
    await expect(
      page.frameLocator('iframe[title="plan"]').getByRole('heading', { name: 'Краткий промо-календарь' }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => [sessionStorage.getItem('auth'), sessionStorage.getItem('promo:current-role')]),
    ).toEqual([null, null]);
    // Контроль: внутри кадра вход есть — в его памяти.
    const inner = page.frames().find((f) => f.url().includes('film-frame=1'))!;
    expect(await inner.evaluate(() => sessionStorage.getItem('auth'))).toBe('true');
  });

  test('fullcal: панорама прокручивает таблицу, кадр детерминирован', async ({ page }) => {
    await openFilm(page);
    const fc = (await chapters(page)).find((c) => c.key === 'fullcal')!;
    const a = await shotAt(page, fc.at + 3);
    await seek(page, fc.at + 5);
    await seek(page, fc.at + 1.5);
    const b = await shotAt(page, fc.at + 3);
    expect(same(a, b)).toBe(true);
    const frame = page.frames().find((f) => f.url().includes('/full-calendar?'))!;
    const maxScroll = () =>
      frame.evaluate(() =>
        Math.max(...[...document.querySelectorAll('div.overflow-x-auto')].map((el) => el.scrollLeft)),
      );
    expect(await maxScroll()).toBeGreaterThan(0);
    await seek(page, fc.at + 0.5); // до начала прокрутки — таблица в начале
    expect(await maxScroll()).toBe(0);
  });

  test('audit: вкладка и тема переключаются кликами, перемотка назад отменяет тему', async ({ page }) => {
    await openFilm(page);
    const au = (await chapters(page)).find((c) => c.key === 'audit')!;
    const frame = () => page.frames().find((f) => f.url().includes('/audit?'))!;
    const isDark = () => frame().evaluate(() => document.documentElement.classList.contains('dark'));
    const activeTab = () =>
      frame().evaluate(() => document.querySelector('[role="tab"][aria-selected="true"]')?.textContent?.trim());
    const a = await shotAt(page, au.at + 3);
    expect(await isDark()).toBe(true);
    expect(await activeTab()).toBe('Сроки по промо и отчётам');
    await seek(page, au.at + 1); // до клика по теме — окно перезагружается
    expect(await isDark()).toBe(false);
    expect(await activeTab()).toBe('Сроки по промо и отчётам');
    const b = await shotAt(page, au.at + 3);
    expect(same(a, b)).toBe(true);
  });
});

test.describe('фильм: сценарий', () => {
  test.setTimeout(120_000);

  test('32 с, восемь глав по порядку', async ({ page }) => {
    await openFilm(page);
    const cap = await page.evaluate(() => ({
      duration: window.__capture!.duration,
      keys: window.__capture!.chapters.map((c) => c.key),
    }));
    expect(cap).toEqual({
      duration: 32,
      keys: ['hook', 'logo', 'plan', 'grid', 'fullcal', 'change', 'audit', 'final'],
    });
  });

  test('фрагменты «сетка» и «было → стало» детерминированы и показывают посев', async ({ page }) => {
    await openFilm(page);
    const list = await chapters(page);
    const grid = list.find((c) => c.key === 'grid')!;
    const change = list.find((c) => c.key === 'change')!;
    const a = await shotAt(page, grid.at + 1);
    await seek(page, change.at + 3);
    const b = await shotAt(page, grid.at + 1);
    expect(same(a, b)).toBe(true);
    await expect(page.getByText('Чёрная пятница 2026')).toBeVisible();
    await expect(page.getByText('Летняя рассрочка на смартфоны')).toBeVisible();
    await seek(page, change.at + 3);
    await expect(page.getByText("Кофемашина De'Longhi Magnifica")).toBeVisible();
    await expect(page.getByText('Согласовано КД')).toBeVisible();
  });

  test('узбекская версия: переводятся титры, интерфейс остаётся русским', async ({ page }) => {
    await openFilm(page, '&lang=uz');
    const list = await chapters(page);
    await seek(page, list.find((c) => c.key === 'plan')!.at + 2);
    await expect(page.getByText('Yillik aksiyalar rejasi — bitta oynada')).toBeVisible();
    await seek(page, list.find((c) => c.key === 'change')!.at + 3);
    await expect(page.getByText('Цена по акции')).toBeVisible();
  });
});
